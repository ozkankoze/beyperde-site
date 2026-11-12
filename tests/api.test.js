// Teklif API'si için birim testleri:  node --test tests/
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const handler = require('../api/teklif.js');

function call(body, { method = 'POST', headers = {} } = {}) {
  return new Promise((resolve) => {
    const req = { method, headers: { host: 'beyperde.com', origin: 'https://beyperde.com', 'x-forwarded-for': String(Math.random()), ...headers }, body };
    const res = { h: {}, code: 200, setHeader(k, v) { this.h[k] = v; }, status(c) { this.code = c; return this; }, json(o) { resolve({ code: this.code, body: o }); } };
    handler(req, res);
  });
}
const ok = { ad: 'Ayşe Yılmaz', tel: '0532 111 22 33', kvkk: true, t: Date.now() - 10000 };

test('yalnızca POST kabul edilir', async () => { assert.strictEqual((await call({}, { method: 'GET' })).code, 405); });
test('başka siteden gelen istek reddedilir', async () => { assert.strictEqual((await call(ok, { headers: { origin: 'https://evil.example' } })).code, 403); });
test('eksik alanlar 422 döner', async () => {
  const r = await call({ ad: 'A', tel: '12', kvkk: false, t: Date.now() - 10000 });
  assert.strictEqual(r.code, 422); assert.deepStrictEqual(Object.keys(r.body.fields).sort(), ['ad', 'kvkk', 'tel']);
});
test('geçersiz e-posta 422 döner', async () => { assert.strictEqual((await call({ ...ok, eposta: 'x@y' })).code, 422); });
test('bal küpü doluysa sessizce kabul edilir ama gönderilmez', async () => { const r = await call({ ...ok, website: 'spam' }); assert.strictEqual(r.code, 200); });
test('altyapı yapılandırılmamışsa 503 döner, başarı dönmez', async () => {
  delete process.env.RESEND_API_KEY;
  const r = await call(ok); assert.strictEqual(r.code, 503); assert.strictEqual(r.body.error, 'not_configured');
});
test('fazla fotoğraf reddedilir', async () => {
  const foto = Array.from({ length: 5 }, () => ({ name: 'a.jpg', type: 'image/jpeg', data: 'AAAA' }));
  assert.strictEqual((await call({ ...ok, foto })).code, 422);
});
test('HTML kaçışı', () => { assert.strictEqual(handler.esc('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;'); });
