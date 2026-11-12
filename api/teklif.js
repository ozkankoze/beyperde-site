// Vercel sunucusuz fonksiyonu: Detaylı teklif formunu e-posta ile iletir.
//
// Gerekli ortam değişkenleri (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY     Resend (resend.com) API anahtarı
//   TEKLIF_ALICI       Teklif e-postalarının gideceği adres (ör. info@beyperde.com)
//   TEKLIF_GONDEREN    Resend'de doğrulanmış gönderen (ör. "Bey Perde <teklif@beyperde.com>")
// Bunlar tanımlı değilse fonksiyon 503 döner; site sahte başarı mesajı göstermez,
// kullanıcıyı WhatsApp'a yönlendirir. Anahtarlar yalnızca sunucuda tutulur.
'use strict';

const MAX_BODY = 4.2 * 1024 * 1024;   // Vercel istek sınırı ~4.5 MB
const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 1.2 * 1024 * 1024;
const MIN_FILL_MS = 2500;             // botlara karşı: formu çok hızlı gönderenleri reddet
const hits = new Map();               // basit, örnek başına hız sınırı

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => String(s == null ? '' : s).trim().slice(0, n);

function validate(b) {
  const errors = {};
  const ad = clip(b.ad, 80), tel = clip(b.tel, 20), eposta = clip(b.eposta, 120);
  if (ad.length < 3) errors.ad = 'name';
  const digits = tel.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) errors.tel = 'phone';
  if (eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta)) errors.eposta = 'email';
  if (b.kvkk !== true) errors.kvkk = 'consent';
  const foto = Array.isArray(b.foto) ? b.foto : [];
  if (foto.length > MAX_PHOTOS) errors.foto = 'too_many';
  for (const f of foto) {
    if (!f || typeof f.data !== 'string' || !/^image\/(jpeg|png|webp)$/.test(f.type || '')) { errors.foto = 'type'; break; }
    if (f.data.length * 0.75 > MAX_PHOTO_BYTES) { errors.foto = 'size'; break; }
    if (!/^[A-Za-z0-9+/=]+$/.test(f.data.slice(0, 200))) { errors.foto = 'type'; break; }
  }
  const clean = {
    ad, tel, eposta, mekan: clip(b.mekan, 40), urun: clip(b.urun_adi || b.urun, 80), pencere: clip(b.pencere, 6),
    olcu: clip(b.olcu, 300), not: clip(b.not, 2000), lang: ['tr', 'en', 'ar'].includes(b.lang) ? b.lang : 'tr', sayfa: clip(b.sayfa, 200),
    foto: foto.slice(0, MAX_PHOTOS).map((f, i) => ({ filename: clip(f.name, 60).replace(/[^\w.\-]/g, '_') || `foto-${i + 1}.jpg`, content: f.data })),
  };
  return { errors, clean };
}

function emailHtml(c) {
  const rows = [['Ad soyad', c.ad], ['Telefon', c.tel], ['E-posta', c.eposta], ['Mekân', c.mekan], ['Ürün', c.urun], ['Pencere sayısı', c.pencere], ['Ölçüler', c.olcu], ['Açıklama', c.not], ['Dil', c.lang], ['Sayfa', c.sayfa], ['Fotoğraf', String(c.foto.length)]]
    .filter(([, v]) => v).map(([k, v]) => `<tr><th align="left" style="padding:6px 12px 6px 0;vertical-align:top">${esc(k)}</th><td style="padding:6px 0">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('');
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#2a2019"><h2 style="font-weight:400">Yeni teklif isteği</h2><table>${rows}</table><p style="color:#6a5d53">KVKK aydınlatma metni onaylandı.</p></div>`;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let size = 0; const chunks = [];
  for await (const ch of req) { size += ch.length; if (size > MAX_BODY) throw Object.assign(new Error('too_large'), { status: 413 }); chunks.push(ch); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'method' }); }

  // aynı siteden gelen istekler (tarayıcılar Origin gönderir)
  const origin = req.headers.origin || '';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  if (origin && host && !origin.endsWith('//' + host)) return res.status(403).json({ ok: false, error: 'origin' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  const now = Date.now(), h = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (h.length >= 5) return res.status(429).json({ ok: false, error: 'rate' });
  hits.set(ip, h.concat(now));

  let body;
  try { body = await readBody(req); } catch (e) { return res.status(e.status || 400).json({ ok: false, error: e.status === 413 ? 'too_large' : 'bad_json' }); }

  // bal küpü ve süre kontrolü: botlara başarı gibi görünen ama hiçbir şey göndermeyen yanıt
  if (body.website || (body.t && now - Number(body.t) < MIN_FILL_MS)) return res.status(200).json({ ok: true });

  const { errors, clean } = validate(body);
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, error: 'validation', fields: errors });

  const key = process.env.RESEND_API_KEY, to = process.env.TEKLIF_ALICI, from = process.env.TEKLIF_GONDEREN;
  if (!key || !to || !from) return res.status(503).json({ ok: false, error: 'not_configured' });

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: to.split(',').map((s) => s.trim()), subject: `Teklif isteği: ${clean.ad}${clean.urun ? ' — ' + clean.urun : ''}`,
        html: emailHtml(clean), reply_to: clean.eposta || undefined, attachments: clean.foto.length ? clean.foto : undefined,
      }),
    });
    if (!r.ok) { console.error('resend', r.status, await r.text().catch(() => '')); return res.status(502).json({ ok: false, error: 'send_failed' }); }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('resend', e && e.message);
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
};

module.exports.validate = validate;
module.exports.esc = esc;
