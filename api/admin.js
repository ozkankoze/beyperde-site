// Bey Perde yönetim paneli API'si (Vercel sunucusuz fonksiyonu) — /api/admin
//
// Gerekli ortam değişkenleri (Vercel → Project → Settings → Environment Variables):
//   ADMIN_PASSWORD           Panel şifresi (yalnızca sunucuda tutulur)
//   ADMIN_SESSION_SECRET     Oturum çerezini imzalamak için uzun, rastgele bir metin
//   UPSTASH_REDIS_REST_URL   Upstash Redis REST adresi  (Vercel KV kullanılıyorsa KV_REST_API_URL)
//   UPSTASH_REDIS_REST_TOKEN Upstash Redis REST anahtarı (Vercel KV kullanılıyorsa KV_REST_API_TOKEN)
// Bunlar eksikse fonksiyon 503 döner; panel "kurulum eksik" uyarısı gösterir, sahte veri göstermez.
'use strict';

const crypto = require('crypto');

const COLS = ['kalemler', 'satislar', 'alislar', 'giderler', 'ayarlar'];
const PREFIX = 'bp:admin:';
const SESSION_HOURS = 12;
const MAX_DOC = 200 * 1024;
const MAX_BODY = 3.5 * 1024 * 1024;
const attempts = new Map();   // basit, örnek başına giriş denemesi sınırı

/* ---------- veri deposu (Upstash Redis REST; ek kütüphane gerekmez) ---------- */
function storeConfig(env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
function makeStore(cfg, fetchImpl) {
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
    save: (col, doc) => cmd(['HSET', PREFIX + col, doc.id, JSON.stringify(doc)]),
    del: (col, id) => cmd(['HDEL', PREFIX + col, id]),
    clear: (col) => cmd(['DEL', PREFIX + col]),
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
          return send(res, 200, { ok: true, data });
        }
        case 'save': {
          if (!COLS.includes(b.col) || !b.doc || typeof b.doc !== 'object') return send(res, 400, { ok: false, error: 'doc' });
          const doc = { ...b.doc, id: cleanId(b.doc.id) || crypto.randomUUID(), guncelleme: new Date(now()).toISOString() };
          if (JSON.stringify(doc).length > MAX_DOC) return send(res, 400, { ok: false, error: 'too_large' });
          await store.save(b.col, doc);
          return send(res, 200, { ok: true, doc });
        }
        case 'del': {
          if (!COLS.includes(b.col) || !cleanId(b.id)) return send(res, 400, { ok: false, error: 'id' });
          await store.del(b.col, cleanId(b.id));
          return send(res, 200, { ok: true });
        }
        case 'import': {   // yedekten geri yükleme: seçilen koleksiyonlar tamamen değiştirilir
          if (b.confirm !== 'YEDEKTEN_YUKLE' || !b.data || typeof b.data !== 'object') return send(res, 400, { ok: false, error: 'confirm' });
          let n = 0;
          for (const c of COLS) {
            if (!Array.isArray(b.data[c])) continue;
            await store.clear(c);
            for (const d of b.data[c]) { if (d && cleanId(d.id) && JSON.stringify(d).length <= MAX_DOC) { await store.save(c, { ...d, id: cleanId(d.id) }); n++; } }
          }
          return send(res, 200, { ok: true, n });
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
module.exports._t = { makeToken, validToken, makeStore, storeConfig, COLS };
