/* Bey Perde yönetim paneli — ön yüz. Veriler /api/admin üzerinden sunucudaki depoda tutulur.
   Hesaplamalar burada yapılır (calc*); yazdırma için #print-area kullanılır. */
import { readXlsx, parseFiyatListesi, planImport, STOK_TUR } from '/admin/fiyat.mjs';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => { const n = typeof v === 'number' ? v : parseTR(v); return Number.isFinite(n) ? n : 0; };
const r2 = (n) => Math.round(n * 100) / 100;
const TL = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(num(n));
const N2 = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num(n));
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const addDays = (ds, n) => { const d = new Date(ds + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
const ymOf = (d) => String(d || '').slice(0, 7);
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const ymLabel = (ym) => { const [y, m] = ym.split('-'); return `${AYLAR[+m - 1]} ${y}`; };
const fmtDate = (d) => (d ? d.split('-').reverse().join('.') : '');
const dayLabel = (d) => `${GUNLER[new Date(d + 'T12:00:00Z').getUTCDay()]}, ${fmtDate(d)}`;
// "1.234,56" / "1234.56" / "1 234,56 TL" → 1234.56
export function parseTR(s) {
  if (s == null) return NaN;
  let t = String(s).replace(/[^\d,.\-]/g, '');
  if (!t) return NaN;
  const lc = t.lastIndexOf(','), ld = t.lastIndexOf('.');
  if (lc > ld) t = t.replace(/\./g, '').replace(',', '.');
  else if (ld > lc && lc >= 0) t = t.replace(/,/g, '');
  else if (lc < 0 && (t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
  else if (lc < 0 && ld >= 0 && t.length - ld - 1 === 3 && !/^0\./.test(t)) t = t.replace('.', '');   // 1.250 → 1250 (Türkçe binlik)
  return parseFloat(t);
}

/* ---------------- API ---------------- */
async function api(body) {
  let r;
  try { r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BP-Admin': '1' }, credentials: 'same-origin', body: JSON.stringify(body) }); }
  catch (_) { return { ok: false, error: 'network', status: 0 }; }
  const j = await r.json().catch(() => ({ ok: false, error: 'network' }));
  j.status = r.status;
  return j;
}
const S = { kalemler: [], satislar: [], alislar: [], giderler: [], ayarlar: [], virmanlar: [] };
const ayar = () => ({ firma: 'Bey Perde', tel: '0553 596 26 14', adres: 'Ekşioğlu Mah. Kuran Kursu Cad. No:4, Demek Sitesi B Blok, İç Kapı No:12, 34794 Çekmeköy/İstanbul', web: 'beyperde.com', kdv: 20, etiketW: 62, etiketH: 100, vadeGun: 7,
  kategoriler: ['Kira', 'Personel / işçilik', 'Elektrik, su, doğalgaz', 'Yakıt ve ulaşım', 'Reklam', 'Vergi ve SGK', 'Malzeme (sarf)', 'Diğer'],
  hesaplar: ['Nakit kasa', 'Kredi kartı (POS)', 'Banka'], acilis: {}, ...(S.ayarlar.find((a) => a.id === 'genel') || {}) });
const H0 = () => ayar().hesaplar[0] || 'Nakit kasa';
async function save(col, doc, quiet) {
  const r = await api({ a: 'save', col, doc });
  if (!r.ok) { toast(r.error === 'session' ? 'Oturum süresi doldu, yeniden giriş yapın.' : r.error === 'too_large' ? 'Kayıt çok büyük.' : 'Kaydedilemedi: ' + r.error, true); if (r.error === 'session') showLogin(); return null; }
  if (S[col]) { const i = S[col].findIndex((d) => d.id === r.doc.id); if (i >= 0) S[col][i] = r.doc; else S[col].push(r.doc); }
  if (!quiet) toast('Kaydedildi');
  return r.doc;
}
async function remove(col, id) {
  const r = await api({ a: 'del', col, id });
  if (!r.ok) { toast('Silinemedi: ' + r.error, true); return false; }
  if (S[col]) S[col] = S[col].filter((d) => d.id !== id);
  toast('Silindi');
  return true;
}
function toast(m, err) { const t = $('#toast'); t.textContent = m; t.classList.toggle('err', !!err); t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600); }

/* ---------------- hesaplamalar ---------------- */
export function calcSatis(s) {
  const lines = s.satirlar || [];
  const ara = lines.reduce((a, l) => a + num(l.miktar) * num(l.fiyat), 0);
  const isk = Math.min(num(s.iskonto), ara);
  const oran = ara ? (ara - isk) / ara : 0;
  let kdv = 0, mUrun = 0, mIsc = 0;
  for (const l of lines) {
    kdv += num(l.miktar) * num(l.fiyat) * oran * num(l.kdv) / 100;
    const m = num(l.miktar) * num(l.alis);
    if ((l.tur || 'urun') === 'urun') mUrun += m; else mIsc += m;
  }
  const matrah = ara - isk, toplam = matrah + kdv;
  const tahsil = (s.tahsilat || []).reduce((a, t) => a + num(t.tutar), 0);
  return { ara: r2(ara), isk: r2(isk), matrah: r2(matrah), kdv: r2(kdv), toplam: r2(toplam), mUrun: r2(mUrun), mIsc: r2(mIsc), maliyet: r2(mUrun + mIsc), kar: r2(matrah - mUrun - mIsc), tahsil: r2(tahsil), kalan: r2(toplam - tahsil) };
}
export function calcKdvli(d) { const m = num(d.matrah), k = r2(m * num(d.kdvOran) / 100); return { matrah: r2(m), kdv: k, toplam: r2(m + k) }; }
// Eski alış kayıtlarında ödeme listesi yoksa, fatura tarihinde peşin ödenmiş sayılır.
const alisOdemeler = (a) => (Array.isArray(a.odemeler) ? a.odemeler : [{ tarih: a.tarih, tutar: calcKdvli(a).toplam, hesap: H0() }]);
export function calcAlis(a) { const c = calcKdvli(a); const odenen = r2(alisOdemeler(a).reduce((x, o) => x + num(o.tutar), 0)); return { ...c, odenen, kalan: r2(c.toplam - odenen) }; }
const refDate = (s) => s.teslimTarihi || s.montaj || s.tarih;
const gecikmis = (s, ref = today()) => s.durum === 'teslim' && calcSatis(s).kalan > 0.009 && daysBetween(refDate(s), ref) > num(ayar().vadeGun);
export function calcDonem(match, data = S) {   // match: (tarih) => boolean
  const st = data.satislar.filter((s) => s.durum !== 'teklif' && match(s.tarih)).map(calcSatis);
  const sum = (arr, k) => r2(arr.reduce((a, x) => a + num(x[k]), 0));
  const al = data.alislar.filter((a) => match(a.tarih)).map(calcKdvli);
  const gd = data.giderler.filter((g) => match(g.tarih));
  const gdc = gd.map(calcKdvli);
  const kat = {};
  gd.forEach((g, i) => { kat[g.kategori || 'Diğer'] = r2((kat[g.kategori || 'Diğer'] || 0) + gdc[i].matrah); });
  const tahsil = r2(data.satislar.flatMap((s) => s.tahsilat || []).filter((t) => match(t.tarih)).reduce((a, t) => a + num(t.tutar), 0));
  const alisOdenen = r2(data.alislar.flatMap(alisOdemeler).filter((o) => match(o.tarih)).reduce((a, o) => a + num(o.tutar), 0));
  const R = { adet: st.length, ciro: sum(st, 'matrah'), satisKdv: sum(st, 'kdv'), satisToplam: sum(st, 'toplam'), mUrun: sum(st, 'mUrun'), mIsc: sum(st, 'mIsc'),
    alisMatrah: sum(al, 'matrah'), alisKdv: sum(al, 'kdv'), alisToplam: sum(al, 'toplam'), giderMatrah: sum(gdc, 'matrah'), giderKdv: sum(gdc, 'kdv'), giderToplam: sum(gdc, 'toplam'), kat, tahsilAy: tahsil, alisOdenen };
  R.brutKar = r2(R.ciro - R.mUrun - R.mIsc);
  R.netKar = r2(R.brutKar - R.giderMatrah);
  R.nakit = r2(R.tahsilAy - R.alisOdenen - R.giderToplam);
  R.kdvFark = r2(R.satisKdv - R.alisKdv - R.giderKdv);
  R.alacak = r2(data.satislar.filter((s) => s.durum !== 'teklif').map(calcSatis).reduce((a, c) => a + Math.max(0, c.kalan), 0));
  R.borc = r2(data.alislar.map(calcAlis).reduce((a, c) => a + Math.max(0, c.kalan), 0));
  return R;
}
export const calcAy = (ym, data = S) => calcDonem((d) => ymOf(d) === ym, data);
export function stokOf(k, data = S) {
  const giris = r2(data.alislar.flatMap((a) => a.stok || []).filter((x) => x.kalemId === k.id).reduce((a, x) => a + num(x.miktar), 0));
  const cikis = r2(data.satislar.filter((s) => s.durum !== 'teklif').flatMap((s) => s.satirlar || []).filter((l) => l.kalemId === k.id).reduce((a, l) => a + num(l.miktar), 0));
  return { giris, cikis, mevcut: r2(num(k.acilisStok) + num(k.duzeltme) + giris - cikis) };
}
export function hareketler(data = S) {   // kasa ve banka hareketleri
  const h0 = H0(), out = [];
  for (const s of data.satislar) for (const t of s.tahsilat || []) out.push({ tarih: t.tarih, hesap: t.hesap || h0, tutar: num(t.tutar), acik: `Tahsilat · ${s.musteri || ''} · ${s.no || ''}`, satis: s.id });
  for (const a of data.alislar) for (const o of alisOdemeler(a)) out.push({ tarih: o.tarih, hesap: o.hesap || h0, tutar: -num(o.tutar), acik: `Ödeme · ${a.tedarikci || ''}${a.faturaNo ? ' · ' + a.faturaNo : ''}`, alis: a.id });
  for (const g of data.giderler) out.push({ tarih: g.tarih, hesap: g.hesap || h0, tutar: -calcKdvli(g).toplam, acik: `Gider · ${g.kategori || ''}${g.aciklama ? ' · ' + g.aciklama : ''}`, gider: g.id });
  for (const v of data.virmanlar || []) { out.push({ tarih: v.tarih, hesap: v.kaynak, tutar: -num(v.tutar), acik: `Transfer → ${v.hedef}${v.aciklama ? ' · ' + v.aciklama : ''}`, virman: v.id }); out.push({ tarih: v.tarih, hesap: v.hedef, tutar: num(v.tutar), acik: `Transfer ← ${v.kaynak}${v.aciklama ? ' · ' + v.aciklama : ''}`, virman: v.id }); }
  return out.sort((a, b) => String(a.tarih).localeCompare(b.tarih));
}
const mKey = (s) => { const d = String(s.tel || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? 't' + d : 'n' + String(s.musteri || '').trim().toLocaleLowerCase('tr').replace(/\s+/g, '-'); };
function musteriler() {
  const m = new Map();
  for (const s of S.satislar) {
    const k = mKey(s);
    const o = m.get(k) || { key: k, ad: s.musteri, tel: s.tel, adres: s.adres, satislar: [], son: '' };
    o.satislar.push(s);
    if (String(s.tarih) >= o.son) { o.son = s.tarih; o.ad = s.musteri || o.ad; o.tel = s.tel || o.tel; o.adres = s.adres || o.adres; }
    m.set(k, o);
  }
  for (const o of m.values()) { const cs = o.satislar.filter((s) => s.durum !== 'teklif').map(calcSatis); o.toplam = r2(cs.reduce((a, c) => a + c.toplam, 0)); o.kalan = r2(cs.reduce((a, c) => a + Math.max(0, c.kalan), 0)); }
  return [...m.values()].sort((a, b) => String(b.son).localeCompare(a.son));
}
// WhatsApp: numara 90 ile başlayan uluslararası biçime çevrilir
const waNum = (tel) => { let d = String(tel || '').replace(/\D/g, ''); if (d.startsWith('0')) d = d.slice(1); if (d.length === 10) d = '90' + d; return d.length >= 11 ? d : ''; };
const waLink = (tel, text) => { const n = waNum(tel); return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : ''; };
function waTeklif(s) {
  const c = calcSatis(s), a = ayar();
  const satir = (s.satirlar || []).map((l) => `• ${l.oda ? l.oda + ' – ' : ''}${l.ad}${l.olcu ? ' (' + l.olcu + ')' : ''}${num(l.miktar) !== 1 ? ' · ' + N2(l.miktar) + ' ' + (l.birim || '') : ''}`).join('\n');
  return `Merhaba ${s.musteri || ''},\n${a.firma} ${s.durum === 'teklif' ? 'teklifiniz' : 'sipariş özetiniz'} (${s.no}):\n\n${satir}\n\nTutar (KDV hariç): ${TL(c.matrah)}\nKDV: ${TL(c.kdv)}\nGenel toplam: ${TL(c.toplam)}${c.tahsil ? `\nÖdenen: ${TL(c.tahsil)}\nKalan: ${TL(c.kalan)}` : ''}${s.montaj ? `\nMontaj tarihi: ${fmtDate(s.montaj)}${s.montajSaat ? ' ' + s.montajSaat : ''}` : ''}\n\n${a.firma} · ${a.tel}`;
}
const waHatirlat = (s) => `Merhaba ${s.musteri || ''},\n${s.no} numaralı siparişinizden kalan ${TL(calcSatis(s).kalan)} tutarı bilginize sunarız.\nTeşekkür ederiz.\n${ayar().firma} · ${ayar().tel}`;

/* ---------------- giriş ---------------- */
function showLogin() { $('#shell').hidden = true; $('#setup').hidden = true; $('#login').hidden = false; $('#pw').focus(); }
async function boot() {
  const me = await api({ a: 'me' });
  if (me.status === 503) {
    $('#setup').hidden = false;
    $('#setup-list').innerHTML = (me.missing?.store ? '<li>Veri deposu (Neon ya da Upstash) bağlı değil.</li>' : '') + (me.missing?.password ? '<li>ADMIN_PASSWORD tanımlı değil.</li>' : '');
    return;
  }
  if (!me.ok) return showLogin();
  await loadAll();
}
async function loadAll() {
  const r = await api({ a: 'all' });
  if (!r.ok) { if (r.error === 'session') return showLogin(); toast('Veriler alınamadı: ' + r.error, true); return; }
  for (const k of Object.keys(S)) S[k] = r.data[k] || [];
  $('#login').hidden = true; $('#shell').hidden = false;
  route();
}
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await api({ a: 'login', password: $('#pw').value });
  $('#pw').value = '';
  if (r.ok) { $('#login-msg').textContent = ''; return loadAll(); }
  $('#login-msg').textContent = r.error === 'rate' ? 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.' : r.status === 503 ? 'Kurulum tamamlanmadı.' : 'Şifre hatalı.';
});
$('#logout').addEventListener('click', async () => { await api({ a: 'logout' }); location.hash = ''; showLogin(); });

/* ---------------- yönlendirme ---------------- */
const VIEWS = {};
function route() {
  const [v, arg] = (location.hash || '#ozet').slice(1).split('/');
  const name = VIEWS[v] ? v : 'ozet';
  const navName = name === 'musteri' ? 'musteriler' : name;
  $$('#nav a').forEach((a) => { if (a.getAttribute('href') === '#' + navName) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const m = $('#main'); m.innerHTML = ''; VIEWS[name](m, arg ? decodeURIComponent(arg) : '');
}
addEventListener('hashchange', () => { if (!$('#shell').hidden) { route(); scrollTo(0, 0); } });
document.addEventListener('click', (e) => {   // her yerden sipariş açma
  const b = e.target.closest('[data-os]');
  if (b && !b.closest('dialog')) { const s = S.satislar.find((x) => x.id === b.dataset.os); if (s) editSatis(structuredClone(s)); }
  const n = e.target.closest('#fab-new');
  if (n) editSatis(newSatis());
});
const months = () => {
  const set = new Set([ymOf(today())]);
  for (const c of ['satislar', 'alislar', 'giderler']) S[c].forEach((d) => d.tarih && set.add(ymOf(d.tarih)));
  return [...set].sort().reverse();
};
const head = (h, p, btns = '') => `<div class="head"><div><h1>${h}</h1>${p ? `<p>${p}</p>` : ''}</div><div class="row">${btns}</div></div>`;
const kpi = (l, v, cls = '') => `<div class="kpi ${cls}"><span>${l}</span><b>${TL(v)}</b></div>`;
const empty = (cols, t) => `<tr><td colspan="${cols}" class="empty">${t}</td></tr>`;

/* ---------------- ÖZET ---------------- */
let curYM = ymOf(today());
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* yok say */ } };
VIEWS.ozet = (m) => {
  const R = calcAy(curYM), t = today();
  const bugun = S.satislar.filter((s) => s.montaj === t && s.durum !== 'teslim');
  const geciken = S.satislar.filter((s) => s.montaj && s.montaj < t && s.durum === 'siparis');
  const alacak = S.satislar.filter((s) => gecikmis(s, t));
  const borc = S.alislar.filter((a) => a.vade && a.vade <= t && calcAlis(a).kalan > 0.009);
  const kritik = S.kalemler.filter((k) => k.stok && num(k.kritik) > 0 && stokOf(k).mevcut <= num(k.kritik));
  const sonYedek = lsGet('bp-son-yedek');
  const yedekGun = sonYedek ? daysBetween(sonYedek, t) : null;
  const li = (s, extra) => `<li><button class="link" data-os="${s.id}">${esc(s.musteri)} · ${esc(s.no)}</button> ${extra}</li>`;
  const card = (title, cls, items, emptyTxt) => `<div class="card alert ${items.length ? cls : ''}"><h3>${title}</h3>${items.length ? `<ul>${items.join('')}</ul>` : `<p class="note">${emptyTxt}</p>`}</div>`;
  const kat = Object.entries(R.kat).sort((a, b) => b[1] - a[1]).map(([n, v]) => `<tr><td>${esc(n)}</td><td class="n">${TL(v)}</td></tr>`).join('') || empty(2, 'Bu ay gider yok');
  m.innerHTML = head('Özet', `${dayLabel(t)}`, '<button class="btn" id="fab-new" type="button">Yeni satış</button>')
  + `<div class="alerts">
    ${card('Bugünkü montajlar', 'info', bugun.map((s) => li(s, s.montajSaat ? '· ' + esc(s.montajSaat) : '')), 'Bugün montaj yok.')}
    ${card('Geciken montajlar', 'bad', geciken.map((s) => li(s, '· ' + fmtDate(s.montaj))), 'Geciken montaj yok.')}
    ${card(`Vadesi geçen alacaklar (${num(ayar().vadeGun)} günden eski)`, 'bad', alacak.map((s) => li(s, '· ' + TL(calcSatis(s).kalan))), 'Vadesi geçen alacak yok.')}
    ${card('Vadesi gelen tedarikçi borçları', 'warn', borc.map((a) => `<li><a href="#tedarikciler">${esc(a.tedarikci)}</a> · ${esc(a.faturaNo || '')} · ${TL(calcAlis(a).kalan)}</li>`), 'Vadesi gelen borç yok.')}
    ${card('Azalan stok', 'warn', kritik.map((k) => `<li><a href="#stok">${esc(k.ad)}</a> · ${N2(stokOf(k).mevcut)} ${esc(k.birim)}</li>`), 'Kritik seviyede ürün yok.')}
    <div class="card alert ${yedekGun === null || yedekGun > 7 ? 'warn' : ''}"><h3>Yedek</h3><p class="note">Sunucuda her hafta otomatik yedek alınır. ${yedekGun === null ? 'Bu bilgisayara henüz yedek indirilmedi.' : `Bu bilgisayara son yedek ${yedekGun} gün önce indirildi.`}</p><div class="row"><button class="btn-sm" id="yedek-indir" type="button">Yedeği indir</button></div></div>
  </div>
  <div class="head"><div><h2>${ymLabel(curYM)}</h2><p>Teklif durumundaki satışlar rapora girmez. Tutarlar KDV hariçtir; KDV ayrıca gösterilir.</p></div><div class="row"><select id="ym" aria-label="Ay">${months().map((y) => `<option value="${y}"${y === curYM ? ' selected' : ''}>${ymLabel(y)}</option>`).join('')}</select><button class="btn-ghost" id="pr" type="button">Raporu yazdır</button><button class="btn-ghost" id="xl" type="button">Muhasebeci için Excel</button></div></div>
  <div class="kpis">${kpi('Satış (KDV hariç)', R.ciro)}${kpi('Satılan malzeme maliyeti', R.mUrun)}${kpi('İşçilik / hizmet maliyeti', R.mIsc)}${kpi('Brüt kâr', R.brutKar, R.brutKar >= 0 ? 'pos' : 'neg')}${kpi('Giderler (KDV hariç)', R.giderMatrah)}${kpi('Net kâr', R.netKar, R.netKar >= 0 ? 'pos' : 'neg')}</div>
  <div class="kpis">${kpi('Bu ay tahsilat', R.tahsilAy)}${kpi('Tedarikçilere ödenen', R.alisOdenen)}${kpi('Giderler (KDV dahil)', R.giderToplam)}${kpi('Nakit akışı', R.nakit, R.nakit >= 0 ? 'pos' : 'neg')}${kpi('Tahmini ödenecek KDV', R.kdvFark)}${kpi('Açık alacak (toplam)', R.alacak)}${kpi('Tedarikçi borcu (toplam)', R.borc)}</div>
  <div class="grid2"><div class="tbl-wrap"><table><thead><tr><th>Gider kategorisi</th><th class="n">Tutar</th></tr></thead><tbody>${kat}</tbody></table></div>
  <div class="card note"><h3>Nasıl hesaplanıyor?</h3><p>Brüt kâr = satış − satırlardaki malzeme ve işçilik maliyeti. Net kâr = brüt kâr − giderler. Nakit akışı = bu ay tahsil edilen − tedarikçilere ödenen − giderler. Tahmini KDV = satış KDV'si − alış ve gider KDV'si. Bu panel ön muhasebe içindir; resmî defter, e-fatura ve beyanname yerine geçmez.</p></div></div>`;
  $('#ym').onchange = (e) => { curYM = e.target.value; route(); };
  $('#pr').onclick = () => printRapor(curYM);
  $('#xl').onclick = () => exportXlsx(curYM);
  $('#yedek-indir').onclick = () => { downloadBackup(); route(); };
};

/* ---------------- TAKVİM ---------------- */
VIEWS.takvim = (m) => {
  const t = today();
  const aktif = S.satislar.filter((s) => s.durum === 'siparis');
  const tarihsiz = aktif.filter((s) => !s.montaj);
  const geciken = aktif.filter((s) => s.montaj && s.montaj < t);
  const row = (s) => { const c = calcSatis(s); return `<li class="ev"><span class="tm">${esc(s.montajSaat || '')}</span><div><button class="link" data-os="${s.id}"><b>${esc(s.musteri)}</b></button> · ${esc(s.no)}<br><span class="note">${esc(s.adres || '')}${s.montajNot ? ' · ' + esc(s.montajNot) : ''}</span></div><div class="row">${c.kalan > 0.009 ? `<span class="pill warn">Kalan ${TL(c.kalan)}</span>` : ''}<button class="btn-sm" data-teslim="${s.id}" type="button">Teslim edildi</button></div></li>`; };
  let days = '';
  for (let i = 0; i < 14; i++) {
    const d = addDays(t, i), list = aktif.filter((s) => s.montaj === d).sort((a, b) => String(a.montajSaat).localeCompare(b.montajSaat));
    if (!list.length && i > 6) continue;
    days += `<div class="day${i === 0 ? ' today' : ''}"><h3>${i === 0 ? 'Bugün · ' : i === 1 ? 'Yarın · ' : ''}${dayLabel(d)}</h3>${list.length ? `<ul class="evs">${list.map(row).join('')}</ul>` : '<p class="note">Montaj yok.</p>'}</div>`;
  }
  const sonra = aktif.filter((s) => s.montaj && s.montaj >= addDays(t, 14));
  m.innerHTML = head('Montaj takvimi', 'Sipariş durumundaki işler. Montaj tarihi sipariş ekranından girilir; iş bitince "Teslim edildi" deyin.', '<button class="btn" id="fab-new" type="button">Yeni satış</button>')
    + (geciken.length ? `<div class="day late"><h3>Tarihi geçmiş</h3><ul class="evs">${geciken.map((s) => row(s).replace('<span class="tm">', `<span class="tm">${fmtDate(s.montaj)} `)).join('')}</ul></div>` : '')
    + days
    + (sonra.length ? `<div class="day"><h3>Daha ileri tarihli</h3><ul class="evs">${sonra.map((s) => row(s).replace('<span class="tm">', `<span class="tm">${fmtDate(s.montaj)} `)).join('')}</ul></div>` : '')
    + `<div class="day"><h3>Montaj tarihi verilmemiş (${tarihsiz.length})</h3>${tarihsiz.length ? `<ul class="evs">${tarihsiz.map(row).join('')}</ul>` : '<p class="note">Yok.</p>'}</div>`;
  $$('[data-teslim]', m).forEach((b) => (b.onclick = async () => {
    const s = S.satislar.find((x) => x.id === b.dataset.teslim);
    if (await save('satislar', { ...s, durum: 'teslim', teslimTarihi: today() })) route();
  }));
};

/* ---------------- KALEMLER ---------------- */
const TUR = { urun: 'Ürün', iscilik: 'İşçilik', hizmet: 'Hizmet' };
let kFilter = { q: '', tur: '', ted: '' };
VIEWS.kalemler = (m) => {
  const teds = [...new Set(S.kalemler.map((k) => k.tedarikci).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));
  const draw = () => {
    const q = kFilter.q.toLocaleLowerCase('tr');
    const list = [...S.kalemler].filter((k) => (!q || `${k.kod} ${k.ad}`.toLocaleLowerCase('tr').includes(q)) && (!kFilter.tur || k.stokTur === kFilter.tur) && (!kFilter.ted || k.tedarikci === kFilter.ted))
      .sort((a, b) => String(a.ad).localeCompare(b.ad, 'tr'));
    $('#kbody').innerHTML = list.map((k) => {
      const marj = num(k.satis) ? ((num(k.satis) - num(k.alis)) / num(k.satis)) * 100 : 0;
      return `<tr><td>${esc(k.kod)}</td><td>${esc(k.ad)}${k.stok ? ' <span class="pill ok">stok</span>' : ''}${k.tedarikci ? `<br><small class="note">${esc(k.tedarikci)}${k.en ? ' · en ' + esc(k.en) + ' cm' : ''}${k.durum ? ' · ' + esc(k.durum) : ''}</small>` : ''}</td><td>${STOK_TUR[k.stokTur] || TUR[k.tur] || ''}</td><td>${esc(k.birim)}</td><td class="n">${TL(k.alis)}${k.dovizFiyat ? `<br><small class="note">${N2(k.dovizFiyat)} ${esc(k.doviz || '')}</small>` : ''}</td><td class="n">${TL(k.satis)}</td><td class="n">%${N2(k.kdv)}</td><td class="n">%${N2(marj)}</td><td><button class="btn-sm" data-e="${k.id}">Düzenle</button></td></tr>`;
    }).join('') || empty(9, S.kalemler.length ? 'Aramaya uyan kalem yok.' : 'Henüz kalem yok. "Fiyat listesi yükle" ya da "Yeni kalem" ile ekleyin.');
    $('#kcount').textContent = `${list.length} kalem`;
    $$('[data-e]', m).forEach((b) => (b.onclick = () => editKalem(S.kalemler.find((k) => k.id === b.dataset.e))));
  };
  m.innerHTML = head('Kalemler', 'Ürün, işçilik ve hizmet kalemleri; alış (maliyet) ve satış fiyatları. Tedarikçinin fiyat listesini yükleyerek kalemleri toplu ekleyin ya da fiyatları güncelleyin.', '<button class="btn-ghost" id="fl">Fiyat listesi yükle</button><button class="btn" id="new">Yeni kalem</button>')
    + `<div class="card grid2" style="margin-bottom:12px"><div><label for="kq">Ara (kod ya da ad)</label><input id="kq" type="search" value="${esc(kFilter.q)}"></div>
      <div class="grid2">${sel('kt', 'Stok türü', [['', 'Tümü'], ...Object.entries(STOK_TUR)], kFilter.tur)}${sel('kted', 'Tedarikçi', [['', 'Tümü'], ...teds.map((t) => [t, t])], kFilter.ted)}</div></div>
    <p class="note" id="kcount"></p>
    <div class="tbl-wrap"><table><thead><tr><th>Kod</th><th>Ad</th><th>Tür</th><th>Birim</th><th class="n">Alış / maliyet</th><th class="n">Satış</th><th class="n">KDV</th><th class="n">Marj</th><th></th></tr></thead><tbody id="kbody"></tbody></table></div>`;
  $('#kq').oninput = (e) => { kFilter.q = e.target.value; draw(); };
  $('#kt').onchange = (e) => { kFilter.tur = e.target.value; draw(); };
  $('#kted').onchange = (e) => { kFilter.ted = e.target.value; draw(); };
  $('#new').onclick = () => editKalem({ tur: 'urun', birim: 'metre', kdv: ayar().kdv });
  $('#fl').onclick = fiyatListesiYukle;
  draw();
};

/* ---------------- FİYAT LİSTESİ (Excel) İÇE AKTARMA ---------------- */
function fiyatListesiYukle() {
  let parsed = null, plan = null, fname = '';
  const turOpts = [['', 'Seçin…'], ...Object.entries(STOK_TUR)];
  openDlg(`<h2>Fiyat listesi yükle</h2>
    <p class="note">Tedarikçinin fiyat listesini Excel (.xlsx) olarak seçin. Listede olmayan ürünler stok kalemi olarak eklenir; daha önce yüklenmiş ürünlerin (aynı tedarikçi ve kod) yalnızca fiyatları güncellenir, stok miktarlarına dokunulmaz. Dosya bilgisayarınızda okunur.</p>
    <div><label for="flf">Excel dosyası</label><input id="flf" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div>
    <div id="flres"></div>`, async () => {
    if (!plan) { toast('Önce dosya seçin', true); return false; }
    const docs = [...plan.yeni, ...plan.degisen.map((d) => d.yeni)];
    if (!docs.length) { toast('Değişiklik yok'); return true; }
    const btn = $('#dlg-ok'); btn.disabled = true; btn.textContent = 'Kaydediliyor…';
    let n = 0;
    for (let i = 0; i < docs.length; i += 100) {
      const r = await api({ a: 'bulk', col: 'kalemler', docs: docs.slice(i, i + 100) });
      if (!r.ok) { toast(r.error === 'session' ? 'Oturum süresi doldu, yeniden giriş yapın.' : 'Kaydedilemedi: ' + r.error, true); btn.disabled = false; btn.textContent = 'Kaydet'; if (n) await loadAll(); return false; }
      for (const d of r.docs) { const j = S.kalemler.findIndex((x) => x.id === d.id); if (j >= 0) S.kalemler[j] = d; else S.kalemler.push(d); }
      n += r.docs.length;
    }
    toast(`${plan.yeni.length} yeni kalem eklendi, ${plan.degisen.length} kalem güncellendi`);
    return true;
  });
  const okBtn = $('#dlg-ok'); okBtn.textContent = 'Listeyi uygula'; okBtn.disabled = true;
  const replan = () => {
    const ted = $('#flted').value.trim(), vt = $('#flvt') ? $('#flvt').value : '';
    const items = parsed.items.map((it) => ({ ...it, stokTur: it.stokTur || vt }));
    plan = planImport(S.kalemler, items, { tedarikci: ted, tarih: today(), kdv: num(ayar().kdv), kaynak: fname });
    const fiyat = plan.degisen.filter((d) => d.fiyatDegisti);
    const turSay = {}; plan.yeni.forEach((d) => (turSay[d.stokTur || '-'] = (turSay[d.stokTur || '-'] || 0) + 1));
    $('#flsum').innerHTML = `<ul class="checks">
      <li><span class="pill ok">Yeni</span> <span>${plan.yeni.length} ürün stok kalemi olarak eklenecek${plan.yeni.length ? ' (' + Object.entries(turSay).map(([t, c]) => `${STOK_TUR[t] || 'türü seçilmemiş'}: ${c}`).join(', ') + ')' : ''}</span></li>
      <li><span class="pill warn">Güncelleme</span> <span>${fiyat.length} üründe fiyat değişti${plan.degisen.length - fiyat.length ? `, ${plan.degisen.length - fiyat.length} üründe en/durum bilgisi değişti` : ''}</span></li>
      <li><span class="pill teklif">Aynı</span> <span>${plan.ayni} ürün değişmedi</span></li>
      ${plan.atlanan ? `<li><span class="pill bad">Atlandı</span> <span>${plan.atlanan} satır listede iki kez geçiyor</span></li>` : ''}</ul>
      ${fiyat.length ? `<div class="tbl-wrap"><table><thead><tr><th>Kod</th><th>Ürün</th><th class="n">Eski alış</th><th class="n">Yeni alış</th><th class="n">Eski satış</th><th class="n">Yeni satış</th></tr></thead><tbody>${fiyat.slice(0, 200).map((d) => `<tr><td>${esc(d.yeni.kod)}</td><td>${esc(d.yeni.ad)}</td><td class="n">${TL(d.eski.alis)}</td><td class="n"><b>${TL(d.yeni.alis)}</b></td><td class="n">${TL(d.eski.satis)}</td><td class="n"><b>${TL(d.yeni.satis)}</b></td></tr>`).join('')}</tbody></table></div>` : ''}`;
    okBtn.disabled = !(plan.yeni.length || plan.degisen.length) || !ted || (plan.yeni.some((d) => !d.stokTur));
  };
  $('#flf').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    fname = f.name;
    const out = $('#flres'); out.innerHTML = '<p class="note">Okunuyor…</p>';
    try { parsed = parseFiyatListesi(await readXlsx(await f.arrayBuffer())); }
    catch (err) { out.innerHTML = `<p><span class="pill bad">Hata</span> ${esc(err.message)}. Dosya Excel (.xlsx) biçiminde olmalı; PDF ise önce Excel'e aktarılmış hâlini yükleyin.</p>`; return; }
    if (!parsed.items.length) { out.innerHTML = '<p><span class="pill bad">Hata</span> Listede ürün satırı bulunamadı.</p>'; return; }
    const eksikTur = parsed.items.some((it) => !it.stokTur);
    const kur = Object.entries(parsed.kur).map(([k, v]) => `${esc(k)}: ${N2(v)}`).join(' · ');
    out.innerHTML = `<div class="grid2">${field('flted', 'Tedarikçi', parsed.tedarikci, 'text', 'required')}${eksikTur ? sel('flvt', 'Kategorisinden türü anlaşılmayan ürünlerin stok türü', turOpts, '') : `<div><label>Okunan</label><p>${parsed.items.length} ürün${kur ? ' · ' + kur : ''}</p></div>`}</div>
      <p class="note">Tedarikçi adı eşleştirme için kullanılır: aynı firmanın sonraki listelerini aynı adla yükleyin.</p><div id="flsum"></div>`;
    $('#flted').oninput = replan;
    if ($('#flvt')) $('#flvt').onchange = replan;
    replan();
  };
}
function field(id, label, val = '', type = 'text', extra = '') { return `<div><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${esc(val)}" ${extra}></div>`; }
function sel(id, label, opts, val, extra = '') { return `<div><label for="${id}">${label}</label><select id="${id}" name="${id}" ${extra}>${opts.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`; }
const hesapOpts = (v) => ayar().hesaplar.map((h) => `<option${h === (v || H0()) ? ' selected' : ''}>${esc(h)}</option>`).join('');
function openDlg(html, onSave, onDel) {
  const d = $('#dlg'), f = $('#dlg-form');
  f.oninput = null; f.onchange = null;
  f.innerHTML = html + `<div class="dlg-foot"><div class="row">${onDel ? '<button class="btn-sm danger" type="button" id="dlg-del">Sil</button>' : ''}</div><div class="row"><button class="btn-ghost" value="cancel" formnovalidate>Vazgeç</button>${onSave ? '<button class="btn" id="dlg-ok" type="button">Kaydet</button>' : ''}</div></div>`;
  if (!d.open) d.showModal();
  d.scrollTop = 0; f.scrollTop = 0;
  if (onSave) $('#dlg-ok').onclick = async () => { if (!f.reportValidity()) return; if ((await onSave(f)) !== false) { d.close(); route(); } };
  if (onDel) armBtn($('#dlg-del'), 'Silmeyi onayla', async () => { if (await onDel()) { d.close(); route(); } });
}
function armBtn(btn, confirmText, fn) {   // iki adımlı onay (tarayıcı onay pencereleri yerine)
  let armed = false; const orig = btn.textContent;
  btn.onclick = async () => {
    if (!armed) { armed = true; btn.textContent = confirmText; setTimeout(() => { armed = false; btn.textContent = orig; }, 5000); return; }
    armed = false; btn.textContent = orig; await fn();
  };
}
const val = (f, n) => f.elements[n] ? f.elements[n].value.trim() : '';
function editKalem(k) {
  openDlg(`<h2>${k.id ? 'Kalemi düzenle' : 'Yeni kalem'}</h2><div class="grid2">${field('kod', 'Kod', k.kod)}${field('ad', 'Ad', k.ad, 'text', 'required')}
    ${sel('tur', 'Tür', Object.entries(TUR), k.tur)}${field('birim', 'Birim (metre, m², adet, saat…)', k.birim)}
    ${field('alis', 'Alış / maliyet fiyatı (KDV hariç)', N2(k.alis || 0), 'text', 'inputmode="decimal"')}${field('satis', 'Satış fiyatı (KDV hariç)', N2(k.satis || 0), 'text', 'inputmode="decimal"')}
    ${field('kdv', 'KDV %', k.kdv ?? ayar().kdv, 'text', 'inputmode="decimal"')}</div>
    <p class="note">İşçilik ve hizmet kalemlerinde "alış" alanına ustaya ödenen ya da size maliyeti olan tutarı yazın; kâr hesabı buna göre yapılır.</p>
    <fieldset class="card"><legend>Stok takibi</legend><label class="chk"><input type="checkbox" id="stok" ${k.stok ? 'checked' : ''}> Bu kalemin stoğunu takip et (kumaş, ray, aksesuar)</label>
    <div class="grid2">${sel('stokTur', 'Stok türü', [['', '—'], ...Object.entries(STOK_TUR)], k.stokTur || '')}${field('tedarikci', 'Tedarikçi', k.tedarikci || '')}
    ${field('acilisStok', 'Başlangıç stoğu', N2(k.acilisStok || 0), 'text', 'inputmode="decimal"')}${field('kritik', 'Uyarı seviyesi (bunun altına inince uyar)', N2(k.kritik || 0), 'text', 'inputmode="decimal"')}</div>
    ${k.dovizFiyat || k.en || k.kategori ? `<p class="note">${[k.kategori, k.dovizFiyat ? `liste fiyatı ${N2(k.dovizFiyat)} ${esc(k.doviz || '')}` : '', k.en ? `en ${esc(k.en)} cm` : '', k.durum].filter(Boolean).map(esc).join(' · ')}</p>` : ''}</fieldset>
    ${(k.fiyatGecmis || []).length > 1 ? `<details class="card"><summary>Fiyat geçmişi (${k.fiyatGecmis.length})</summary><div class="tbl-wrap"><table><thead><tr><th>Tarih</th><th class="n">Alış</th><th class="n">Satış</th><th class="n">Liste</th></tr></thead><tbody>${[...k.fiyatGecmis].reverse().map((g) => `<tr><td>${fmtDate(g.tarih)}</td><td class="n">${TL(g.alis)}</td><td class="n">${TL(g.satis)}</td><td class="n">${g.dovizFiyat != null ? N2(g.dovizFiyat) : ''}</td></tr>`).join('')}</tbody></table></div></details>` : ''}`,
  (f) => save('kalemler', { ...k, kod: val(f, 'kod'), ad: val(f, 'ad'), tur: val(f, 'tur'), birim: val(f, 'birim'), alis: num(val(f, 'alis')), satis: num(val(f, 'satis')), kdv: num(val(f, 'kdv')), stok: $('#stok').checked, stokTur: val(f, 'stokTur'), tedarikci: val(f, 'tedarikci'), acilisStok: num(val(f, 'acilisStok')), kritik: num(val(f, 'kritik')) }),
  k.id ? () => remove('kalemler', k.id) : null);
}

/* ---------------- STOK ---------------- */
let sTur = '';
VIEWS.stok = (m) => {
  const ks = S.kalemler.filter((k) => k.stok && (!sTur || k.stokTur === sTur)).sort((a, b) => String(a.ad).localeCompare(b.ad, 'tr'));
  const rows = ks.map((k) => { const s = stokOf(k), low = num(k.kritik) > 0 && s.mevcut <= num(k.kritik);
    return `<tr><td>${esc(k.ad)}${k.tedarikci ? `<br><small class="note">${esc(k.tedarikci)}</small>` : ''}</td><td>${STOK_TUR[k.stokTur] || ''}</td><td>${esc(k.birim)}</td><td class="n">${N2(num(k.acilisStok) + num(k.duzeltme))}</td><td class="n">${N2(s.giris)}</td><td class="n">${N2(s.cikis)}</td><td class="n"><b>${N2(s.mevcut)}</b></td><td class="n">${N2(k.kritik)}</td><td>${s.mevcut < 0 ? '<span class="pill bad">Eksi</span>' : low ? '<span class="pill warn">Azaldı</span>' : '<span class="pill ok">Yeterli</span>'}</td><td><button class="btn-sm" data-say="${k.id}">Sayım gir</button></td></tr>`; }).join('');
  m.innerHTML = head('Stok', 'Alış faturasındaki "stoğa giren" satırlar stoğu artırır; sipariş ve teslimlerdeki satırlar düşer (teklifler düşmez). Depoyu saydığınızda "Sayım gir" ile düzeltin.')
    + `<div class="row" style="margin-bottom:12px">${[['', 'Tümü'], ...Object.entries(STOK_TUR)].map(([v, t]) => `<button class="${sTur === v ? "btn" : "btn-ghost"}" data-st="${v}" type="button">${t} (${S.kalemler.filter((k) => k.stok && (!v || k.stokTur === v)).length})</button>`).join('')}</div>`
    + `<div class="tbl-wrap"><table><thead><tr><th>Kalem</th><th>Tür</th><th>Birim</th><th class="n">Başlangıç + sayım</th><th class="n">Giriş</th><th class="n">Çıkış</th><th class="n">Mevcut</th><th class="n">Uyarı</th><th>Durum</th><th></th></tr></thead><tbody>${rows || empty(10, 'Stok takibi açık kalem yok. Kalemler ekranında "Bu kalemin stoğunu takip et" kutusunu işaretleyin.')}</tbody></table></div>`;
  $$('[data-say]', m).forEach((b) => (b.onclick = () => {
    const k = S.kalemler.find((x) => x.id === b.dataset.say), s = stokOf(k);
    openDlg(`<h2>Sayım: ${esc(k.ad)}</h2><p>Sistemdeki miktar: <b>${N2(s.mevcut)} ${esc(k.birim)}</b></p>${field('sayim', `Depoda saydığınız miktar (${esc(k.birim)})`, N2(s.mevcut), 'text', 'inputmode="decimal" required')}`,
      (f) => save('kalemler', { ...k, duzeltme: r2(num(k.duzeltme) + num(val(f, 'sayim')) - s.mevcut) }));
  }));
  $$('[data-st]', m).forEach((b) => (b.onclick = () => { sTur = b.dataset.st; route(); }));
};

/* ---------------- SATIŞLAR ---------------- */
const DURUM = { teklif: 'Teklif', siparis: 'Sipariş', teslim: 'Teslim edildi' };
let satisFiltre = '';
VIEWS.satislar = (m) => {
  const q = satisFiltre.toLocaleLowerCase('tr');
  const list = [...S.satislar].filter((s) => !q || `${s.musteri} ${s.no} ${s.tel}`.toLocaleLowerCase('tr').includes(q)).sort((a, b) => String(b.tarih).localeCompare(a.tarih));
  const rows = list.map((s) => { const c = calcSatis(s); return `<tr${gecikmis(s) ? ' class="late"' : ''}><td>${fmtDate(s.tarih)}</td><td>${esc(s.no)}</td><td><a href="#musteri/${encodeURIComponent(mKey(s))}">${esc(s.musteri)}</a></td><td><span class="pill ${s.durum}">${DURUM[s.durum] || ''}</span></td><td>${s.montaj ? fmtDate(s.montaj) : ''}</td><td class="n">${TL(c.toplam)}</td><td class="n">${TL(c.kar)}</td><td class="n">${TL(c.kalan)}</td><td class="row"><button class="btn-sm" data-os="${s.id}">Aç</button>${s.durum === 'teklif' ? `<button class="btn-sm" data-cevir="${s.id}">Siparişe çevir</button>` : ''}</td></tr>`; }).join('');
  m.innerHTML = head('Satışlar', 'Teklif, sipariş ve teslimler. Ürün, işçilik ve hizmet satırları; KDV, iskonto, maliyet, kâr ve tahsilat otomatik hesaplanır.', `<input id="sq" type="search" placeholder="Müşteri, no, telefon ara" value="${esc(satisFiltre)}" aria-label="Ara" style="width:220px"><button class="btn" id="fab-new" type="button">Yeni satış</button>`)
    + `<div class="tbl-wrap"><table><thead><tr><th>Tarih</th><th>No</th><th>Müşteri</th><th>Durum</th><th>Montaj</th><th class="n">Toplam (KDV dahil)</th><th class="n">Kâr</th><th class="n">Kalan</th><th></th></tr></thead><tbody>${rows || empty(9, satisFiltre ? 'Sonuç yok.' : 'Henüz satış yok.')}</tbody></table></div>`;
  $('#sq').oninput = (e) => { satisFiltre = e.target.value; const pos = e.target.selectionStart; route(); const i = $('#sq'); i.focus(); i.setSelectionRange(pos, pos); };
  $$('[data-cevir]', m).forEach((b) => (b.onclick = async () => { if (await teklifToSiparis(S.satislar.find((s) => s.id === b.dataset.cevir))) route(); }));
};
async function teklifToSiparis(s) {
  if (await save('satislar', { ...s, durum: 'siparis', teklifTarihi: s.teklifTarihi || s.tarih, tarih: today() }, true)) { toast('Teklif siparişe çevrildi'); return true; }
  return false;
}
function nextNo() {
  const ym = today().slice(0, 7).replace('-', '');
  const used = new Set(S.satislar.map((s) => s.no));
  let n = S.satislar.filter((s) => String(s.no || '').startsWith('BP-' + ym)).length + 1;
  while (used.has(`BP-${ym}-${String(n).padStart(3, '0')}`)) n++;
  return `BP-${ym}-${String(n).padStart(3, '0')}`;
}
const newSatis = (extra = {}) => ({ tarih: today(), durum: 'siparis', no: nextNo(), satirlar: [], tahsilat: [], ...extra });
function editSatis(s) {
  s.satirlar = s.satirlar || []; s.tahsilat = s.tahsilat || [];
  const kOpts = '<option value="">Kalem seç…</option>' + [...S.kalemler].sort((a, b) => String(a.ad).localeCompare(b.ad, 'tr')).map((k) => `<option value="${k.id}">${esc(k.ad)} (${TUR[k.tur] || ''})</option>`).join('');
  const ms = musteriler();
  const lineRow = (l, i) => `<tr data-i="${i}"${l.kalemId ? ` data-kid="${esc(l.kalemId)}"` : ''}><td data-l="Kalem"><select data-k aria-label="Kalem">${kOpts}</select><input data-f="ad" value="${esc(l.ad)}" placeholder="Açıklama" aria-label="Açıklama"></td>
    <td data-l="Tür"><select data-f="tur" aria-label="Tür">${Object.entries(TUR).map(([v, t]) => `<option value="${v}"${(l.tur || 'urun') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></td>
    <td data-l="Oda"><input data-f="oda" value="${esc(l.oda)}" placeholder="Salon" aria-label="Oda"></td><td data-l="Ölçü (en × boy)"><input data-f="olcu" value="${esc(l.olcu)}" placeholder="300×260" aria-label="Ölçü"></td>
    <td data-l="Miktar"><input data-f="miktar" value="${N2(l.miktar ?? 1)}" inputmode="decimal" aria-label="Miktar"></td><td data-l="Birim"><input data-f="birim" value="${esc(l.birim)}" aria-label="Birim"></td>
    <td data-l="Birim fiyat"><input data-f="fiyat" value="${N2(l.fiyat ?? 0)}" inputmode="decimal" aria-label="Birim fiyat"></td><td data-l="Birim maliyet"><input data-f="alis" value="${N2(l.alis ?? 0)}" inputmode="decimal" aria-label="Birim maliyet"></td>
    <td data-l="KDV %"><input data-f="kdv" value="${N2(l.kdv ?? ayar().kdv)}" inputmode="decimal" aria-label="KDV"></td>
    <td data-l="Atölye (pile, ray, not)"><input data-f="pile" value="${esc(l.pile)}" placeholder="Pile: 1/2,5" aria-label="Pile"><input data-f="detay" value="${esc(l.detay)}" placeholder="Ray, aksesuar, not" aria-label="Atölye notu"></td>
    <td class="n" data-l="Tutar" data-t></td><td><button type="button" class="btn-sm danger" data-x aria-label="Satırı sil">×</button></td></tr>`;
  const tRow = (t) => `<tr><td data-l="Tarih"><input type="date" data-tf="tarih" value="${esc(t.tarih)}" aria-label="Tahsilat tarihi"></td><td data-l="Tutar"><input data-tf="tutar" value="${N2(t.tutar)}" inputmode="decimal" aria-label="Tutar"></td><td data-l="Hesap"><select data-tf="hesap" aria-label="Hesap">${hesapOpts(t.hesap)}</select></td><td data-l="Not"><input data-tf="not" value="${esc(t.not)}" placeholder="Kapora, kalan…" aria-label="Not"></td><td><button type="button" class="btn-sm danger" data-tx aria-label="Tahsilatı sil">×</button></td></tr>`;
  openDlg(`<div class="head"><h2>${s.id ? 'Satış ' + esc(s.no) : 'Yeni satış'}</h2><div class="row" id="sact"></div></div>
    <div class="grid2">${field('tarih', 'Tarih', s.tarih, 'date', 'required')}${field('no', 'Sipariş no', s.no)}${sel('durum', 'Durum', Object.entries(DURUM), s.durum)}
    ${field('musteri', 'Müşteri', s.musteri, 'text', 'required list="mlist" autocomplete="off"')}${field('tel', 'Telefon', s.tel, 'tel')}${field('adres', 'Adres', s.adres)}</div>
    <datalist id="mlist">${ms.map((o) => `<option value="${esc(o.ad)}">${esc(o.tel || '')}</option>`).join('')}</datalist>
    <fieldset class="card"><legend>Montaj</legend><div class="grid2">${field('montaj', 'Montaj tarihi', s.montaj, 'date')}${field('montajSaat', 'Saat', s.montajSaat, 'time')}${field('montajNot', 'Montaj notu', s.montajNot, 'text', 'placeholder="Kat, anahtar, ekip…"')}</div></fieldset>
    <div class="tbl-wrap lines"><table><thead><tr><th>Kalem / açıklama</th><th>Tür</th><th>Oda</th><th>Ölçü</th><th>Miktar</th><th>Birim</th><th>Birim fiyat</th><th>Birim maliyet</th><th>KDV %</th><th>Atölye</th><th class="n">Tutar</th><th></th></tr></thead><tbody id="lines">${s.satirlar.map(lineRow).join('')}</tbody></table></div>
    <div class="row"><button type="button" class="btn-sm" id="addl">+ Satır ekle</button></div>
    <div class="grid2"><div>${field('iskonto', 'İskonto (TL, KDV hariç)', N2(s.iskonto || 0), 'text', 'inputmode="decimal"')}
      <div><label for="not">Not</label><textarea id="not" name="not">${esc(s.not)}</textarea></div></div><div class="sum card" id="sum"></div></div>
    <h3>Tahsilatlar</h3><div class="tbl-wrap lines tahs"><table><thead><tr><th>Tarih</th><th>Tutar (TL)</th><th>Hesap</th><th>Not</th><th></th></tr></thead><tbody id="tahs">${s.tahsilat.map(tRow).join('')}</tbody></table></div>
    <div class="row"><button type="button" class="btn-sm" id="addt">+ Tahsilat ekle</button></div>
    <h3>Fotoğraflar</h3>${s.id ? `<div class="photos" id="photos"><p class="note">Yükleniyor…</p></div><div class="row"><select id="fcat" aria-label="Fotoğraf türü"><option>Ölçü</option><option>Bitmiş iş</option><option>Diğer</option></select><label class="btn-sm" for="fup" style="margin:0">+ Fotoğraf ekle</label><input id="fup" type="file" accept="image/*" multiple hidden></div>` : '<p class="note">Fotoğraf eklemek için önce satışı kaydedin.</p>'}`,
  async (f) => { pull(); return save('satislar', { ...s, ...head5(f) }); },
  s.id ? () => remove('satislar', s.id) : null);
  function head5(f) { return { tarih: val(f, 'tarih'), no: val(f, 'no'), durum: val(f, 'durum'), musteri: val(f, 'musteri'), tel: val(f, 'tel'), adres: val(f, 'adres'), montaj: val(f, 'montaj'), montajSaat: val(f, 'montajSaat'), montajNot: val(f, 'montajNot'), iskonto: num(val(f, 'iskonto')), not: $('#not').value.trim(), ...(val(f, 'durum') === 'teslim' && !s.teslimTarihi ? { teslimTarihi: today() } : {}) }; }
  function pull() {
    s.satirlar = $$('#lines tr').map((tr) => { const o = {}; $$('[data-f]', tr).forEach((i) => { o[i.dataset.f] = ['miktar', 'fiyat', 'alis', 'kdv'].includes(i.dataset.f) ? num(i.value) : i.value.trim(); }); o.kalemId = tr.dataset.kid || ''; return o; });
    s.tahsilat = $$('#tahs tr').map((tr) => ({ tarih: $('[data-tf="tarih"]', tr).value, tutar: num($('[data-tf="tutar"]', tr).value), hesap: $('[data-tf="hesap"]', tr).value, not: $('[data-tf="not"]', tr).value.trim() })).filter((t) => t.tutar);
    s.iskonto = num($('#iskonto').value);
    Object.assign(s, head5($('#dlg-form')));
  }
  function actions() {
    const c = calcSatis(s), w1 = waLink(s.tel, waTeklif(s)), w2 = waLink(s.tel, waHatirlat(s));
    const wa = (href, t) => href ? `<a class="btn-sm wa" href="${esc(href)}" target="_blank" rel="noopener">${t}</a>` : `<span class="btn-sm off" title="Telefon numarası girin">${t}</span>`;
    $('#sact').innerHTML = `${s.durum === 'teklif' && s.id ? '<button type="button" class="btn-sm" id="a-cevir">Siparişe çevir</button>' : ''}${wa(w1, s.durum === 'teklif' ? 'WhatsApp: teklif gönder' : 'WhatsApp: özet gönder')}${c.kalan > 0.009 && s.durum !== 'teklif' ? wa(w2, 'WhatsApp: ödeme hatırlat') : ''}<button type="button" class="btn-sm" id="a-pr">${s.durum === 'teklif' ? 'Teklif yazdır' : 'Sipariş yazdır'}</button><button type="button" class="btn-sm" id="a-at">Atölye iş emri</button><button type="button" class="btn-sm" id="a-et">Etiket</button>`;
    if ($('#a-cevir')) $('#a-cevir').onclick = async () => { pull(); s.durum = 'teklif'; if (await teklifToSiparis(s)) { $('#dlg').close(); route(); } };
    $('#a-pr').onclick = () => { pull(); printSatis(s); };
    $('#a-at').onclick = () => { pull(); printAtolye(s); };
    $('#a-et').onclick = () => { pull(); const ls = s.satirlar.filter((l) => (l.tur || 'urun') === 'urun'); if (!ls.length) return toast('Ürün satırı yok', true); printLabels(ls.map((l) => ({ musteri: s.musteri, no: s.no, tarih: s.tarih, oda: l.oda, urun: l.ad, olcu: l.olcu })), { w: num(ayar().etiketW), h: num(ayar().etiketH) }); };
  }
  function refresh() {
    pull();
    $$('#lines tr').forEach((tr, i) => { const l = s.satirlar[i]; $('[data-t]', tr).textContent = TL(num(l.miktar) * num(l.fiyat)); });
    const c = calcSatis(s);
    $('#sum').innerHTML = `<span>Ara toplam</span><b>${TL(c.ara)}</b><span>İskonto</span><b>−${TL(c.isk)}</b><span>Matrah</span><b>${TL(c.matrah)}</b><span>KDV</span><b>${TL(c.kdv)}</b><span>Genel toplam</span><b>${TL(c.toplam)}</b><span>Maliyet (malzeme + işçilik)</span><b>${TL(c.maliyet)}</b><span>Kâr</span><b style="color:${c.kar >= 0 ? 'var(--ok)' : 'var(--bad)'}">${TL(c.kar)}</b><span>Tahsil edilen</span><b>${TL(c.tahsil)}</b><span>Kalan</span><b>${TL(c.kalan)}</b>`;
    actions();
  }
  $$('#lines tr').forEach((tr) => { if (tr.dataset.kid) { const o = $('[data-k]', tr); o.value = tr.dataset.kid; } });
  $('#dlg-form').oninput = refresh;
  $('#musteri').onchange = (e) => {
    const o = ms.find((x) => x.ad === e.target.value);
    if (o) { if (!$('#tel').value) $('#tel').value = o.tel || ''; if (!$('#adres').value) $('#adres').value = o.adres || ''; refresh(); }
  };
  $('#lines').onchange = (e) => {
    if (!e.target.matches('[data-k]')) return;
    const k = S.kalemler.find((x) => x.id === e.target.value), tr = e.target.closest('tr');
    if (!k) return;
    tr.dataset.kid = k.id;
    const set = (fl, v) => { const i = $(`[data-f="${fl}"]`, tr); if (i) i.value = v; };
    set('ad', k.ad); set('tur', k.tur || 'urun'); set('birim', k.birim || ''); set('fiyat', N2(k.satis)); set('alis', N2(k.alis)); set('kdv', N2(k.kdv));
    refresh();
  };
  $('#lines').onclick = (e) => { if (e.target.matches('[data-x]')) { e.target.closest('tr').remove(); refresh(); } };
  $('#tahs').onclick = (e) => { if (e.target.matches('[data-tx]')) { e.target.closest('tr').remove(); refresh(); } };
  $('#addl').onclick = () => { pull(); $('#lines').insertAdjacentHTML('beforeend', lineRow({ miktar: 1, kdv: ayar().kdv }, s.satirlar.length)); refresh(); };
  $('#addt').onclick = () => { pull(); const c = calcSatis(s); $('#tahs').insertAdjacentHTML('beforeend', tRow({ tarih: today(), tutar: Math.max(0, c.kalan) })); refresh(); };
  refresh();
  if (s.id) photos(s.id);
}

/* ---------------- FOTOĞRAFLAR ---------------- */
async function shrink(file) {   // en uzun kenar 1600 px, JPEG; sunucu sınırının altına inene kadar kalite düşürülür
  const bmp = await createImageBitmap(file);
  const sc = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  for (const q of [0.8, 0.7, 0.6, 0.5, 0.4]) { const d = c.toDataURL('image/jpeg', q); if (d.length < 850 * 1024) return d; }
  throw new Error('çok büyük');
}
async function photos(satisId) {
  const box = $('#photos'); if (!box) return;
  const r = await api({ a: 'fotolar', satisId });
  if (!$('#photos')) return;
  if (!r.ok) { box.innerHTML = '<p class="note">Fotoğraflar alınamadı.</p>'; return; }
  const docs = r.docs.sort((a, b) => String(a.tarih).localeCompare(b.tarih));
  box.innerHTML = docs.length ? docs.map((d) => `<figure><button type="button" class="ph" data-big="${d.id}"><img src="${esc(d.data)}" alt="${esc(d.tur || 'Fotoğraf')}"></button><figcaption>${esc(d.tur || '')} · ${fmtDate(d.tarih)} <button type="button" class="btn-sm danger" data-pdel="${d.id}">Sil</button></figcaption></figure>`).join('') : '<p class="note">Henüz fotoğraf yok.</p>';
  $$('[data-big]', box).forEach((b) => (b.onclick = () => {
    const d = docs.find((x) => x.id === b.dataset.big);
    const lb = document.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = `<img src="${esc(d.data)}" alt=""><p>Kapatmak için dokunun</p>`;
    lb.onclick = () => lb.remove(); $('#dlg').appendChild(lb);
  }));
  $$('[data-pdel]', box).forEach((b) => armBtn(b, 'Emin misiniz?', async () => { if (await remove('fotolar', b.dataset.pdel)) photos(satisId); }));
  $('#fup').onchange = async (e) => {
    const files = [...e.target.files]; e.target.value = '';
    for (const f of files) {
      toast(`Yükleniyor: ${f.name}`);
      let data; try { data = await shrink(f); } catch (_) { toast(`${f.name} okunamadı`, true); continue; }
      await save('fotolar', { satisId, tarih: today(), tur: $('#fcat').value, data }, true);
    }
    toast('Fotoğraflar eklendi'); photos(satisId);
  };
}

/* ---------------- MÜŞTERİLER ---------------- */
let mFiltre = '';
VIEWS.musteriler = (m) => {
  const q = mFiltre.toLocaleLowerCase('tr');
  const list = musteriler().filter((o) => !q || `${o.ad} ${o.tel} ${o.adres}`.toLocaleLowerCase('tr').includes(q));
  const rows = list.map((o) => `<tr><td><a href="#musteri/${encodeURIComponent(o.key)}">${esc(o.ad)}</a></td><td>${esc(o.tel)}</td><td>${esc(o.adres)}</td><td class="n">${o.satislar.length}</td><td class="n">${TL(o.toplam)}</td><td class="n">${o.kalan > 0.009 ? `<b style="color:var(--bad)">${TL(o.kalan)}</b>` : TL(0)}</td><td>${fmtDate(o.son)}</td></tr>`).join('');
  m.innerHTML = head('Müşteriler', 'Satışlardaki müşteri adı ve telefonundan otomatik oluşur. Aynı telefon numarası tek müşteri sayılır.', `<input id="mq" type="search" placeholder="Ad, telefon, adres ara" value="${esc(mFiltre)}" aria-label="Ara" style="width:240px">`)
    + `<div class="tbl-wrap"><table><thead><tr><th>Müşteri</th><th>Telefon</th><th>Adres</th><th class="n">Satış</th><th class="n">Toplam</th><th class="n">Borç</th><th>Son işlem</th></tr></thead><tbody>${rows || empty(7, mFiltre ? 'Sonuç yok.' : 'Henüz müşteri yok.')}</tbody></table></div>`;
  $('#mq').oninput = (e) => { mFiltre = e.target.value; const pos = e.target.selectionStart; route(); const i = $('#mq'); i.focus(); i.setSelectionRange(pos, pos); };
};
VIEWS.musteri = (m, key) => {
  const o = musteriler().find((x) => x.key === key);
  if (!o) { m.innerHTML = head('Müşteri bulunamadı', '', '<a class="btn-ghost" href="#musteriler">Müşteriler</a>'); return; }
  const rows = [...o.satislar].sort((a, b) => String(b.tarih).localeCompare(a.tarih)).map((s) => { const c = calcSatis(s); return `<tr><td>${fmtDate(s.tarih)}</td><td><button class="link" data-os="${s.id}">${esc(s.no)}</button></td><td><span class="pill ${s.durum}">${DURUM[s.durum]}</span></td><td>${esc((s.satirlar || []).map((l) => l.ad).filter(Boolean).slice(0, 3).join(', '))}</td><td class="n">${TL(c.toplam)}</td><td class="n">${TL(c.tahsil)}</td><td class="n">${TL(c.kalan)}</td></tr>`; }).join('');
  const tahs = o.satislar.flatMap((s) => (s.tahsilat || []).map((t) => ({ ...t, no: s.no }))).sort((a, b) => String(b.tarih).localeCompare(a.tarih));
  const acik = o.satislar.filter((s) => s.durum !== 'teklif' && calcSatis(s).kalan > 0.009);
  const wa = waLink(o.tel, acik.length ? `Merhaba ${o.ad},\nBey Perde'deki açık bakiyeniz ${TL(o.kalan)} (${acik.map((s) => s.no).join(', ')}).\nTeşekkür ederiz.\n${ayar().firma} · ${ayar().tel}` : `Merhaba ${o.ad},\n`);
  m.innerHTML = head(esc(o.ad), `${esc(o.tel || 'Telefon yok')}${o.adres ? ' · ' + esc(o.adres) : ''}`, `<a class="btn-ghost" href="#musteriler">← Müşteriler</a>${wa ? `<a class="btn-ghost wa" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp${acik.length ? ': bakiye hatırlat' : ''}</a>` : ''}<button class="btn" id="mnew" type="button">Bu müşteriye yeni satış</button>`)
    + `<div class="kpis">${kpi('Toplam alışveriş (KDV dahil)', o.toplam)}${kpi('Ödenen', r2(o.toplam - o.kalan))}${kpi('Borç', o.kalan, o.kalan > 0.009 ? 'neg' : '')}<div class="kpi"><span>Satış sayısı</span><b>${o.satislar.length}</b></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Tarih</th><th>No</th><th>Durum</th><th>Ürünler</th><th class="n">Toplam</th><th class="n">Ödenen</th><th class="n">Kalan</th></tr></thead><tbody>${rows}</tbody></table></div>
    <h2>Ödemeler</h2><div class="tbl-wrap"><table><thead><tr><th>Tarih</th><th>Sipariş</th><th>Hesap</th><th>Not</th><th class="n">Tutar</th></tr></thead><tbody>${tahs.map((t) => `<tr><td>${fmtDate(t.tarih)}</td><td>${esc(t.no)}</td><td>${esc(t.hesap || H0())}</td><td>${esc(t.not)}</td><td class="n">${TL(t.tutar)}</td></tr>`).join('') || empty(5, 'Ödeme yok.')}</tbody></table></div>`;
  $('#mnew').onclick = () => editSatis(newSatis({ musteri: o.ad, tel: o.tel, adres: o.adres }));
};

/* ---------------- ALIŞLAR, TEDARİKÇİLER ve GİDERLER ---------------- */
VIEWS.alislar = (m) => {
  const list = [...S.alislar].sort((a, b) => String(b.tarih).localeCompare(a.tarih));
  let tm = 0, tk = 0, tt = 0, tkl = 0;
  const rows = list.map((d) => { const c = calcAlis(d); tm += c.matrah; tk += c.kdv; tt += c.toplam; tkl += Math.max(0, c.kalan);
    return `<tr><td>${fmtDate(d.tarih)}</td><td>${esc(d.tedarikci)}</td><td>${esc(d.faturaNo)}</td><td>${esc(d.aciklama)}${(d.stok || []).length ? ' <span class="pill ok">stok</span>' : ''}</td><td class="n">${TL(c.matrah)}</td><td class="n">${TL(c.kdv)}</td><td class="n">${TL(c.toplam)}</td><td class="n">${c.kalan > 0.009 ? `<span class="pill ${d.vade && d.vade <= today() ? 'bad' : 'warn'}">${TL(c.kalan)}</span>` : '<span class="pill ok">Ödendi</span>'}</td><td><button class="btn-sm" data-e="${d.id}">Aç</button></td></tr>`; }).join('');
  m.innerHTML = head('Alışlar', 'Tedarikçi faturaları: kumaş, ray, aksesuar alımları. PDF kontrol ekranından faturayı okutup buraya aktarabilirsiniz.', '<button class="btn" id="new">Yeni alış</button>')
    + `<div class="tbl-wrap"><table><thead><tr><th>Tarih</th><th>Tedarikçi</th><th>Fatura no</th><th>Açıklama</th><th class="n">Matrah</th><th class="n">KDV</th><th class="n">Toplam</th><th class="n">Ödeme</th><th></th></tr></thead><tbody>${rows || empty(9, 'Henüz kayıt yok.')}</tbody>${rows ? `<tfoot><tr><td colspan="4">Toplam</td><td class="n">${TL(tm)}</td><td class="n">${TL(tk)}</td><td class="n">${TL(tt)}</td><td class="n">${TL(tkl)}</td><td></td></tr></tfoot>` : ''}</table></div>`;
  $('#new').onclick = () => editAlis({ tarih: today(), kdvOran: ayar().kdv });
  $$('[data-e]', m).forEach((b) => (b.onclick = () => editAlis(structuredClone(S.alislar.find((d) => d.id === b.dataset.e)))));
};
function editAlis(d) {
  const yeni = !d.id && !Array.isArray(d.odemeler);
  const stokKs = S.kalemler.filter((k) => k.stok).sort((a, b) => String(a.ad).localeCompare(b.ad, 'tr'));
  const sRow = (x) => `<tr><td data-l="Kalem"><select data-sk aria-label="Kalem"><option value="">Seç…</option>${stokKs.map((k) => `<option value="${k.id}"${k.id === x.kalemId ? ' selected' : ''}>${esc(k.ad)} (${esc(k.birim)})</option>`).join('')}</select></td><td data-l="Miktar"><input data-sm value="${N2(x.miktar || 0)}" inputmode="decimal" aria-label="Miktar"></td><td><button type="button" class="btn-sm danger" data-sx aria-label="Sil">×</button></td></tr>`;
  const oRow = (o) => `<tr><td data-l="Tarih"><input type="date" data-of="tarih" value="${esc(o.tarih)}" aria-label="Tarih"></td><td data-l="Tutar"><input data-of="tutar" value="${N2(o.tutar)}" inputmode="decimal" aria-label="Tutar"></td><td data-l="Hesap"><select data-of="hesap" aria-label="Hesap">${hesapOpts(o.hesap)}</select></td><td><button type="button" class="btn-sm danger" data-ox aria-label="Sil">×</button></td></tr>`;
  openDlg(`<h2>Alış ${d.id ? 'düzenle' : 'ekle'}</h2><div class="grid2">${field('tarih', 'Fatura tarihi', d.tarih, 'date', 'required')}
    ${field('tedarikci', 'Tedarikçi', d.tedarikci, 'text', 'required list="tlist" autocomplete="off"')}${field('faturaNo', 'Fatura no', d.faturaNo)}
    ${field('aciklama', 'Açıklama', d.aciklama)}${field('matrah', 'Tutar (KDV hariç)', N2(d.matrah || 0), 'text', 'inputmode="decimal" required')}${field('kdvOran', 'KDV %', N2(d.kdvOran ?? ayar().kdv), 'text', 'inputmode="decimal"')}
    ${field('vade', 'Vade (son ödeme tarihi)', d.vade, 'date')}</div>
    <datalist id="tlist">${[...new Set(S.alislar.map((a) => a.tedarikci).filter(Boolean))].map((t) => `<option value="${esc(t)}">`).join('')}</datalist>
    <p class="sum card" id="ks"></p>${d.kaynak ? `<p class="note">Kaynak: ${esc(d.kaynak)}</p>` : ''}
    <h3>Ödemeler</h3>${yeni ? `<label class="chk"><input type="checkbox" id="pesin" checked> Peşin ödendi</label><div id="pesinH">${sel('pesinHesap', 'Ödenen hesap', ayar().hesaplar.map((h) => [h, h]), H0())}</div>` : ''}
    <div class="tbl-wrap lines tahs" id="odw" ${yeni ? 'hidden' : ''}><table><thead><tr><th>Tarih</th><th>Tutar</th><th>Hesap</th><th></th></tr></thead><tbody id="ods">${(d.odemeler || (d.id ? alisOdemeler(d) : [])).map(oRow).join('')}</tbody></table></div>
    <div class="row" id="addow" ${yeni ? 'hidden' : ''}><button type="button" class="btn-sm" id="addo">+ Ödeme ekle</button></div>
    <h3>Stoğa giren kalemler</h3>${stokKs.length ? `<div class="tbl-wrap lines tahs"><table><thead><tr><th>Kalem</th><th>Miktar</th><th></th></tr></thead><tbody id="sks">${(d.stok || []).map(sRow).join('')}</tbody></table></div><div class="row"><button type="button" class="btn-sm" id="adds">+ Stok satırı</button></div>` : '<p class="note">Stok takibi açık kalem yok (Kalemler ekranından açılır).</p>'}`,
  (f) => {
    const c = calcKdvli({ matrah: val(f, 'matrah'), kdvOran: val(f, 'kdvOran') });
    const odemeler = yeni && $('#pesin').checked ? [{ tarih: val(f, 'tarih'), tutar: c.toplam, hesap: $('#pesinHesap').value }]
      : $$('#ods tr').map((tr) => ({ tarih: $('[data-of="tarih"]', tr).value, tutar: num($('[data-of="tutar"]', tr).value), hesap: $('[data-of="hesap"]', tr).value })).filter((o) => o.tutar);
    const stok = $$('#sks tr').map((tr) => ({ kalemId: $('[data-sk]', tr).value, miktar: num($('[data-sm]', tr).value) })).filter((x) => x.kalemId && x.miktar);
    return save('alislar', { ...d, tarih: val(f, 'tarih'), tedarikci: val(f, 'tedarikci'), faturaNo: val(f, 'faturaNo'), aciklama: val(f, 'aciklama'), matrah: num(val(f, 'matrah')), kdvOran: num(val(f, 'kdvOran')), vade: val(f, 'vade'), odemeler, stok });
  },
  d.id ? () => remove('alislar', d.id) : null);
  const upd = () => {
    const c = calcKdvli({ matrah: $('#matrah').value, kdvOran: $('#kdvOran').value });
    const od = yeni && $('#pesin').checked ? c.toplam : $$('#ods [data-of="tutar"]').reduce((a, i) => a + num(i.value), 0);
    $('#ks').innerHTML = `<span>KDV</span><b>${TL(c.kdv)}</b><span>Toplam</span><b>${TL(c.toplam)}</b><span>Ödenen</span><b>${TL(od)}</b><span>Kalan borç</span><b>${TL(c.toplam - od)}</b>`;
  };
  $('#dlg-form').oninput = upd;
  if (yeni) $('#pesin').onchange = (e) => { $('#pesinH').hidden = !e.target.checked; $('#odw').hidden = e.target.checked; $('#addow').hidden = e.target.checked; upd(); };
  $('#addo').onclick = () => { const c = calcKdvli({ matrah: $('#matrah').value, kdvOran: $('#kdvOran').value }); const od = $$('#ods [data-of="tutar"]').reduce((a, i) => a + num(i.value), 0); $('#ods').insertAdjacentHTML('beforeend', oRow({ tarih: today(), tutar: Math.max(0, r2(c.toplam - od)) })); upd(); };
  $('#ods').onclick = (e) => { if (e.target.matches('[data-ox]')) { e.target.closest('tr').remove(); upd(); } };
  if ($('#adds')) { $('#adds').onclick = () => $('#sks').insertAdjacentHTML('beforeend', sRow({})); $('#sks').onclick = (e) => { if (e.target.matches('[data-sx]')) e.target.closest('tr').remove(); }; }
  upd();
}
VIEWS.tedarikciler = (m) => {
  const g = new Map();
  for (const a of S.alislar) { const k = a.tedarikci || '—'; const o = g.get(k) || { ad: k, list: [], toplam: 0, odenen: 0, kalan: 0, vadesi: 0 }; const c = calcAlis(a); o.list.push(a); o.toplam += c.toplam; o.odenen += c.odenen; o.kalan += c.kalan; if (a.vade && a.vade <= today() && c.kalan > 0.009) o.vadesi += c.kalan; g.set(k, o); }
  const list = [...g.values()].sort((a, b) => b.kalan - a.kalan);
  const rows = list.map((o, i) => `<tr><td><button class="link" data-tg="${i}">${esc(o.ad)}</button></td><td class="n">${o.list.length}</td><td class="n">${TL(o.toplam)}</td><td class="n">${TL(o.odenen)}</td><td class="n">${o.kalan > 0.009 ? `<b>${TL(o.kalan)}</b>` : TL(0)}</td><td class="n">${o.vadesi ? `<span class="pill bad">${TL(o.vadesi)}</span>` : ''}</td></tr>
    <tr class="sub" data-tsub="${i}" hidden><td colspan="6"><table><tbody>${o.list.sort((a, b) => String(b.tarih).localeCompare(a.tarih)).map((a) => { const c = calcAlis(a); return `<tr><td>${fmtDate(a.tarih)}</td><td>${esc(a.faturaNo)}</td><td>${a.vade ? 'Vade ' + fmtDate(a.vade) : ''}</td><td class="n">${TL(c.toplam)}</td><td class="n">${c.kalan > 0.009 ? 'Kalan ' + TL(c.kalan) : 'Ödendi'}</td><td><button class="btn-sm" data-ae="${a.id}">${c.kalan > 0.009 ? 'Ödeme ekle' : 'Aç'}</button></td></tr>`; }).join('')}</tbody></table></td></tr>`).join('');
  const tot = list.reduce((a, o) => a + o.kalan, 0);
  m.innerHTML = head('Tedarikçiler', 'Alış faturalarından otomatik oluşur. Bir tedarikçiye tıklayınca faturaları açılır; ödeme yaptıkça faturaya ödeme ekleyin.')
    + `<div class="kpis">${kpi('Toplam tedarikçi borcu', tot, tot > 0.009 ? 'neg' : '')}${kpi('Vadesi gelmiş', list.reduce((a, o) => a + o.vadesi, 0))}</div>
    <div class="tbl-wrap"><table><thead><tr><th>Tedarikçi</th><th class="n">Fatura</th><th class="n">Toplam alış</th><th class="n">Ödenen</th><th class="n">Kalan borç</th><th class="n">Vadesi geçmiş</th></tr></thead><tbody>${rows || empty(6, 'Henüz alış yok.')}</tbody></table></div>`;
  $$('[data-tg]', m).forEach((b) => (b.onclick = () => { const r = $(`[data-tsub="${b.dataset.tg}"]`, m); r.hidden = !r.hidden; }));
  $$('[data-ae]', m).forEach((b) => (b.onclick = () => { const a = structuredClone(S.alislar.find((x) => x.id === b.dataset.ae)); a.odemeler = alisOdemeler(a); editAlis(a); setTimeout(() => { if (calcAlis(a).kalan > 0.009) $('#addo').click(); }, 0); }));
};
VIEWS.giderler = (m) => {
  const list = [...S.giderler].sort((a, b) => String(b.tarih).localeCompare(a.tarih));
  let tm = 0, tk = 0, tt = 0;
  const rows = list.map((d) => { const c = calcKdvli(d); tm += c.matrah; tk += c.kdv; tt += c.toplam;
    return `<tr><td>${fmtDate(d.tarih)}</td><td>${esc(d.kategori)}</td><td>${esc(d.aciklama)}</td><td>${esc(d.hesap || H0())}</td><td class="n">${TL(c.matrah)}</td><td class="n">${TL(c.kdv)}</td><td class="n">${TL(c.toplam)}</td><td><button class="btn-sm" data-e="${d.id}">Düzenle</button></td></tr>`; }).join('');
  m.innerHTML = head('Giderler', 'Kira, maaş ve işçilik, faturalar, yakıt, reklam gibi işletme giderleri.', '<button class="btn" id="new">Yeni gider</button>')
    + `<div class="tbl-wrap"><table><thead><tr><th>Tarih</th><th>Kategori</th><th>Açıklama</th><th>Hesap</th><th class="n">Matrah</th><th class="n">KDV</th><th class="n">Toplam</th><th></th></tr></thead><tbody>${rows || empty(8, 'Henüz kayıt yok.')}</tbody>${rows ? `<tfoot><tr><td colspan="4">Toplam</td><td class="n">${TL(tm)}</td><td class="n">${TL(tk)}</td><td class="n">${TL(tt)}</td><td></td></tr></tfoot>` : ''}</table></div>`;
  $('#new').onclick = () => editGider({ tarih: today(), kdvOran: ayar().kdv });
  $$('[data-e]', m).forEach((b) => (b.onclick = () => editGider(S.giderler.find((d) => d.id === b.dataset.e))));
};
function editGider(d) {
  openDlg(`<h2>Gider ${d.id ? 'düzenle' : 'ekle'}</h2><div class="grid2">${field('tarih', 'Tarih', d.tarih, 'date', 'required')}
    ${sel('kategori', 'Kategori', ayar().kategoriler.map((k) => [k, k]), d.kategori)}${field('aciklama', 'Açıklama', d.aciklama)}
    ${field('matrah', 'Tutar (KDV hariç)', N2(d.matrah || 0), 'text', 'inputmode="decimal" required')}${field('kdvOran', 'KDV % (KDV\'siz giderlerde 0)', N2(d.kdvOran ?? ayar().kdv), 'text', 'inputmode="decimal"')}
    ${sel('hesap', 'Ödendiği hesap', ayar().hesaplar.map((h) => [h, h]), d.hesap || H0())}</div><p class="sum card" id="ks"></p>`,
  (f) => save('giderler', { ...d, tarih: val(f, 'tarih'), kategori: val(f, 'kategori'), aciklama: val(f, 'aciklama'), matrah: num(val(f, 'matrah')), kdvOran: num(val(f, 'kdvOran')), hesap: val(f, 'hesap') }),
  d.id ? () => remove('giderler', d.id) : null);
  const upd = () => { const c = calcKdvli({ matrah: $('#matrah').value, kdvOran: $('#kdvOran').value }); $('#ks').innerHTML = `<span>KDV</span><b>${TL(c.kdv)}</b><span>Toplam</span><b>${TL(c.toplam)}</b>`; };
  $('#dlg-form').oninput = upd; upd();
}

/* ---------------- KASA VE BANKA ---------------- */
let kasaHesap = '', kasaYM = '';
VIEWS.kasa = (m) => {
  const a = ayar(), hs = hareketler();
  const bakiye = (h) => r2(num(a.acilis[h]) + hs.filter((x) => x.hesap === h).reduce((s, x) => s + x.tutar, 0));
  if (!a.hesaplar.includes(kasaHesap)) kasaHesap = a.hesaplar[0];
  if (!kasaYM) kasaYM = ymOf(today());
  let run = num(a.acilis[kasaHesap]);
  const rows = hs.filter((x) => x.hesap === kasaHesap).map((x) => ({ ...x, bak: (run = r2(run + x.tutar)) })).filter((x) => ymOf(x.tarih) === kasaYM).reverse()
    .map((x) => `<tr><td>${fmtDate(x.tarih)}</td><td>${x.satis ? `<button class="link" data-os="${x.satis}">${esc(x.acik)}</button>` : esc(x.acik)}</td><td class="n" style="color:${x.tutar >= 0 ? 'var(--ok)' : 'var(--bad)'}">${x.tutar >= 0 ? '+' : ''}${TL(x.tutar)}</td><td class="n">${TL(x.bak)}</td><td>${x.virman ? `<button class="btn-sm danger" data-vdel="${x.virman}">Sil</button>` : ''}</td></tr>`).join('');
  const ms = [...new Set([ymOf(today()), ...hs.map((x) => ymOf(x.tarih))])].filter(Boolean).sort().reverse();
  m.innerHTML = head('Kasa ve banka', 'Tahsilatlar, tedarikçi ödemeleri ve giderler seçtiğiniz hesaba işlenir. Kasadan bankaya para yatırma ya da POS\'tan hesaba geçen tutar için "Transfer" kullanın.', '<button class="btn" id="vir" type="button">Transfer</button>')
    + `<div class="kpis">${a.hesaplar.map((h) => `<button type="button" class="kpi pick${h === kasaHesap ? ' on' : ''}" data-h="${esc(h)}"><span>${esc(h)}</span><b>${TL(bakiye(h))}</b></button>`).join('')}<div class="kpi"><span>Toplam</span><b>${TL(a.hesaplar.reduce((s, h) => s + bakiye(h), 0))}</b></div></div>
    <div class="head"><h2>${esc(kasaHesap)} · hareketler</h2><select id="kym" aria-label="Ay">${ms.map((y) => `<option value="${y}"${y === kasaYM ? ' selected' : ''}>${ymLabel(y)}</option>`).join('')}</select></div>
    <div class="tbl-wrap"><table><thead><tr><th>Tarih</th><th>Açıklama</th><th class="n">Tutar</th><th class="n">Bakiye</th><th></th></tr></thead><tbody>${rows || empty(5, 'Bu ay hareket yok.')}</tbody></table></div>
    <p class="note">Başlangıç bakiyeleri ve hesap adları Ayarlar ekranından değiştirilir. Bakiye, girilen kayıtlardan hesaplanır; bankadaki gerçek bakiyeyle ara ara karşılaştırın.</p>`;
  $$('[data-h]', m).forEach((b) => (b.onclick = () => { kasaHesap = b.dataset.h; route(); }));
  $('#kym').onchange = (e) => { kasaYM = e.target.value; route(); };
  $$('[data-vdel]', m).forEach((b) => armBtn(b, 'Emin misiniz?', async () => { if (await remove('virmanlar', b.dataset.vdel)) route(); }));
  $('#vir').onclick = () => openDlg(`<h2>Hesaplar arası transfer</h2><div class="grid2">${field('tarih', 'Tarih', today(), 'date', 'required')}${sel('kaynak', 'Çıkan hesap', a.hesaplar.map((h) => [h, h]), a.hesaplar[0])}${sel('hedef', 'Giren hesap', a.hesaplar.map((h) => [h, h]), a.hesaplar[a.hesaplar.length - 1])}${field('tutar', 'Tutar', '', 'text', 'inputmode="decimal" required')}${field('aciklama', 'Açıklama', '', 'text', 'placeholder="Bankaya yatırıldı"')}</div>`,
    (f) => { if (val(f, 'kaynak') === val(f, 'hedef')) { toast('Hesaplar aynı olamaz', true); return false; } return save('virmanlar', { tarih: val(f, 'tarih'), kaynak: val(f, 'kaynak'), hedef: val(f, 'hedef'), tutar: num(val(f, 'tutar')), aciklama: val(f, 'aciklama') }); });
};

/* ---------------- YILLIK RAPOR ---------------- */
let curY = today().slice(0, 4);
VIEWS.rapor = (m) => {
  const y = +curY, rows = [], ys = [...new Set(months().map((x) => x.slice(0, 4)))].sort().reverse();
  for (let i = 1; i <= 12; i++) { const ym = `${y}-${String(i).padStart(2, '0')}`, R = calcAy(ym), P = calcAy(`${y - 1}-${String(i).padStart(2, '0')}`); rows.push({ ym, R, P }); }
  const T = calcDonem((d) => String(d).startsWith(String(y))), TP = calcDonem((d) => String(d).startsWith(String(y - 1)));
  const pct = (a, b) => (b ? `${a >= b ? '+' : ''}${N2(((a - b) / Math.abs(b)) * 100)}%` : '—');
  const max = Math.max(1, ...rows.flatMap((r) => [r.R.ciro, r.P.ciro]));
  const bw = 22, gap = 60, H = 180;
  const bars = rows.map((r, i) => { const x = 40 + i * gap, h1 = (r.P.ciro / max) * H, h2 = (r.R.ciro / max) * H;
    return `<rect x="${x}" y="${200 - h1}" width="${bw}" height="${h1}" class="b-prev"><title>${AYLAR[i]} ${y - 1}: ${TL(r.P.ciro)}</title></rect><rect x="${x + bw}" y="${200 - h2}" width="${bw}" height="${h2}" class="b-cur"><title>${AYLAR[i]} ${y}: ${TL(r.R.ciro)}</title></rect><text x="${x + bw}" y="218" text-anchor="middle">${AYLAR[i].slice(0, 3)}</text>`; }).join('');
  const chart = `<svg viewBox="0 0 760 228" class="chart" role="img" aria-label="${y} ve ${y - 1} aylık satış"><line x1="36" y1="200" x2="756" y2="200" class="axis"/>${bars}</svg><div class="legend"><span class="sw b-prev"></span>${y - 1} <span class="sw b-cur"></span>${y} · satış (KDV hariç)</div>`;
  const tr = rows.map((r) => `<tr><td>${AYLAR[+r.ym.slice(5) - 1]}</td><td class="n">${TL(r.R.ciro)}</td><td class="n">${TL(r.P.ciro)}</td><td class="n">${pct(r.R.ciro, r.P.ciro)}</td><td class="n">${TL(r.R.brutKar)}</td><td class="n">${TL(r.R.giderMatrah)}</td><td class="n" style="color:${r.R.netKar >= 0 ? 'var(--ok)' : 'var(--bad)'}">${TL(r.R.netKar)}</td><td class="n">${TL(r.R.tahsilAy)}</td></tr>`).join('');
  m.innerHTML = head('Yıllık rapor', 'Aylar yan yana; satış bir önceki yılın aynı ayıyla karşılaştırılır.', `<select id="yy" aria-label="Yıl">${(ys.includes(curY) ? ys : [curY, ...ys]).map((x) => `<option${x === curY ? ' selected' : ''}>${x}</option>`).join('')}</select><button class="btn-ghost" id="ypr" type="button">Yazdır</button><button class="btn-ghost" id="yxl" type="button">Muhasebeci için Excel (yıl)</button>`)
    + `<div class="kpis">${kpi(`${y} satış`, T.ciro)}${kpi(`${y - 1} satış`, TP.ciro)}${kpi('Brüt kâr', T.brutKar, T.brutKar >= 0 ? 'pos' : 'neg')}${kpi('Giderler', T.giderMatrah)}${kpi('Net kâr', T.netKar, T.netKar >= 0 ? 'pos' : 'neg')}${kpi('Tahsilat', T.tahsilAy)}</div>
    <div class="card">${chart}</div>
    <div class="tbl-wrap"><table><thead><tr><th>Ay</th><th class="n">Satış ${y}</th><th class="n">Satış ${y - 1}</th><th class="n">Değişim</th><th class="n">Brüt kâr</th><th class="n">Giderler</th><th class="n">Net kâr</th><th class="n">Tahsilat</th></tr></thead><tbody>${tr}</tbody>
    <tfoot><tr><td>Toplam</td><td class="n">${TL(T.ciro)}</td><td class="n">${TL(TP.ciro)}</td><td class="n">${pct(T.ciro, TP.ciro)}</td><td class="n">${TL(T.brutKar)}</td><td class="n">${TL(T.giderMatrah)}</td><td class="n">${TL(T.netKar)}</td><td class="n">${TL(T.tahsilAy)}</td></tr></tfoot></table></div>`;
  $('#yy').onchange = (e) => { curY = e.target.value; route(); };
  $('#yxl').onclick = () => exportXlsx(String(y));
  $('#ypr').onclick = () => doPrint(`<div class="doc">${docHead('Yıllık Rapor', String(y))}<div class="chart-print">${chart}</div><table><thead><tr><th>Ay</th><th class="n">Satış ${y}</th><th class="n">Satış ${y - 1}</th><th class="n">Değişim</th><th class="n">Brüt kâr</th><th class="n">Giderler</th><th class="n">Net kâr</th><th class="n">Tahsilat</th></tr></thead><tbody>${tr}</tbody><tfoot><tr><td><b>Toplam</b></td><td class="n">${TL(T.ciro)}</td><td class="n">${TL(TP.ciro)}</td><td class="n">${pct(T.ciro, TP.ciro)}</td><td class="n">${TL(T.brutKar)}</td><td class="n">${TL(T.giderMatrah)}</td><td class="n">${TL(T.netKar)}</td><td class="n">${TL(T.tahsilAy)}</td></tr></tfoot></table><p style="font-size:9pt;color:#6a5d53">Ön muhasebe raporudur; resmî kayıt ve beyanname yerine geçmez.</p>${docFoot()}</div>`, 'A4 landscape');
};

/* ---------------- EXCEL (.xlsx, kütüphanesiz) ---------------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export function zipStore(files) {   // sıkıştırmasız ZIP
  const enc = new TextEncoder(), parts = [], cd = []; let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(12, 0x21, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(14, 0x21, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    cd.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + data.length;
  }
  const cdSize = cd.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cd, new Uint8Array(e.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
const xesc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const colL = (i) => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
export function makeXlsx(sheets) {   // sheets: [{name, cols:[{h, t:'s'|'n'|'d', w}], rows:[[...]]}]
  const sheetXml = (sh) => {
    const cell = (v, t, r, c, st) => { const ref = colL(c) + r; if (v === '' || v == null) return ''; if (t === 'n') return `<c r="${ref}" s="3"><v>${r2(num(v))}</v></c>`; if (t === 'd' && /^\d{4}-\d{2}-\d{2}/.test(v)) return `<c r="${ref}" s="2"><v>${(Date.parse(v.slice(0, 10) + 'T00:00:00Z') - Date.UTC(1899, 11, 30)) / 864e5}</v></c>`; return `<c r="${ref}" t="inlineStr"${st ? ` s="${st}"` : ''}><is><t xml:space="preserve">${xesc(v)}</t></is></c>`; };
    const hdr = `<row r="1">${sh.cols.map((c, i) => cell(c.h, 's', 1, i, 1)).join('')}</row>`;
    const body = sh.rows.map((row, ri) => `<row r="${ri + 2}">${row.map((v, ci) => cell(v, sh.cols[ci].t, ri + 2, ci)).join('')}</row>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${sh.cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.w || 14}" customWidth="1"/>`).join('')}</cols><sheetData>${hdr}${body}</sheetData></worksheet>`;
  };
  const files = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xesc(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd.mm.yyyy"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s) })),
  ];
  return zipStore(files);
}
function exportXlsx(period) {   // period: '2026-11' ya da '2026'
  const match = (d) => String(d || '').startsWith(period);
  const R = calcDonem(match), label = period.length === 4 ? period : ymLabel(period);
  const sat = S.satislar.filter((s) => s.durum !== 'teklif' && match(s.tarih)).sort((a, b) => String(a.tarih).localeCompare(b.tarih));
  const sheets = [
    { name: 'Özet', cols: [{ h: `Dönem: ${label}`, t: 's', w: 36 }, { h: 'Tutar (TL)', t: 'n', w: 18 }], rows: [
      ['Satış (KDV hariç)', R.ciro], ['Satış KDV', R.satisKdv], ['Satış (KDV dahil)', R.satisToplam], ['Satılan malzeme maliyeti', R.mUrun], ['İşçilik / hizmet maliyeti', R.mIsc], ['Brüt kâr', R.brutKar],
      ['Alışlar (KDV hariç)', R.alisMatrah], ['Alış KDV', R.alisKdv], ['Giderler (KDV hariç)', R.giderMatrah], ['Gider KDV', R.giderKdv], ['Net kâr', R.netKar],
      ['Tahsilat', R.tahsilAy], ['Tedarikçilere ödenen', R.alisOdenen], ['Tahmini ödenecek KDV', R.kdvFark], ['Açık alacak (bugün itibarıyla)', R.alacak], ['Tedarikçi borcu (bugün itibarıyla)', R.borc]] },
    { name: 'Satışlar', cols: [{ h: 'Tarih', t: 'd', w: 12 }, { h: 'No', t: 's' }, { h: 'Müşteri', t: 's', w: 26 }, { h: 'Telefon', t: 's' }, { h: 'Durum', t: 's' }, { h: 'Matrah', t: 'n' }, { h: 'KDV', t: 'n' }, { h: 'Toplam', t: 'n' }, { h: 'Tahsil edilen', t: 'n' }, { h: 'Kalan', t: 'n' }],
      rows: sat.map((s) => { const c = calcSatis(s); return [s.tarih, s.no, s.musteri, s.tel, DURUM[s.durum], c.matrah, c.kdv, c.toplam, c.tahsil, c.kalan]; }) },
    { name: 'Satış kalemleri', cols: [{ h: 'Tarih', t: 'd', w: 12 }, { h: 'No', t: 's' }, { h: 'Müşteri', t: 's', w: 24 }, { h: 'Kalem', t: 's', w: 28 }, { h: 'Tür', t: 's' }, { h: 'Miktar', t: 'n' }, { h: 'Birim', t: 's', w: 8 }, { h: 'Birim fiyat', t: 'n' }, { h: 'KDV %', t: 'n', w: 8 }, { h: 'Tutar (KDV hariç)', t: 'n' }],
      rows: sat.flatMap((s) => (s.satirlar || []).map((l) => [s.tarih, s.no, s.musteri, l.ad, TUR[l.tur || 'urun'], l.miktar, l.birim, l.fiyat, l.kdv, r2(num(l.miktar) * num(l.fiyat))])) },
    { name: 'Tahsilatlar', cols: [{ h: 'Tarih', t: 'd', w: 12 }, { h: 'Sipariş no', t: 's' }, { h: 'Müşteri', t: 's', w: 26 }, { h: 'Hesap', t: 's', w: 18 }, { h: 'Not', t: 's', w: 20 }, { h: 'Tutar', t: 'n' }],
      rows: S.satislar.flatMap((s) => (s.tahsilat || []).filter((t) => match(t.tarih)).map((t) => [t.tarih, s.no, s.musteri, t.hesap || H0(), t.not, t.tutar])).sort((a, b) => String(a[0]).localeCompare(b[0])) },
    { name: 'Alışlar', cols: [{ h: 'Tarih', t: 'd', w: 12 }, { h: 'Tedarikçi', t: 's', w: 28 }, { h: 'Fatura no', t: 's', w: 18 }, { h: 'Açıklama', t: 's', w: 22 }, { h: 'Matrah', t: 'n' }, { h: 'KDV %', t: 'n', w: 8 }, { h: 'KDV', t: 'n' }, { h: 'Toplam', t: 'n' }, { h: 'Ödenen', t: 'n' }, { h: 'Kalan', t: 'n' }, { h: 'Vade', t: 'd', w: 12 }],
      rows: S.alislar.filter((a) => match(a.tarih)).sort((a, b) => String(a.tarih).localeCompare(b.tarih)).map((a) => { const c = calcAlis(a); return [a.tarih, a.tedarikci, a.faturaNo, a.aciklama, c.matrah, a.kdvOran, c.kdv, c.toplam, c.odenen, c.kalan, a.vade]; }) },
    { name: 'Giderler', cols: [{ h: 'Tarih', t: 'd', w: 12 }, { h: 'Kategori', t: 's', w: 22 }, { h: 'Açıklama', t: 's', w: 26 }, { h: 'Hesap', t: 's', w: 16 }, { h: 'Matrah', t: 'n' }, { h: 'KDV %', t: 'n', w: 8 }, { h: 'KDV', t: 'n' }, { h: 'Toplam', t: 'n' }],
      rows: S.giderler.filter((g) => match(g.tarih)).sort((a, b) => String(a.tarih).localeCompare(b.tarih)).map((g) => { const c = calcKdvli(g); return [g.tarih, g.kategori, g.aciklama, g.hesap || H0(), c.matrah, g.kdvOran, c.kdv, c.toplam]; }) },
  ];
  download(makeXlsx(sheets), `beyperde-muhasebe-${period}.xlsx`);
}
function download(blob, name) { const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); }
function downloadBackup() {
  download(new Blob([JSON.stringify({ surum: 2, tarih: new Date().toISOString(), data: S }, null, 1)], { type: 'application/json' }), `beyperde-yedek-${today()}.json`);
  lsSet('bp-son-yedek', today());
}

/* ---------------- YAZDIRMA ---------------- */
function doPrint(html, page) {
  const pa = $('#print-area'); pa.innerHTML = html;
  let st = $('#print-page'); if (!st) { st = document.createElement('style'); st.id = 'print-page'; document.head.appendChild(st); }
  st.textContent = `@page{size:${page};margin:${page.includes('mm') && !page.startsWith('A4') ? '0' : '12mm'}}`;
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  setTimeout(() => window.print(), 80);
}
const docHead = (title, sub) => { const a = ayar(); return `<div class="dh"><div style="display:flex;gap:12px;align-items:center"><img src="/brand/logo-brown-192.webp" alt=""><div><b style="font-size:14pt">${esc(a.firma)}</b><br><span style="font-size:9pt">Perde · Duvar Kağıdı · Döşemelik Kumaş</span></div></div><div style="text-align:right"><h1>${title}</h1><div>${sub}</div></div></div>`; };
const docFoot = () => { const a = ayar(); return `<div class="foot">${esc(a.firma)} · ${esc(a.adres)} · ${esc(a.tel)} · ${esc(a.web)}</div>`; };
function printSatis(s) {
  const c = calcSatis(s);
  const rows = (s.satirlar || []).map((l) => `<tr><td>${esc(l.ad)}</td><td>${esc(l.oda)}</td><td>${esc(l.olcu)}</td><td class="n">${N2(l.miktar)} ${esc(l.birim)}</td><td class="n">${TL(l.fiyat)}</td><td class="n">%${N2(l.kdv)}</td><td class="n">${TL(num(l.miktar) * num(l.fiyat))}</td></tr>`).join('');
  doPrint(`<div class="doc">${docHead(s.durum === 'teklif' ? 'Teklif' : 'Sipariş Özeti', `No: ${esc(s.no)} · ${fmtDate(s.tarih)}`)}
    <p><b>Müşteri:</b> ${esc(s.musteri)}${s.tel ? ' · ' + esc(s.tel) : ''}<br>${s.adres ? '<b>Adres:</b> ' + esc(s.adres) : ''}${s.montaj ? `<br><b>Montaj:</b> ${fmtDate(s.montaj)} ${esc(s.montajSaat || '')}` : ''}</p>
    <table><thead><tr><th>Ürün / hizmet</th><th>Oda</th><th>Ölçü</th><th class="n">Miktar</th><th class="n">Birim fiyat</th><th class="n">KDV</th><th class="n">Tutar</th></tr></thead><tbody>${rows}</tbody></table>
    <table style="width:auto;margin-left:auto"><tbody><tr><td>Ara toplam</td><td class="n">${TL(c.ara)}</td></tr>${c.isk ? `<tr><td>İskonto</td><td class="n">−${TL(c.isk)}</td></tr>` : ''}<tr><td>KDV</td><td class="n">${TL(c.kdv)}</td></tr><tr><td><b>Genel toplam</b></td><td class="n"><b>${TL(c.toplam)}</b></td></tr>${s.durum !== 'teklif' ? `<tr><td>Tahsil edilen</td><td class="n">${TL(c.tahsil)}</td></tr><tr><td><b>Kalan</b></td><td class="n"><b>${TL(c.kalan)}</b></td></tr>` : ''}</tbody></table>
    ${s.not ? `<p><b>Not:</b> ${esc(s.not)}</p>` : ''}${docFoot()}</div>`, 'A4');
}
function printAtolye(s) {
  const ls = (s.satirlar || []).filter((l) => (l.tur || 'urun') === 'urun');
  if (!ls.length) return toast('Atölye için ürün satırı yok', true);
  const box = (l, i) => { const p = String(l.olcu || '').split(/\s*[x×*]\s*/i); return `<div class="ab"><div class="ab-h"><b>${i + 1}. ${esc(l.oda || 'Oda')}</b><span>${N2(l.miktar)} ${esc(l.birim || '')}</span></div>
    <dl><dt>Ürün / kumaş</dt><dd>${esc(l.ad)}</dd><dt>En</dt><dd>${esc(p[0] || '')}</dd><dt>Boy</dt><dd>${esc(p[1] || '')}</dd><dt>Pile</dt><dd>${esc(l.pile)}</dd><dt>Ray / aksesuar / not</dt><dd>${esc(l.detay)}</dd></dl>
    <div class="ab-c">${['Kesim', 'Dikiş', 'Ütü', 'Paket'].map((x) => `<span>☐ ${x}</span>`).join('')}</div></div>`; };
  const pages = [];
  for (let i = 0; i < ls.length; i += 6) pages.push(ls.slice(i, i + 6));
  doPrint(pages.map((pg, pi) => `<div class="doc atolye">${docHead('Atölye İş Emri', `${esc(s.no)}${pages.length > 1 ? ` · Sayfa ${pi + 1}/${pages.length}` : ''}`)}
    <div class="ai"><span><b>Müşteri:</b> ${esc(s.musteri)}</span><span><b>Tel:</b> ${esc(s.tel)}</span><span><b>Sipariş tarihi:</b> ${fmtDate(s.tarih)}</span><span><b>Montaj:</b> ${s.montaj ? fmtDate(s.montaj) + ' ' + esc(s.montajSaat || '') : '—'}</span><span class="w"><b>Adres:</b> ${esc(s.adres)}</span>${s.montajNot ? `<span class="w"><b>Not:</b> ${esc(s.montajNot)}</span>` : ''}</div>
    <div class="ag">${pg.map((l, i) => box(l, pi * 6 + i)).join('')}</div></div>`).join(''), 'A4');
}
function printRapor(ym) {
  const R = calcAy(ym);
  const tr = (l, v, b) => `<tr><td>${b ? '<b>' + l + '</b>' : l}</td><td class="n">${b ? '<b>' + TL(v) + '</b>' : TL(v)}</td></tr>`;
  const kat = Object.entries(R.kat).map(([n, v]) => tr(esc(n), v)).join('');
  doPrint(`<div class="doc">${docHead('Aylık Rapor', ymLabel(ym))}
    <table><thead><tr><th>Kâr hesabı</th><th class="n">Tutar</th></tr></thead><tbody>${tr(`Satış (KDV hariç, ${R.adet} sipariş)`, R.ciro)}${tr('Satılan malzeme maliyeti', R.mUrun)}${tr('İşçilik / hizmet maliyeti', R.mIsc)}${tr('Brüt kâr', R.brutKar, 1)}${tr('Giderler (KDV hariç)', R.giderMatrah)}${tr('Net kâr', R.netKar, 1)}</tbody></table>
    <table><thead><tr><th>Nakit ve KDV</th><th class="n">Tutar</th></tr></thead><tbody>${tr('Tahsilat', R.tahsilAy)}${tr('Tedarikçilere ödenen', R.alisOdenen)}${tr('Giderler (KDV dahil)', R.giderToplam)}${tr('Nakit akışı', R.nakit, 1)}${tr('Satış KDV', R.satisKdv)}${tr('Alış KDV', R.alisKdv)}${tr('Gider KDV', R.giderKdv)}${tr('Tahmini ödenecek KDV', R.kdvFark, 1)}${tr('Açık alacak (toplam)', R.alacak)}${tr('Tedarikçi borcu (toplam)', R.borc)}</tbody></table>
    ${kat ? `<table><thead><tr><th>Gider kategorisi</th><th class="n">Tutar</th></tr></thead><tbody>${kat}</tbody></table>` : ''}
    <p style="font-size:9pt;color:#6a5d53">Ön muhasebe raporudur; resmî kayıt ve beyanname yerine geçmez.</p>${docFoot()}</div>`, 'A4');
}

/* ---------------- ETİKET ---------------- */
VIEWS.etiket = (m) => {
  const a = ayar();
  const sOpts = [...S.satislar].sort((x, y) => String(y.tarih).localeCompare(x.tarih)).map((s) => `<option value="${s.id}">${esc(s.no)} · ${esc(s.musteri)} · ${fmtDate(s.tarih)}</option>`).join('');
  m.innerHTML = head('Etiket yazdır', 'Askı etiketleri seçtiğiniz siparişten otomatik doldurulur. Etiket ölçüsünü yazıcınızın rulo ölçüsüne göre ayarlayın; yazdırırken yazıcı olarak etiket makinesini ve aynı kağıt ölçüsünü seçin.')
    + `<div class="card grid2">${field('ew', 'Etiket eni (mm)', a.etiketW, 'number', 'min="20" max="200"')}${field('eh', 'Etiket boyu (mm)', a.etiketH, 'number', 'min="20" max="300"')}<div><label>&nbsp;</label><button class="btn-ghost" id="esave" type="button">Ölçüyü kaydet</button></div></div>
    <div class="card" style="display:grid;gap:12px"><div><label for="es">Sipariş</label><select id="es"><option value="">Sipariş seçin…</option>${sOpts}</select></div><ul id="elines" class="checks"></ul><div class="row"><button class="btn" id="eprint" type="button" disabled>Seçili etiketleri yazdır</button></div></div>
    <div class="card" style="display:grid;gap:10px"><h3>Elle etiket</h3><div class="grid2">${field('m_mus', 'Müşteri')}${field('m_oda', 'Oda')}${field('m_urun', 'Ürün')}${field('m_olcu', 'Ölçü')}</div><div class="row"><button class="btn-ghost" id="mprint" type="button">Bu etiketi yazdır</button></div></div>`;
  const size = () => ({ w: Math.max(20, num($('#ew').value)), h: Math.max(20, num($('#eh').value)) });
  $('#esave').onclick = () => save('ayarlar', { ...a, id: 'genel', etiketW: size().w, etiketH: size().h });
  let cur = null;
  $('#es').onchange = (e) => {
    cur = S.satislar.find((s) => s.id === e.target.value);
    $('#elines').innerHTML = cur ? (cur.satirlar || []).map((l, i) => `<li><input type="checkbox" id="el${i}" data-i="${i}" ${(l.tur || 'urun') === 'urun' ? 'checked' : ''} style="width:auto"><label for="el${i}" style="display:inline;font-weight:500">${esc(l.oda || '—')} · ${esc(l.ad)} · ${esc(l.olcu)}</label></li>`).join('') : '';
    $('#eprint').disabled = !cur;
  };
  $('#eprint').onclick = () => {
    const ls = $$('#elines input:checked').map((i) => cur.satirlar[+i.dataset.i]);
    if (!ls.length) return toast('Etiket seçilmedi', true);
    printLabels(ls.map((l) => ({ musteri: cur.musteri, no: cur.no, tarih: cur.tarih, oda: l.oda, urun: l.ad, olcu: l.olcu })), size());
  };
  $('#mprint').onclick = () => printLabels([{ musteri: $('#m_mus').value, oda: $('#m_oda').value, urun: $('#m_urun').value, olcu: $('#m_olcu').value, tarih: today() }], size());
};
function printLabels(items, { w, h }) {
  const fs = Math.max(6, Math.min(11, w / 7));
  const html = items.map((it) => `<div class="lbl-page" style="width:${w}mm;height:${h}mm;font-size:${fs}pt"><div class="lt"><img src="/brand/logo-brown-96.webp" alt=""><b>Bey Perde</b></div>
    <dl><dt>Müşteri</dt><dd>${esc(it.musteri)}</dd><dt>Oda</dt><dd>${esc(it.oda)}</dd><dt>Ürün</dt><dd>${esc(it.urun)}</dd><dt>Ölçü</dt><dd>${esc(it.olcu)}</dd>${it.no ? `<dt>Sipariş</dt><dd>${esc(it.no)}</dd>` : ''}<dt>Tarih</dt><dd>${fmtDate(it.tarih)}</dd></dl>
    <div style="font-size:.8em">${esc(ayar().tel)} · ${esc(ayar().web)}</div></div>`).join('');
  doPrint(html, `${w}mm ${h}mm`);
}

/* ---------------- PDF KONTROL ---------------- */
let pdfjs = null;
async function loadPdf(file) {
  if (!pdfjs) { pdfjs = await import('/admin/vendor/pdf.min.mjs'); pdfjs.GlobalWorkerOptions.workerSrc = '/admin/vendor/pdf.worker.min.mjs'; }
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i), vp = p.getViewport({ scale: 1 }), tc = await p.getTextContent();
    // satırları y konumuna göre birleştir
    const rows = new Map();
    for (const it of tc.items) { const y = Math.round(it.transform[5]); const k = [...rows.keys()].find((yy) => Math.abs(yy - y) < 3) ?? y; rows.set(k, (rows.get(k) || []).concat([[it.transform[4], it.str]])); }
    const lines = [...rows.entries()].sort((a, b) => b[0] - a[0]).map(([, its]) => its.sort((a, b) => a[0] - b[0]).map((x) => x[1]).join(' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    pages.push({ w: vp.width * 25.4 / 72, h: vp.height * 25.4 / 72, rot: p.rotate, lines });
  }
  return pages;
}
const AMT = /-?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|-?\d+(?:[.,]\d{1,2})?/g;
const amountsIn = (s) => (s.match(AMT) || []).map(parseTR).filter(Number.isFinite);
// Birden fazla desen verilirse öncelik sırasıyla denenir; ilk eşleşen satırdaki son tutar alınır.
function findAmount(lines, ...res) {
  for (const re of res) for (const l of lines) { if (re.test(l)) { const a = amountsIn(l.replace(re, ' ').replace(/%\s*\d+([.,]\d+)?|\(\s*%?\d+\s*%?\s*\)/g, ' ')); if (a.length) return a[a.length - 1]; } }
  return null;
}
export function analyzeInvoice(lines) {
  const txt = lines.join('\n');
  const toplam = findAmount(lines, /ödenecek\s*tutar/i, /vergiler\s*dahil\s*toplam/i, /genel\s*toplam/i, /^(?!.*(mal\s*hizmet|ara\s*toplam|iskonto|k\.?d\.?v)).*toplam\s*tutar/i);
  const kdv = findAmount(lines, /hesaplanan\s*k\.?d\.?v/i, /^(?!.*(dahil|hariç)).*k\.?d\.?v/i);
  const matrah = findAmount(lines, /matrah/i, /mal\s*hizmet\s*toplam/i, /ara\s*toplam/i);
  const no = (txt.match(/fatura\s*no\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{5,})/i) || [])[1] || '';
  const d = txt.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
  const tarih = d ? `${d[3]}-${d[2]}-${d[1]}` : '';
  const vkn = (txt.match(/(?:vkn|vergi\s*(?:no|numarası)|tckn)\s*[:\-]?\s*(\d{10,11})/i) || [])[1] || '';
  const firma = lines.find((l) => /(ltd|a\.ş|aş\b|tic\.|san\.|limited|anonim)/i.test(l)) || '';
  const checks = [];
  checks.push(toplam != null ? ['ok', `Genel toplam bulundu: ${TL(toplam)}`] : ['bad', 'Genel toplam (Ödenecek tutar) bulunamadı']);
  checks.push(kdv != null ? ['ok', `KDV bulundu: ${TL(kdv)}`] : ['warn', 'KDV tutarı bulunamadı']);
  checks.push(matrah != null ? ['ok', `Matrah / ara toplam bulundu: ${TL(matrah)}`] : ['warn', 'Matrah bulunamadı']);
  if (toplam != null && kdv != null && matrah != null) checks.push(Math.abs(matrah + kdv - toplam) <= 0.05 ? ['ok', 'Matrah + KDV = genel toplam ✓'] : ['bad', `Matrah + KDV (${TL(matrah + kdv)}) genel toplamla (${TL(toplam)}) tutmuyor`]);
  if (kdv != null && matrah) checks.push(['ok', `KDV oranı yaklaşık %${N2((kdv / matrah) * 100)}`]);
  checks.push(no ? ['ok', `Fatura no: ${no}`] : ['warn', 'Fatura no bulunamadı']);
  checks.push(tarih ? ['ok', `Tarih: ${fmtDate(tarih)}`] : ['warn', 'Tarih bulunamadı']);
  if (vkn) checks.push(['ok', `VKN/TCKN: ${vkn}`]);
  const dup = no && S.alislar.find((a) => a.faturaNo === no);
  if (dup) checks.push(['bad', `Bu fatura no zaten kayıtlı (${fmtDate(dup.tarih)}, ${dup.tedarikci})`]);
  return { checks, rec: { tarih, faturaNo: no, tedarikci: firma.slice(0, 80), matrah: matrah ?? (toplam != null && kdv != null ? toplam - kdv : 0), kdvOran: kdv != null && matrah ? Math.round((kdv / matrah) * 100) : ayar().kdv, aciklama: '' } };
}
export function analyzeOrder(lines) {
  const checks = [];
  let rowsOk = 0, rowsBad = 0, sumRows = 0;
  for (const l of lines) {
    if (/toplam|k\.?d\.?v|iskonto/i.test(l)) continue;
    const a = amountsIn(l);
    if (a.length >= 3) {
      const [q, p, t] = a.slice(-3);
      if (q > 0 && p > 0 && Math.abs(q * p - t) <= Math.max(0.05, t * 0.001)) { rowsOk++; sumRows += t; }
      else if (q > 0 && p > 0 && t > 0 && q < 10000) { rowsBad++; checks.push(['bad', `Satır hesabı tutmuyor: "${l.slice(0, 80)}" (${N2(q)} × ${N2(p)} = ${N2(q * p)})`]); }
    }
  }
  checks.unshift(rowsOk ? ['ok', `${rowsOk} satırda miktar × birim fiyat = tutar ✓`] : ['warn', 'Miktar × birim fiyat satırı bulunamadı (el yazısı ya da taranmış PDF olabilir)']);
  const ara = findAmount(lines, /ara\s*toplam/i), kdv = findAmount(lines, /^(?!.*(dahil|hariç)).*k\.?d\.?v/i), top = findAmount(lines, /genel\s*toplam/i, /ödenecek/i, /^(?!.*ara).*toplam\s*tutar/i), isk = findAmount(lines, /iskonto/i) || 0;
  if (ara != null && rowsOk) checks.push(Math.abs(sumRows - ara) <= 0.05 ? ['ok', `Satırların toplamı ara toplamla aynı: ${TL(ara)}`] : ['bad', `Satırların toplamı (${TL(sumRows)}) ara toplamla (${TL(ara)}) tutmuyor`]);
  if (ara != null && kdv != null && top != null) checks.push(Math.abs(ara - isk + kdv - top) <= 0.05 ? ['ok', 'Ara toplam − iskonto + KDV = genel toplam ✓'] : ['bad', `Ara toplam − iskonto + KDV (${TL(ara - isk + kdv)}) genel toplamla (${TL(top)}) tutmuyor`]);
  else checks.push(['warn', 'Ara toplam / KDV / genel toplam satırlarının hepsi bulunamadı']);
  if (!rowsBad && rowsOk) checks.push(['ok', 'Hatalı satır yok']);
  return { checks };
}
export function analyzeLabel(pages, { w, h }) {
  const checks = [];
  checks.push(['ok', `${pages.length} sayfa (etiket)`]);
  pages.forEach((p, i) => {
    const fit = Math.abs(p.w - w) <= 1 && Math.abs(p.h - h) <= 1, rot = Math.abs(p.w - h) <= 1 && Math.abs(p.h - w) <= 1;
    if (fit) checks.push(['ok', `Sayfa ${i + 1}: ${N2(p.w)} × ${N2(p.h)} mm, etiket ölçüsüne uygun`]);
    else if (rot) checks.push(['warn', `Sayfa ${i + 1}: ${N2(p.w)} × ${N2(p.h)} mm, yön ters (yatay/dikey); yazdırırken döndürün`]);
    else checks.push(['bad', `Sayfa ${i + 1}: ${N2(p.w)} × ${N2(p.h)} mm, etiket ölçüsü ${w} × ${h} mm ile uyumsuz`]);
    if (!p.lines.length) checks.push(['warn', `Sayfa ${i + 1}: metin yok (görsel olabilir; netliği yazdırmadan kontrol edin)`]);
  });
  return { checks };
}
VIEWS.pdf = (m) => {
  const a = ayar();
  m.innerHTML = head('PDF kontrol', 'PDF bilgisayarınızda okunur, sunucuya yüklenmez. Taranmış (resim) PDF\'lerde metin okunamaz.')
    + `<div class="card grid2">${sel('ptype', 'PDF türü', [['fatura', 'Tedarikçi faturası'], ['siparis', 'Sipariş / teklif formu'], ['etiket', `Etiket PDF'i (${a.etiketW} × ${a.etiketH} mm)`]], 'fatura')}
      <div><label for="pfile">PDF dosyası</label><input id="pfile" type="file" accept="application/pdf"></div></div><div id="pres"></div>`;
  $('#pfile').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const out = $('#pres'); out.innerHTML = '<p class="card">Okunuyor…</p>';
    let pages;
    try { pages = await loadPdf(f); } catch (err) { out.innerHTML = `<p class="card"><span class="pill bad">Hata</span> PDF açılamadı: ${esc(err.message)}</p>`; return; }
    const lines = pages.flatMap((p) => p.lines), t = $('#ptype').value;
    const res = t === 'fatura' ? analyzeInvoice(lines) : t === 'siparis' ? analyzeOrder(lines) : analyzeLabel(pages, { w: num(a.etiketW), h: num(a.etiketH) });
    const icon = { ok: '<span class="pill ok">Uygun</span>', warn: '<span class="pill warn">Dikkat</span>', bad: '<span class="pill bad">Hata</span>' };
    out.innerHTML = `<div class="card" style="display:grid;gap:12px"><h3>${esc(f.name)}</h3><ul class="checks">${res.checks.map(([k, msg]) => `<li>${icon[k]} <span>${esc(msg)}</span></li>`).join('')}</ul>
      ${t === 'fatura' ? '<div class="row"><button class="btn" id="toalis" type="button">Alış olarak kaydet…</button></div>' : ''}
      <details><summary>Okunan metin (${lines.length} satır)</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(lines.join('\n'))}</pre></details></div>`;
    if (t === 'fatura') $('#toalis').onclick = () => editAlis({ ...res.rec, kaynak: f.name });
  };
};

/* ---------------- AYARLAR ve YEDEK ---------------- */
VIEWS.ayarlar = async (m) => {
  const a = ayar();
  m.innerHTML = head('Ayarlar ve yedek', 'Yazdırılan belgelerde görünen firma bilgileri, varsayılan KDV, hesaplar ve gider kategorileri.')
    + `<form class="card" id="af" style="display:grid;gap:12px"><div class="grid2">${field('firma', 'Firma adı', a.firma)}${field('tel', 'Telefon', a.tel)}${field('web', 'Web', a.web)}${field('kdv', 'Varsayılan KDV %', a.kdv, 'number')}${field('vadeGun', 'Teslimden kaç gün sonra alacak "vadesi geçmiş" sayılsın', a.vadeGun, 'number', 'min="0"')}</div>
      ${field('adres', 'Adres', a.adres)}<div><label for="kat">Gider kategorileri (virgülle ayırın)</label><textarea id="kat">${esc(a.kategoriler.join(', '))}</textarea></div>
      <div><label for="hes">Kasa ve banka hesapları (virgülle ayırın; ilki varsayılan)</label><textarea id="hes">${esc(a.hesaplar.join(', '))}</textarea></div>
      <div><label>Başlangıç bakiyeleri (panele başladığınız günkü bakiye)</label><div class="grid2">${a.hesaplar.map((h, i) => field('ac' + i, esc(h), N2(a.acilis[h] || 0), 'text', `inputmode="decimal" data-ac="${esc(h)}"`)).join('')}</div></div>
      <div class="row"><button class="btn" type="submit">Kaydet</button></div></form>
    <div class="card" style="display:grid;gap:10px"><h3>Sunucudaki otomatik yedekler</h3><p class="note">Her hafta panele ilk girişte otomatik yedek alınır; son 6 yedek saklanır. Geri dönmeden önce o anki hâlin de yedeği alınır. Fotoğraflar bu yedeklere girmez.</p><div id="ylist" class="note">Yükleniyor…</div><div class="row"><button class="btn-ghost" id="ynow" type="button">Şimdi yedek al</button></div></div>
    <div class="card" style="display:grid;gap:10px"><h3>Bilgisayara yedek</h3><p class="note">Tüm kayıtları (fotoğraflar hariç) JSON dosyası olarak indirin; ayda bir indirip güvenli bir yerde saklayın.${lsGet('bp-son-yedek') ? ` Bu bilgisayara son indirme: ${fmtDate(lsGet('bp-son-yedek'))}.` : ''}</p>
      <div class="row"><button class="btn-ghost" id="exp" type="button">Yedeği indir</button><label class="btn-ghost" for="imp" style="margin:0">Dosyadan geri yükle…</label><input id="imp" type="file" accept="application/json" hidden></div><p class="note" id="impmsg"></p></div>
    <div class="card" style="display:grid;gap:8px"><h3>Telefona uygulama gibi ekleme</h3><p class="note">iPhone: Safari'de bu sayfayı açın → Paylaş → "Ana Ekrana Ekle". Android: Chrome menüsü → "Ana ekrana ekle" ya da "Uygulamayı yükle".</p></div>`;
  $('#af').onsubmit = (e) => {
    e.preventDefault();
    const acilis = {}; $$('[data-ac]').forEach((i) => (acilis[i.dataset.ac] = num(i.value)));
    const hesaplar = $('#hes').value.split(',').map((x) => x.trim()).filter(Boolean);
    save('ayarlar', { ...a, id: 'genel', firma: $('#firma').value.trim(), tel: $('#tel').value.trim(), web: $('#web').value.trim(), adres: $('#adres').value.trim(), kdv: num($('#kdv').value), vadeGun: num($('#vadeGun').value), kategoriler: $('#kat').value.split(',').map((x) => x.trim()).filter(Boolean), hesaplar: hesaplar.length ? hesaplar : a.hesaplar, acilis }).then((r) => r && route());
  };
  $('#exp').onclick = () => { downloadBackup(); toast('Yedek indirildi'); };
  let armed = null;
  $('#imp').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { armed = JSON.parse(await f.text()).data; if (!armed || typeof armed !== 'object') throw 0; } catch (_) { $('#impmsg').textContent = 'Dosya okunamadı.'; return; }
    $('#impmsg').innerHTML = `Bu dosya mevcut tüm kayıtların yerine geçecek (önce şimdiki hâlin yedeği sunucuda alınır). <button class="btn-sm danger" id="impok" type="button">Evet, geri yükle</button>`;
    $('#impok').onclick = async () => { const r = await api({ a: 'import', confirm: 'YEDEKTEN_YUKLE', data: armed }); if (r.ok) { toast(`${r.n} kayıt yüklendi`); loadAll(); } else toast('Yüklenemedi: ' + r.error, true); };
  };
  const showY = (items) => {
    const box = $('#ylist'); if (!box) return;
    box.innerHTML = items.length ? `<table><tbody>${items.map((y) => `<tr><td>${new Date(y.tarih).toLocaleString('tr-TR')}</td><td>${esc(y.neden)}</td><td class="n">${y.n} kayıt</td><td><button class="btn-sm danger" data-yd="${y.id}" type="button">Bu yedeğe dön</button></td></tr>`).join('')}</tbody></table>` : 'Henüz yedek yok.';
    $$('[data-yd]', box).forEach((b) => armBtn(b, 'Tüm kayıtlar bu yedekle değişecek, onayla', async () => { const r = await api({ a: 'yedege-don', id: b.dataset.yd, confirm: 'YEDEGE_DON' }); if (r.ok) { toast(`${r.n} kayıt geri yüklendi`); loadAll(); } else toast('Geri dönülemedi: ' + r.error, true); }));
  };
  $('#ynow').onclick = async () => { const r = await api({ a: 'yedek-al' }); if (r.ok) { toast('Yedek alındı'); showY(r.items); } else toast('Yedek alınamadı', true); };
  const r = await api({ a: 'yedekler' });
  showY(r.ok ? r.items : []);
};

if (!window.__BP_TEST__) boot();
