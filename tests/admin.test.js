// Yönetim paneli API'si için birim testleri:  node --test tests/
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { createHandler, _t } = require('../api/admin.js');

const ENV = { ADMIN_PASSWORD: 'dogru-sifre', ADMIN_SESSION_SECRET: 'x'.repeat(40), UPSTASH_REDIS_REST_URL: 'https://example.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' };

// Redis REST'i taklit eden bellek içi sahte fetch (yalnızca testlerde)
function fakeFetch(db = {}) {
  return async (url, o) => {
    const [c, k, ...a] = JSON.parse(o.body);
    db[k] = db[k] || {};
    let result = null;
    if (c === 'HGETALL') result = Object.entries(db[k]).flat();
    if (c === 'HGET') result = db[k][a[0]] ?? null;
    if (c === 'HSET') { db[k][a[0]] = a[1]; result = 1; }
    if (c === 'HDEL') { delete db[k][a[0]]; result = 1; }
    if (c === 'DEL') { delete db[k]; result = 1; }
    return { ok: true, json: async () => ({ result }) };
  };
}
function call(h, body, { headers = {}, method = 'POST' } = {}) {
  return new Promise((resolve) => {
    const req = { method, headers: { 'x-bp-admin': '1', 'x-forwarded-for': '1.1.1.' + Math.floor(Math.random() * 200), ...headers }, body };
    const res = { h: {}, statusCode: 200, setHeader(k, v) { this.h[k] = v; }, end(s) { resolve({ code: this.statusCode, body: JSON.parse(s), h: this.h }); } };
    h(req, res);
  });
}
async function login(h) {
  const r = await call(h, { a: 'login', password: 'dogru-sifre' });
  return r.h['Set-Cookie'].split(';')[0];
}

test('kurulum eksikse 503 döner, veri dönmez', async () => {
  const r = await call(createHandler({ env: {} }), { a: 'me' });
  assert.strictEqual(r.code, 503); assert.strictEqual(r.body.error, 'not_configured');
});
test('özel başlık olmadan istek reddedilir', async () => {
  const r = await call(createHandler({ env: ENV, fetch: fakeFetch() }), { a: 'me' }, { headers: { 'x-bp-admin': '' } });
  assert.strictEqual(r.code, 400);
});
test('yanlış şifre 401, oturumsuz istek 401', async () => {
  const h = createHandler({ env: ENV, fetch: fakeFetch() });
  assert.strictEqual((await call(h, { a: 'login', password: 'yanlis' })).code, 401);
  assert.strictEqual((await call(h, { a: 'list', col: 'kalemler' })).code, 401);
});
test('giriş çerezi HttpOnly ve SameSite=Strict', async () => {
  const r = await call(createHandler({ env: ENV, fetch: fakeFetch() }), { a: 'login', password: 'dogru-sifre' });
  assert.strictEqual(r.code, 200); assert.match(r.h['Set-Cookie'], /HttpOnly/); assert.match(r.h['Set-Cookie'], /SameSite=Strict/);
});
test('kaydet, listele, sil', async () => {
  const h = createHandler({ env: ENV, fetch: fakeFetch() });
  const cookie = await login(h);
  const s = await call(h, { a: 'save', col: 'kalemler', doc: { ad: 'Keten tül', alis: 100, satis: 180 } }, { headers: { cookie } });
  assert.strictEqual(s.code, 200); assert.ok(s.body.doc.id);
  const l = await call(h, { a: 'list', col: 'kalemler' }, { headers: { cookie } });
  assert.strictEqual(l.body.docs.length, 1); assert.strictEqual(l.body.docs[0].ad, 'Keten tül');
  await call(h, { a: 'del', col: 'kalemler', id: s.body.doc.id }, { headers: { cookie } });
  assert.strictEqual((await call(h, { a: 'list', col: 'kalemler' }, { headers: { cookie } })).body.docs.length, 0);
});
test('bilinmeyen koleksiyon reddedilir', async () => {
  const h = createHandler({ env: ENV, fetch: fakeFetch() });
  const cookie = await login(h);
  assert.strictEqual((await call(h, { a: 'list', col: 'kullanicilar' }, { headers: { cookie } })).code, 400);
});
test('süresi dolmuş ya da sahte oturum reddedilir', async () => {
  const t = Date.now();
  assert.strictEqual(_t.validToken(ENV, _t.makeToken(ENV, t - 13 * 3600e3), t), false);
  assert.strictEqual(_t.validToken(ENV, `${t + 1e6}.sahte`, t), false);
  assert.strictEqual(_t.validToken(ENV, _t.makeToken(ENV, t), t), true);
});
test('yedekten yükleme onay ister', async () => {
  const h = createHandler({ env: ENV, fetch: fakeFetch() });
  const cookie = await login(h);
  assert.strictEqual((await call(h, { a: 'import', data: { kalemler: [] } }, { headers: { cookie } })).code, 400);
  const r = await call(h, { a: 'import', confirm: 'YEDEKTEN_YUKLE', data: { kalemler: [{ id: 'k1', ad: 'A' }] } }, { headers: { cookie } });
  assert.strictEqual(r.body.n, 1);
});

test('Neon: uç nokta ve SQL ile kaydet / listele / sil', async () => {
  const conn = 'postgresql://u:p@ep-cool-name-123-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';
  assert.strictEqual(_t.neonEndpoint(conn), 'https://api.eu-central-1.aws.neon.tech/sql');
  const rows = new Map(); const seen = [];
  const f = async (url, o) => {
    assert.strictEqual(o.headers['Neon-Connection-String'], conn);
    const { query, params } = JSON.parse(o.body); seen.push(query);
    let out = [];
    if (/^INSERT/.test(query)) rows.set(params[0] + '|' + params[1], params[2]);
    else if (/^SELECT.*AND id/.test(query)) out = rows.has(params[0] + '|' + params[1]) ? [[rows.get(params[0] + '|' + params[1])]] : [];
    else if (/^SELECT/.test(query)) out = [...rows].filter(([k]) => k.startsWith(params[0] + '|')).map(([, v]) => [v]);
    else if (/^DELETE.*id/.test(query)) rows.delete(params[0] + '|' + params[1]);
    return { ok: true, json: async () => ({ rows: out }) };
  };
  const h = createHandler({ env: { ADMIN_PASSWORD: 'dogru-sifre', ADMIN_SESSION_SECRET: 'x'.repeat(40), DATABASE_URL: conn }, fetch: f });
  const cookie = await login(h);
  const s = await call(h, { a: 'save', col: 'giderler', doc: { matrah: 100 } }, { headers: { cookie } });
  assert.strictEqual((await call(h, { a: 'list', col: 'giderler' }, { headers: { cookie } })).body.docs[0].matrah, 100);
  await call(h, { a: 'del', col: 'giderler', id: s.body.doc.id }, { headers: { cookie } });
  assert.strictEqual((await call(h, { a: 'list', col: 'giderler' }, { headers: { cookie } })).body.docs.length, 0);
  assert.ok(seen[0].startsWith('CREATE TABLE IF NOT EXISTS bp_admin'));
});

test('fotoğraf: yalnızca resim kabul edilir, siparişe göre listelenir', async () => {
  const h = createHandler({ env: ENV, fetch: fakeFetch() });
  const cookie = await login(h);
  assert.strictEqual((await call(h, { a: 'save', col: 'fotolar', doc: { satisId: 's1', data: 'javascript:alert(1)' } }, { headers: { cookie } })).code, 400);
  await call(h, { a: 'save', col: 'fotolar', doc: { satisId: 's1', data: 'data:image/jpeg;base64,AAAA' } }, { headers: { cookie } });
  await call(h, { a: 'save', col: 'fotolar', doc: { satisId: 's2', data: 'data:image/jpeg;base64,BBBB' } }, { headers: { cookie } });
  const r = await call(h, { a: 'fotolar', satisId: 's1' }, { headers: { cookie } });
  assert.strictEqual(r.body.docs.length, 1);
  const all = await call(h, { a: 'all' }, { headers: { cookie } });
  assert.strictEqual(all.body.data.fotolar, undefined);
});
test('haftalık sunucu yedeği alınır ve geri dönülebilir', async () => {
  let t = Date.parse('2026-11-01T10:00:00Z');
  const h = createHandler({ env: ENV, fetch: fakeFetch(), now: () => t });
  const cookie = await login(h);
  await call(h, { a: 'save', col: 'kalemler', doc: { id: 'k1', ad: 'Eski' } }, { headers: { cookie } });
  await call(h, { a: 'all' }, { headers: { cookie } });
  let y = (await call(h, { a: 'yedekler' }, { headers: { cookie } })).body.items;
  assert.strictEqual(y.length, 1);
  t += 6 * 3600e3; await call(h, { a: 'all' }, { headers: { cookie } });
  assert.strictEqual((await call(h, { a: 'yedekler' }, { headers: { cookie } })).body.items.length, 1, 'bir hafta dolmadan yeni yedek alınmaz');
  await call(h, { a: 'save', col: 'kalemler', doc: { id: 'k1', ad: 'Yeni' } }, { headers: { cookie } });
  assert.strictEqual((await call(h, { a: 'yedege-don', id: y[0].id }, { headers: { cookie } })).code, 400, 'onaysız geri dönüş reddedilir');
  const r = await call(h, { a: 'yedege-don', id: y[0].id, confirm: 'YEDEGE_DON' }, { headers: { cookie } });
  assert.strictEqual(r.body.n, 1);
  assert.strictEqual((await call(h, { a: 'list', col: 'kalemler' }, { headers: { cookie } })).body.docs[0].ad, 'Eski');
  assert.strictEqual((await call(h, { a: 'yedekler' }, { headers: { cookie } })).body.items[0].neden, 'geri dönüş öncesi');
});
test('toplu kayıt: fiyat listesi kalemleri tek istekte kaydedilir, sınırlar uygulanır', async () => {
  const h = createHandler({ env: ENV, fetch: fakeFetch() });
  const cookie = await login(h);
  const docs = [{ kod: 'CAS-001', ad: 'Casting 912935', alis: 345.8 }, { id: 'var-olan', kod: 'CAS-002', ad: 'Casting ALADRA', alis: 256.88 }];
  const r = await call(h, { a: 'bulk', col: 'kalemler', docs }, { headers: { cookie } });
  assert.strictEqual(r.code, 200); assert.strictEqual(r.body.docs.length, 2); assert.strictEqual(r.body.docs[1].id, 'var-olan');
  const l = await call(h, { a: 'list', col: 'kalemler' }, { headers: { cookie } });
  assert.strictEqual(l.body.docs.length, 2);
  assert.strictEqual((await call(h, { a: 'bulk', col: 'yok', docs }, { headers: { cookie } })).code, 400);
  assert.strictEqual((await call(h, { a: 'bulk', col: 'kalemler', docs: [] }, { headers: { cookie } })).code, 400);
  assert.strictEqual((await call(h, { a: 'bulk', col: 'kalemler', docs }, {})).code, 401);
});
