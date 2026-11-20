// Bey Perde yönetim paneli API'si (Vercel sunucusuz fonksiyonu) — /api/admin
//
// Gerekli ortam değişkenleri (Vercel → Project → Settings → Environment Variables):
//   ADMIN_PASSWORD           Panel şifresi (yalnızca sunucuda tutulur)
//   ADMIN_SESSION_SECRET     Oturum çerezini imzalamak için uzun, rastgele bir metin
//   Veri deposu (biri yeterli):
//     DATABASE_URL           Neon Postgres bağlantısı (Vercel'deki Neon entegrasyonu kendisi ekler)
//     UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (ya da KV_REST_API_URL / KV_REST_API_TOKEN)
// Bunlar eksikse fonksiyon 503 döner; panel "kurulum eksik" uyarısı gösterir, sahte veri göstermez.
'use strict';

const crypto = require('crypto');

const COLS = ['kalemler', 'satislar', 'alislar', 'giderler', 'ayarlar', 'virmanlar'];   // 'all' ile yüklenen ve yedeğe giren kayıtlar
const FOTO = 'fotolar';            // sipariş fotoğrafları: yalnızca ilgili sipariş açılınca yüklenir
const YEDEK = 'yedekler', YMETA = 'yedekmeta';
const KEEP_SNAPSHOTS = 6, SNAPSHOT_DAYS = 7;
const MAX_FOTO = 900 * 1024;
const PREFIX = 'bp:admin:';
const SESSION_HOURS = 12;
const MAX_DOC = 200 * 1024;
const MAX_BODY = 3.5 * 1024 * 1024;
const attempts = new Map();   // basit, örnek başına giriş denemesi sınırı

/* ---------- veri deposu: Neon Postgres (HTTP) ya da Upstash Redis (REST); ek kütüphane gerekmez ---------- */
function storeConfig(env) {
  const pg = env.DATABASE_URL || env.POSTGRES_URL;
  if (pg && /^postgres(ql)?:\/\//.test(pg)) return { kind: 'neon', conn: pg };
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  return url && token ? { kind: 'redis', url: url.replace(/\/$/, ''), token } : null;
}
function makeStore(cfg, fetchImpl) { return cfg.kind === 'neon' ? makeNeonStore(cfg, fetchImpl) : makeRedisStore(cfg, fetchImpl); }
function makeRedisStore(cfg, fetchImpl) {
  const f = fetchImpl || fetch;
  async function cmd(args) {
    const r = await f(cfg.url, { method: 'POST', headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error('store: ' + (j.error || r.status));
    return j.result;
  }
  return {
    async list(col) {
      const arr = (await cmd(['HGETALL', PREFIX + col])) || [];
      const out = [];
      for (let i = 0; i < arr.length; i += 2) { try { out.push(JSON.parse(arr[i + 1])); } catch (_) { /* bozuk kayıt atlanır */ } }
      return out;
    },
    async get(col, id) { const v = await cmd(['HGET', PREFIX + col, id]); try { return v ? JSON.parse(v) : null; } catch (_) { return null; } },
    async listBy(col, key, val) { return (await this.list(col)).filter((d) => d[key] === val); },
    save: (col, doc) => cmd(['HSET', PREFIX + col, doc.id, JSON.stringify(doc)]),
    del: (col, id) => cmd(['HDEL', PREFIX + col, id]),
    clear: (col) => cmd(['DEL', PREFIX + col]),
  };
}
// Neon'un HTTP SQL uç noktası (@neondatabase/serverless sürücüsünün kullandığı biçim)
function neonEndpoint(conn) {
  const host = new URL(conn.replace(/^postgres(ql)?:/, 'https:')).hostname;
  return 'https://' + host.replace(/^[^.]+\./, 'api.') + '/sql';
}
function makeNeonStore(cfg, fetchImpl) {
  const f = fetchImpl || fetch, url = neonEndpoint(cfg.conn);
  let ready = null;
  async function q(query, params = []) {
    const r = await f(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': cfg.conn, 'Neon-Raw-Text-Output': 'true', 'Neon-Array-Mode': 'true' }, body: JSON.stringify({ query, params }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('store: ' + (j.message || r.status));
    return j.rows || [];
  }
  const init = () => (ready = ready || q('CREATE TABLE IF NOT EXISTS bp_admin (col text NOT NULL, id text NOT NULL, doc jsonb NOT NULL, PRIMARY KEY (col, id))').catch((e) => { ready = null; throw e; }));
  return {
    async list(col) {
      await init();
      const out = [];
      for (const row of await q('SELECT doc::text FROM bp_admin WHERE col = $1', [col])) { try { out.push(JSON.parse(row[0])); } catch (_) { /* bozuk kayıt atlanır */ } }
      return out;
    },
    async get(col, id) { await init(); const r = await q('SELECT doc::text FROM bp_admin WHERE col = $1 AND id = $2', [col, id]); try { return r[0] ? JSON.parse(r[0][0]) : null; } catch (_) { return null; } },
    async listBy(col, key, val) {
      await init();
      const out = [];
      for (const row of await q('SELECT doc::text FROM bp_admin WHERE col = $1 AND doc->>$2 = $3', [col, key, val])) { try { out.push(JSON.parse(row[0])); } catch (_) { /* atla */ } }
      return out;
    },
    async save(col, doc) { await init(); return q('INSERT INTO bp_admin (col, id, doc) VALUES ($1, $2, $3::jsonb) ON CONFLICT (col, id) DO UPDATE SET doc = EXCLUDED.doc', [col, doc.id, JSON.stringify(doc)]); },
    async del(col, id) { await init(); return q('DELETE FROM bp_admin WHERE col = $1 AND id = $2', [col, id]); },
    async clear(col) { await init(); return q('DELETE FROM bp_admin WHERE col = $1', [col]); },
  };
}

/* ---------- oturum ---------- */
const b64u = (b) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
function secretOf(env) { return env.ADMIN_SESSION_SECRET || crypto.createHash('sha256').update('bp|' + env.ADMIN_PASSWORD).digest('hex'); }
function sign(env, exp) { return b64u(crypto.createHmac('sha256', secretOf(env)).update(String(exp)).digest()); }
function makeToken(env, now) { const exp = now + SESSION_HOURS * 3600e3; return `${exp}.${sign(env, exp)}`; }
function validToken(env, tok, now) {
  if (!tok || typeof tok !== 'string') return false;
  const [exp, sig] = tok.split('.');
  if (!exp || !sig || Number(exp) < now) return false;
  const want = Buffer.from(sign(env, exp)), got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}
function readCookie(req, name) {
  const m = String(req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
}
function samePass(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

/* ---------- yardımcılar ---------- */
function send(res, code, obj, cookie) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (cookie) res.setHeader('Set-Cookie', cookie);
  res.end(JSON.stringify(obj));
}
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > MAX_BODY) throw new Error('too_large'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
const cleanId = (s) => String(s || '').replace(/[^\w-]/g, '').slice(0, 64);

/* ---------- sunucu tarafı anlık yedek (haftada bir, son 6 tanesi saklanır) ---------- */
async function snapshot(store, data, t, why) {
  const meta = (await store.get(YMETA, 'liste')) || { id: 'liste', items: [] };
  const id = 'y' + t;
  const n = COLS.reduce((a, c) => a + (data[c] || []).length, 0);
  await store.save(YEDEK, { id, tarih: new Date(t).toISOString(), neden: why, n, data });
  meta.items = [{ id, tarih: new Date(t).toISOString(), neden: why, n }, ...meta.items];
  for (const old of meta.items.slice(KEEP_SNAPSHOTS)) await store.del(YEDEK, old.id);
  meta.items = meta.items.slice(0, KEEP_SNAPSHOTS);
  await store.save(YMETA, meta);
  return meta.items;
}
async function maybeSnapshot(store, data, t) {
  const meta = await store.get(YMETA, 'liste');
  const last = meta && meta.items[0] ? Date.parse(meta.items[0].tarih) : 0;
  const n = COLS.reduce((a, c) => a + (data[c] || []).length, 0);
  if (n && t - last > SNAPSHOT_DAYS * 864e5) await snapshot(store, data, t, 'haftalık');
}
async function replaceAll(store, data) {
  let n = 0;
  for (const c of COLS) {
    if (!Array.isArray(data[c])) continue;
    await store.clear(c);
    for (const d of data[c]) { if (d && cleanId(d.id) && JSON.stringify(d).length <= MAX_DOC) { await store.save(c, { ...d, id: cleanId(d.id) }); n++; } }
  }
  return n;
}

/* ---------- işleyici ---------- */
function createHandler(opts = {}) {
  const env = opts.env || process.env;
  const now = opts.now || (() => Date.now());
  return async function handler(req, res) {
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method' });
    if (req.headers['x-bp-admin'] !== '1') return send(res, 400, { ok: false, error: 'header' });   // çapraz site isteklerini engeller
    const cfg = storeConfig(env);
    if (!env.ADMIN_PASSWORD || !cfg) return send(res, 503, { ok: false, error: 'not_configured', missing: { password: !env.ADMIN_PASSWORD, store: !cfg } });
    const store = opts.store || makeStore(cfg, opts.fetch);
    let b;
    try { b = await readBody(req); } catch (e) { return send(res, 400, { ok: false, error: e.message === 'too_large' ? 'too_large' : 'json' }); }
    const secure = (req.headers['x-forwarded-proto'] || 'https') === 'https' ? '; Secure' : '';
    const cookieBase = `bp_admin=%v; Path=/; HttpOnly; SameSite=Strict${secure}`;

    if (b.a === 'login') {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
      const t = now(), list = (attempts.get(ip) || []).filter((x) => t - x < 15 * 60e3);
      if (list.length >= 8) return send(res, 429, { ok: false, error: 'rate' });
      if (!samePass(b.password || '', env.ADMIN_PASSWORD)) { list.push(t); attempts.set(ip, list); return send(res, 401, { ok: false, error: 'password' }); }
      attempts.delete(ip);
      return send(res, 200, { ok: true }, cookieBase.replace('%v', encodeURIComponent(makeToken(env, t))) + `; Max-Age=${SESSION_HOURS * 3600}`);
    }
    if (b.a === 'logout') return send(res, 200, { ok: true }, cookieBase.replace('%v', '') + '; Max-Age=0');
    if (!validToken(env, readCookie(req, 'bp_admin'), now())) return send(res, 401, { ok: false, error: 'session' });

    try {
      switch (b.a) {
        case 'me': return send(res, 200, { ok: true });
        case 'list': {
          if (!COLS.includes(b.col)) return send(res, 400, { ok: false, error: 'col' });
          return send(res, 200, { ok: true, docs: await store.list(b.col) });
        }
        case 'all': {
          const data = {};
          for (const c of COLS) data[c] = await store.list(c);
          try { await maybeSnapshot(store, data, now()); } catch (e) { console.error('snapshot', e && e.message); }
          return send(res, 200, { ok: true, data });
        }
        case 'save': {
          if (!(COLS.includes(b.col) || b.col === FOTO) || !b.doc || typeof b.doc !== 'object') return send(res, 400, { ok: false, error: 'doc' });
          const doc = { ...b.doc, id: cleanId(b.doc.id) || crypto.randomUUID(), guncelleme: new Date(now()).toISOString() };
          if (b.col === FOTO && (!cleanId(doc.satisId) || !/^data:image\/(jpeg|png|webp);base64,/.test(String(doc.data)))) return send(res, 400, { ok: false, error: 'foto' });
          if (JSON.stringify(doc).length > (b.col === FOTO ? MAX_FOTO : MAX_DOC)) return send(res, 400, { ok: false, error: 'too_large' });
          await store.save(b.col, doc);
          return send(res, 200, { ok: true, doc });
        }
        case 'bulk': {   // fiyat listesi içe aktarma: tek istekte birden çok kalem (yalnızca COLS, kayıt başına boyut sınırı)
          if (!COLS.includes(b.col) || !Array.isArray(b.docs) || !b.docs.length || b.docs.length > 300) return send(res, 400, { ok: false, error: 'docs' });
          const stamp = new Date(now()).toISOString(), out = [];
          for (const d of b.docs) {
            if (!d || typeof d !== 'object') return send(res, 400, { ok: false, error: 'doc' });
            const doc = { ...d, id: cleanId(d.id) || crypto.randomUUID(), guncelleme: stamp };
            if (JSON.stringify(doc).length > MAX_DOC) return send(res, 400, { ok: false, error: 'too_large' });
            out.push(doc);
          }
          for (const doc of out) await store.save(b.col, doc);
          return send(res, 200, { ok: true, docs: out });
        }
        case 'bulkdel': {   // seçilen kalemleri toplu silme; önce mevcut hâlin anlık yedeği alınır
          const ids = Array.isArray(b.ids) ? b.ids.map(cleanId).filter(Boolean) : [];
          if (!COLS.includes(b.col) || !ids.length || ids.length > 1000 || b.confirm !== 'TOPLU_SIL') return send(res, 400, { ok: false, error: 'ids' });
          const cur = {}; for (const c of COLS) cur[c] = await store.list(c);
          await snapshot(store, cur, now(), `toplu silme öncesi (${ids.length} kayıt)`);
          for (const id of ids) await store.del(b.col, id);
          return send(res, 200, { ok: true, n: ids.length });
        }
        case 'del': {
          if (!(COLS.includes(b.col) || b.col === FOTO) || !cleanId(b.id)) return send(res, 400, { ok: false, error: 'id' });
          await store.del(b.col, cleanId(b.id));
          return send(res, 200, { ok: true });
        }
        case 'import': {   // yedekten geri yükleme: seçilen koleksiyonlar tamamen değiştirilir (önce mevcut hâlin anlık yedeği alınır)
          if (b.confirm !== 'YEDEKTEN_YUKLE' || !b.data || typeof b.data !== 'object') return send(res, 400, { ok: false, error: 'confirm' });
          const cur = {}; for (const c of COLS) cur[c] = await store.list(c);
          await snapshot(store, cur, now(), 'geri yükleme öncesi');
          return send(res, 200, { ok: true, n: await replaceAll(store, b.data) });
        }
        case 'fotolar': {
          if (!cleanId(b.satisId)) return send(res, 400, { ok: false, error: 'id' });
          return send(res, 200, { ok: true, docs: await store.listBy(FOTO, 'satisId', cleanId(b.satisId)) });
        }
        case 'yedekler': {
          const meta = await store.get(YMETA, 'liste');
          return send(res, 200, { ok: true, items: meta ? meta.items : [] });
        }
        case 'yedek-al': {
          const cur = {}; for (const c of COLS) cur[c] = await store.list(c);
          return send(res, 200, { ok: true, items: await snapshot(store, cur, now(), 'elle') });
        }
        case 'yedege-don': {
          if (b.confirm !== 'YEDEGE_DON' || !cleanId(b.id)) return send(res, 400, { ok: false, error: 'confirm' });
          const y = await store.get(YEDEK, cleanId(b.id));
          if (!y || !y.data) return send(res, 404, { ok: false, error: 'yok' });
          const cur = {}; for (const c of COLS) cur[c] = await store.list(c);
          await snapshot(store, cur, now(), 'geri dönüş öncesi');
          return send(res, 200, { ok: true, n: await replaceAll(store, y.data) });
        }
        default: return send(res, 400, { ok: false, error: 'action' });
      }
    } catch (e) {
      console.error('admin', e && e.message);
      return send(res, 502, { ok: false, error: 'store' });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
module.exports._t = { makeToken, validToken, makeStore, storeConfig, neonEndpoint, COLS };
