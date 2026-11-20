/* Bey Perde Ön Muhasebe — panel ön yüzü. Veriler /api/admin üzerinden sunucudaki depoda tutulur.
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
const S = { kalemler: [], satislar: [], alislar: [], giderler: [], ayarlar: [], virmanlar: [], cariler: [] };
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
  const elle = r2((k.girisler || []).reduce((a, x) => a + num(x.miktar), 0));
  return { giris: r2(giris + elle), cikis, mevcut: r2(num(k.acilisStok) + num(k.duzeltme) + giris + elle - cikis) };
}
export function hareketler(data = S) {   // kasa ve banka hareketleri
  const h0 = H0(), out = [];
  for (const s of data.satislar) for (const t of s.tahsilat || []) out.push({ tarih: t.tarih, hesap: t.hesap || h0, tutar: num(t.tutar), acik: `Tahsilat · ${s.musteri || ''} · ${s.no || ''}`, satis: s.id });
  for (const a of data.alislar) for (const o of alisOdemeler(a)) out.push({ tarih: o.tarih, hesap: o.hesap || h0, tutar: -num(o.tutar), acik: `Ödeme · ${a.tedarikci || ''}${a.faturaNo ? ' · ' + a.faturaNo : ''}`, alis: a.id });
  for (const g of data.giderler) out.push({ tarih: g.tarih, hesap: g.hesap || h0, tutar: -calcKdvli(g).toplam, acik: `Gider · ${g.kategori || ''}${g.aciklama ? ' · ' + g.aciklama : ''}`, gider: g.id });
  for (const v of data.virmanlar || []) { out.push({ tarih: v.tarih, hesap: v.kaynak, tutar: -num(v.tutar), acik: `Transfer → ${v.hedef}${v.aciklama ? ' · ' + v.aciklama : ''}`, virman: v.id }); out.push({ tarih: v.tarih, hesap: v.hedef, tutar: num(v.tutar), acik: `Transfer ← ${v.kaynak}${v.aciklama ? ' · ' + v.aciklama : ''}`, virman: v.id }); }
  for (const y of ayar().sayimlar || []) out.push({ tarih: y.tarih, hesap: y.hesap, tutar: num(y.fark), acik: `Gün sonu sayım farkı${y.not ? ' · ' + y.not : ''}`, sayim: 1 });
  return out.sort((a, b) => String(a.tarih).localeCompare(b.tarih));
}
const mKey = (s) => { const d = String(s.tel || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? 't' + d : 'n' + String(s.musteri || '').trim().toLocaleLowerCase('tr').replace(/\s+/g, '-'); };
const waNum = (tel) => { let d = String(tel || '').replace(/\D/g, ''); if (d.startsWith('0')) d = d.slice(1); if (d.length === 10) d = '90' + d; return d.length >= 11 ? d : ''; };
const waLink = (tel, text) => { const n = waNum(tel); return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : ''; };
const DURUM = { teklif: 'Teklif', siparis: 'Sipariş', teslim: 'Teslim edildi' };

/* ---------------- ortak ---------------- */
const TL0 = (n) => { const v = Math.round(num(n)); return (v < 0 ? '−₺' : '₺') + Math.abs(v).toLocaleString('tr-TR'); };
const AY3 = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const dayMon = (d) => { const [, m, g] = String(d).split('-'); return `${+g} ${AYLAR[+m - 1]}`; };
const GIDER_KAT = ['Kumaş ve malzeme', 'Fason dikim', 'Personel', 'SGK primleri', 'Kira', 'Enerji (elektrik, su, doğalgaz)', 'Telefon ve internet', 'Yakıt ve nakliye', 'Reklam ve sosyal medya', 'Web sitesi ve yazılım', 'Muhasebe / mali müşavir', 'Vergiler (KDV, stopaj vb.)', 'Bakım ve onarım', 'Banka / POS komisyonları', 'Diğer'];
const giderKatlari = () => [...new Set([...GIDER_KAT, ...S.giderler.map((g) => g.kategori).filter(Boolean)])];
const ALIS_KAT = ['Kumaş', 'Aksesuar', 'Mekanik / ray', 'Fason dikim', 'Hizmet', 'Diğer'];
const FATURA_TIP = ['e-Arşiv Fatura', 'e-Fatura', 'Kağıt Fatura', 'Faturasız (sipariş fişi)'];
const ODEME = ['Açık hesap (vadeli)', 'Nakit', 'Kredi kartı', 'Havale / EFT'];
const TUR = { urun: 'Ürün', iscilik: 'İşçilik', hizmet: 'Hizmet' };
const ASAMA = [['olcu', 'Ölçü alındı / teklif'], ['onay', 'Teklif onaylandı'], ['dikim', 'Dikimde'], ['hazir', 'Montaja hazır'], ['teslim', 'Teslim edildi']];
const asamaOf = (s) => (s.durum === 'teklif' ? 'olcu' : s.durum === 'teslim' ? 'teslim' : s.asama || 'onay');
const ayarDoc = () => S.ayarlar.find((a) => a.id === 'genel') || { id: 'genel' };
const saveAyar = (ch) => save('ayarlar', { ...ayarDoc(), ...ch }, true);
const hesapTur = (h) => (/kasa|nakit/i.test(h) ? 'Nakit' : /pos|kart/i.test(h) ? 'POS / Kart' : 'Banka');
const vadeOf = (s) => s.vade || (s.durum === 'teslim' ? addDays(refDate(s), num(ayar().vadeGun)) : '');
function durumOf(s, t = today()) {
  if (s.durum === 'teklif') return { k: 'taslak', l: 'Taslak', c: 'mut' };
  const c = calcSatis(s);
  if (c.kalan <= 0.009) return { k: 'odendi', l: 'Ödendi', c: 'ok' };
  const v = vadeOf(s);
  if (v && v < t) return { k: 'gecikti', l: 'Gecikti', c: 'bad' };
  if (c.tahsil > 0.009) return { k: 'kismi', l: 'Kısmi', c: 'info' };
  return { k: 'bekliyor', l: 'Bekliyor', c: 'warn' };
}
function alisDurum(a, t = today()) {
  const c = calcAlis(a);
  if (c.kalan <= 0.009) return { k: 'odendi', l: 'Ödendi', c: 'ok' };
  if (a.vade && a.vade < t) return { k: 'gecikti', l: 'Gecikti', c: 'bad' };
  return { k: 'odenecek', l: 'Ödenecek', c: 'warn' };
}
const pill = (d) => `<span class="pill ${d.c}">${esc(d.l)}</span>`;
const ph = (title, sub, btns = '', back = '') => `<header class="ph"><div>${back}<h1>${title}</h1>${sub ? `<span class="sub">${sub}</span>` : ''}</div><div class="row">${btns}</div></header>`;
const kpiBox = (label, value, note = '', cls = '') => `<div class="kpi"><span>${label}</span><span class="v">${value}</span>${note ? `<span class="n ${cls}">${note}</span>` : ''}</div>`;
const emptyRow = (cols, t) => `<tr><td colspan="${cols}" class="empty">${t}</td></tr>`;
const initials = (s) => String(s || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr');
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* yok say */ } };
const ICON_PLUS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const ICON_SEARCH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6168" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
function bars(months) {   // months: [{ad, gelir, gider}]
  const max = Math.max(1, ...months.flatMap((m) => [m.gelir, m.gider]));
  const cols = `grid-template-columns:repeat(${months.length},minmax(0,1fr))`;
  return `<div class="leg"><span><i></i>Gelir</span><span><i class="o"></i>Gider</span></div>
    <div class="bars" style="${cols}" role="img" aria-label="Aylık gelir ve gider sütun grafiği">${months.map((m) => `<div title="${esc(m.ad)}: gelir ${TL0(m.gelir)}, gider ${TL0(m.gider)}"><i style="height:${Math.round((m.gelir / max) * 220)}px"></i><i class="o" style="height:${Math.round((m.gider / max) * 220)}px"></i></div>`).join('')}</div>
    <div class="bl" style="${cols}">${months.map((m) => `<div><b>${esc(m.ad)}</b><span>${m.gelir || m.gider ? (m.gelir - m.gider >= 0 ? '+' : '') + TL0(m.gelir - m.gider) : '—'}</span></div>`).join('')}</div>`;
}
const ayGG = (ym) => { const R = calcAy(ym); return { gelir: R.satisToplam, gider: r2(R.alisToplam + R.giderToplam) }; };

/* ---------------- cariler ---------------- */
const tKey = (ad) => 'T:' + String(ad || '').trim().toLocaleLowerCase('tr').replace(/\s+/g, '-');
function cariler() {
  const m = new Map();
  const get = (key, tur, ad) => { let o = m.get(key); if (!o) { o = { key, tur, ad, tel: '', adres: '', satislar: [], alislar: [], son: '', doc: null }; m.set(key, o); } return o; };
  for (const c of S.cariler) { const o = get(c.tur === 'tedarikci' ? tKey(c.ad) : mKey({ tel: c.tel, musteri: c.ad }), c.tur || 'musteri', c.ad); Object.assign(o, { ad: c.ad, tel: c.tel || '', adres: c.adres || '', vergi: c.vergi || '', doc: c }); }
  for (const s of S.satislar) { const o = get(mKey(s), 'musteri', s.musteri); o.satislar.push(s); if (String(s.tarih) >= o.son) { o.son = s.tarih; if (!o.doc) { o.ad = s.musteri || o.ad; o.tel = s.tel || o.tel; o.adres = s.adres || o.adres; } } }
  for (const a of S.alislar) { if (!a.tedarikci) continue; const o = get(tKey(a.tedarikci), 'tedarikci', a.tedarikci); o.alislar.push(a); if (String(a.tarih) > o.son) o.son = a.tarih; }
  const t = today();
  for (const o of m.values()) {
    if (o.tur === 'musteri') { const open = o.satislar.filter((s) => s.durum !== 'teklif'); o.bakiye = r2(open.reduce((a, s) => a + Math.max(0, calcSatis(s).kalan), 0)); o.gecikmis = r2(open.filter((s) => durumOf(s, t).k === 'gecikti').reduce((a, s) => a + calcSatis(s).kalan, 0)); }
    else { o.bakiye = r2(o.alislar.reduce((a, x) => a + Math.max(0, calcAlis(x).kalan), 0)); o.gecikmis = r2(o.alislar.filter((x) => alisDurum(x, t).k === 'gecikti').reduce((a, x) => a + calcAlis(x).kalan, 0)); }
  }
  return [...m.values()].sort((a, b) => b.bakiye - a.bakiye || String(b.son).localeCompare(a.son));
}
function ekstre(o) {
  const mv = [];
  if (o.tur === 'musteri') {
    for (const s of o.satislar.filter((x) => x.durum !== 'teklif')) {
      mv.push({ tarih: s.tarih, acik: `Fatura ${s.no || ''}${(s.satirlar || [])[0] ? ' — ' + s.satirlar[0].ad : ''}`, borc: calcSatis(s).toplam, alacak: 0, satis: s.id });
      for (const t of s.tahsilat || []) mv.push({ tarih: t.tarih, acik: `Tahsilat${t.hesap ? ' · ' + t.hesap : ''}${t.not ? ' · ' + t.not : ''}`, borc: 0, alacak: num(t.tutar) });
    }
  } else {
    for (const a of o.alislar) {
      mv.push({ tarih: a.tarih, acik: `Alış ${a.faturaNo || ''}${a.aciklama ? ' — ' + a.aciklama : ''}`, borc: 0, alacak: calcAlis(a).toplam, alis: a.id });
      for (const p of alisOdemeler(a)) mv.push({ tarih: p.tarih, acik: `Ödeme${p.hesap ? ' · ' + p.hesap : ''}`, borc: num(p.tutar), alacak: 0 });
    }
  }
  return mv.sort((a, b) => String(a.tarih).localeCompare(b.tarih));
}
// Tahsilat ya da ödeme, en eski açık faturadan başlayarak dağıtılır
async function tahsilatUygula(o, tutar, tarih, hesap, not) {
  let kalan = r2(tutar);
  if (o.tur === 'musteri') {
    const open = o.satislar.filter((s) => s.durum !== 'teklif' && calcSatis(s).kalan > 0.009).sort((a, b) => String(a.tarih).localeCompare(b.tarih));
    const acik = r2(open.reduce((a, s) => a + calcSatis(s).kalan, 0));
    if (kalan > acik + 0.009) { toast(`Açık bakiye ${TL(acik)}; daha fazla tahsilat girilemez`, true); return false; }
    for (const s of open) { if (kalan <= 0.009) break; const p = r2(Math.min(kalan, calcSatis(s).kalan)); if (!(await save('satislar', { ...s, tahsilat: [...(s.tahsilat || []), { tarih, tutar: p, hesap, not }] }, true))) return false; kalan = r2(kalan - p); }
  } else {
    const open = o.alislar.filter((a) => calcAlis(a).kalan > 0.009).sort((a, b) => String(a.vade || a.tarih).localeCompare(b.vade || b.tarih));
    const acik = r2(open.reduce((a, x) => a + calcAlis(x).kalan, 0));
    if (kalan > acik + 0.009) { toast(`Açık borç ${TL(acik)}; daha fazla ödeme girilemez`, true); return false; }
    for (const a of open) { if (kalan <= 0.009) break; const p = r2(Math.min(kalan, calcAlis(a).kalan)); if (!(await save('alislar', { ...a, odemeler: [...alisOdemeler(a), { tarih, tutar: p, hesap }] }, true))) return false; kalan = r2(kalan - p); }
  }
  toast(o.tur === 'musteri' ? 'Tahsilat kaydedildi' : 'Ödeme kaydedildi');
  return true;
}
function tahsilatDlg(o) {
  const tah = o.tur === 'musteri';
  openDlg(`<h2>${tah ? 'Tahsilat al' : 'Ödeme yap'} · ${esc(o.ad)}</h2>
    <p class="note">${tah ? 'Açık alacak' : 'Açık borç'}: <b class="num">${TL(o.bakiye)}</b>. Tutar en eski açık faturadan başlayarak kapatılır.</p>
    <div class="g2">${field('tutar', 'Tutar (₺)', N2(o.bakiye), 'text', 'inputmode="decimal" required')}${field('tarih', 'Tarih', today(), 'date', 'required')}${sel('hesap', 'Hesap', ayar().hesaplar.map((h) => [h, h]), H0())}${tah ? field('not', 'Açıklama', '', 'text', 'placeholder="Kapora, kalan…"') : ''}</div>`,
  async (f) => { const t = num(val(f, 'tutar')); if (t <= 0) { toast('Tutar girin', true); return false; } return tahsilatUygula(o, t, val(f, 'tarih'), val(f, 'hesap'), tah ? val(f, 'not') : ''); }, null, tah ? 'Tahsilatı kaydet' : 'Ödemeyi kaydet');
}
function editCari(c = { tur: 'musteri' }) {
  openDlg(`<h2>${c.id ? 'Cariyi düzenle' : 'Yeni cari'}</h2><div class="g2">${field('ad', 'Ad / ünvan', c.ad, 'text', 'required')}${sel('tur', 'Tür', [['musteri', 'Müşteri'], ['tedarikci', 'Tedarikçi']], c.tur)}${field('tel', 'Telefon', c.tel, 'tel')}${field('vergi', 'Vergi / TC no', c.vergi)}</div>${field('adres', 'Adres', c.adres)}`,
  (f) => save('cariler', { ...c, ad: val(f, 'ad'), tur: val(f, 'tur'), tel: val(f, 'tel'), vergi: val(f, 'vergi'), adres: val(f, 'adres') }),
  c.id ? () => remove('cariler', c.id) : null);
}

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
$('#yedek').addEventListener('click', () => { downloadBackup(); toast('Yedek indirildi'); });

/* ---------------- yönlendirme ---------------- */
const VIEWS = {};
const NAV_OF = { fatura: 'faturalar' };
function route() {
  const [v, arg] = (location.hash || '#panel').slice(1).split('/');
  const name = VIEWS[v] ? v : 'panel';
  const nav = NAV_OF[name] || name;
  $$('#nav a').forEach((a) => { if (a.getAttribute('href') === '#' + nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const m = $('#main'); m.innerHTML = ''; m.oninput = null; m.onchange = null; VIEWS[name](m, arg ? decodeURIComponent(arg) : '');
}
addEventListener('hashchange', () => { if (!$('#shell').hidden) { route(); scrollTo(0, 0); } });
const months = () => {
  const set = new Set([ymOf(today())]);
  for (const c of ['satislar', 'alislar', 'giderler']) S[c].forEach((d) => d.tarih && set.add(ymOf(d.tarih)));
  return [...set].sort().reverse();
};
const lastMonths = (n) => { const out = []; const [y, m] = today().split('-').map(Number); for (let i = n - 1; i >= 0; i--) { const d = new Date(Date.UTC(y, m - 1 - i, 1)); out.push(d.toISOString().slice(0, 7)); } return out; };

/* ---------------- GÖSTERGE PANELİ ---------------- */
let fFilter = { q: '', durum: '', asama: '' };
VIEWS.panel = (m) => {
  const t = today(), ym = ymOf(t), R = calcAy(ym), a = ayar(), hs = hareketler();
  const bak = (h) => r2(num(a.acilis[h]) + hs.filter((x) => x.hesap === h).reduce((s, x) => s + x.tutar, 0));
  const nakit = a.hesaplar.filter((h) => hesapTur(h) === 'Nakit').reduce((s, h) => s + bak(h), 0);
  const toplamH = a.hesaplar.reduce((s, h) => s + bak(h), 0);
  const ayFat = S.satislar.filter((s) => s.durum !== 'teklif' && ymOf(s.tarih) === ym);
  const acik = S.satislar.filter((s) => s.durum !== 'teklif' && calcSatis(s).kalan > 0.009);
  const gec = acik.filter((s) => durumOf(s, t).k === 'gecikti');
  const dues = [...acik].sort((x, y) => String(vadeOf(x) || '9999').localeCompare(vadeOf(y) || '9999')).slice(0, 5);
  const whenOf = (s) => { const v = vadeOf(s); if (!v) return ['Vade yok', 'mut']; const d = daysBetween(t, v); return d < 0 ? [`${-d} gün gecikmiş`, 'bad'] : d === 0 ? ['Bugün', 'warn'] : [dayMon(v), 'mut']; };
  const sip = S.satislar.filter((s) => s.durum !== 'teslim');
  const stages = [...ASAMA.slice(0, 4).map(([k, l]) => { const l2 = sip.filter((s) => asamaOf(s) === k); return { k, l: k === 'olcu' ? 'Ölçü alındı' : l, n: l2.length, tot: l2.reduce((x, s) => x + calcSatis(s).toplam, 0), tah: k === 'olcu' }; }),
    (() => { const l2 = S.satislar.filter((s) => s.durum === 'siparis' && s.montaj === t); return { k: 'bugun', l: 'Montaj bugün', n: l2.length, tot: l2.reduce((x, s) => x + calcSatis(s).toplam, 0) }; })()];
  const son = [...S.satislar].sort((x, y) => String(y.tarih).localeCompare(x.tarih) || String(y.no).localeCompare(x.no)).slice(0, 5);
  const kritik = S.kalemler.filter((k) => k.stok && num(k.kritik) > 0 && stokOf(k).mevcut <= num(k.kritik)).slice(0, 5);
  m.innerHTML = ph('Gösterge Paneli', `${dayLabel(t)} · ${AYLAR[+ym.slice(5) - 1]} ayı özeti`,
    `<label class="search">${ICON_SEARCH}<span class="sr">Ara</span><input id="gq" type="search" placeholder="Cari, fatura veya ürün ara"></label><a class="btn-o" href="#kasa/tahsilat">Tahsilat Gir</a><a class="btn" href="#fatura/yeni">${ICON_PLUS}Yeni Fatura</a>`)
  + `<section class="kpis" aria-label="Özet">${kpiBox('Bu Ay Satış', TL0(R.satisToplam), `${ayFat.length} fatura · KDV dahil`)}${kpiBox('Bekleyen Tahsilat', TL0(R.alacak), gec.length ? `${gec.length} tanesi vadesi geçmiş` : 'Vadesi geçen yok', gec.length ? 'bad' : '')}${kpiBox('Bu Ay Gider', TL0(R.alisToplam + R.giderToplam), 'Alış faturaları ve giderler · KDV dahil')}${kpiBox('Kasa + Banka', TL0(toplamH), `Nakit ${TL0(nakit)} · Diğer ${TL0(toplamH - nakit)}`)}</section>
  <section class="split"><div class="card w2"><div class="ch"><div class="row"><h2>Gelir ve Gider — Son 6 Ay</h2><a href="#yillik">Yıllık tablo</a></div></div>${bars(lastMonths(6).map((x) => ({ ad: AY3[+x.slice(5) - 1], ...ayGG(x) })))}</div>
    <div class="card w1"><div class="ch"><h2>Vadesi Yaklaşan Tahsilatlar</h2><a href="#cariler">Tümü</a></div><div class="list">${dues.map((s) => { const [w, c] = whenOf(s); return `<div><div class="t"><b><a href="#fatura/${s.id}" style="color:inherit;text-decoration:none">${esc(s.musteri)}</a></b><span style="color:var(--${c === 'bad' ? 'bad-t' : c === 'warn' ? 'warn-t' : 'muted'})">${w}</span></div><span class="num" style="font-weight:600">${TL0(calcSatis(s).kalan)}</span></div>`; }).join('') || '<p class="empty">Açık alacak yok.</p>'}</div></div></section>
  <section class="card" aria-label="Sipariş akışı"><div class="ch"><h2>Sipariş Akışı</h2><span class="sm mut">Ölçüden montaja açık siparişler</span></div><div class="stages">${stages.map((s) => `<button class="stage" type="button" data-st="${s.k}"><span>${s.l}</span><b>${s.n}</b><small>${TL0(s.tot)}${s.tah ? ' tahmini' : ''}</small></button>`).join('')}</div></section>
  <section class="split"><div class="card w2"><div class="ch"><h2>Son Faturalar</h2><a href="#faturalar">Fatura listesi</a></div><div class="tw"><table style="min-width:560px"><thead><tr><th>Fatura No</th><th>Cari</th><th>Tarih</th><th class="r">Tutar</th><th>Durum</th></tr></thead><tbody>${son.map((s) => `<tr class="click" data-go="#fatura/${s.id}"><td class="num sm">${esc(s.no)}</td><td style="font-weight:500">${esc(s.musteri)}</td><td class="mut">${fmtDate(s.tarih)}</td><td class="r num" style="font-weight:600">${TL0(calcSatis(s).toplam)}</td><td>${pill(durumOf(s, t))}</td></tr>`).join('') || emptyRow(5, 'Henüz fatura yok.')}</tbody></table></div></div>
    <div class="card w1"><div class="ch"><h2>Kritik Stok</h2><a href="#stok">Stoğa git</a></div>${kritik.map((k) => { const s = stokOf(k).mevcut; return `<div style="display:flex;flex-direction:column;gap:8px;padding:10px 0;border-top:1px solid var(--line2)"><div style="display:flex;justify-content:space-between;gap:12px"><span style="font-weight:500">${esc(k.ad)}</span><span class="num sm" style="color:var(--warn-t);font-weight:600">${N2(s)} ${esc(k.birim)} kaldı</span></div><div class="meter"><i style="width:${Math.max(3, Math.min(100, (s / (num(k.kritik) * 3)) * 100))}%"></i></div></div>`; }).join('') || '<p class="empty">Uyarı seviyesinin altında ürün yok. Uyarı seviyesi stok kartından girilir.</p>'}</div></section>`;
  $('#gq').onkeydown = (e) => { if (e.key === 'Enter') { fFilter = { q: e.target.value.trim(), durum: '', asama: '' }; location.hash = '#faturalar'; } };
  $$('[data-st]', m).forEach((b) => (b.onclick = () => { fFilter = { q: '', durum: '', asama: b.dataset.st }; location.hash = '#faturalar'; }));
  $$('[data-go]', m).forEach((r) => (r.onclick = () => (location.hash = r.dataset.go)));
};

/* ---------------- SATIŞ FATURALARI ---------------- */
VIEWS.faturalar = (m) => {
  const t = today();
  const tabs = [['', 'Tümü'], ['taslak', 'Taslak'], ['bekliyor', 'Bekliyor'], ['kismi', 'Kısmi'], ['gecikti', 'Gecikti'], ['odendi', 'Ödendi']];
  const stLabel = { olcu: 'Ölçü alındı', onay: 'Teklif onaylandı', dikim: 'Dikimde', hazir: 'Montaja hazır', teslim: 'Teslim edildi', bugun: 'Montaj bugün' };
  const draw = () => {
    const q = fFilter.q.toLocaleLowerCase('tr');
    const list = [...S.satislar].filter((s) => (!q || `${s.musteri} ${s.no} ${s.tel} ${(s.satirlar || []).map((l) => l.ad).join(' ')}`.toLocaleLowerCase('tr').includes(q))
      && (!fFilter.durum || durumOf(s, t).k === fFilter.durum)
      && (!fFilter.asama || (fFilter.asama === 'bugun' ? s.durum === 'siparis' && s.montaj === t : asamaOf(s) === fFilter.asama)))
      .sort((a, b) => String(b.tarih).localeCompare(a.tarih) || String(b.no).localeCompare(a.no));
    let top = 0, kal = 0;
    $('#fb').innerHTML = list.map((s) => { const c = calcSatis(s); if (s.durum !== 'teklif') { top += c.toplam; kal += Math.max(0, c.kalan); } return `<tr class="click" data-go="#fatura/${s.id}"><td class="num sm">${esc(s.no)}</td><td><b style="font-weight:500">${esc(s.musteri)}</b>${s.tel ? `<br><span class="xs mut">${esc(s.tel)}</span>` : ''}</td><td class="mut">${fmtDate(s.tarih)}</td><td class="mut">${vadeOf(s) ? fmtDate(vadeOf(s)) : '—'}</td><td class="sm">${esc(stLabel[asamaOf(s)] || '')}${s.montaj && s.durum === 'siparis' ? `<br><span class="xs mut">Montaj ${fmtDate(s.montaj)}</span>` : ''}</td><td class="r num" style="font-weight:600">${TL0(c.toplam)}</td><td class="r num">${s.durum === 'teklif' ? '—' : TL0(Math.max(0, c.kalan))}</td><td>${pill(durumOf(s, t))}</td></tr>`; }).join('') || emptyRow(8, S.satislar.length ? 'Filtreye uyan fatura yok.' : 'Henüz fatura yok. "Yeni Fatura" ile başlayın.');
    $('#ff').innerHTML = list.length ? `<tr><td colspan="5">${list.length} fatura</td><td class="r num">${TL0(top)}</td><td class="r num">${TL0(kal)}</td><td></td></tr>` : '';
    $$('[data-go]', m).forEach((r) => (r.onclick = () => (location.hash = r.dataset.go)));
  };
  m.innerHTML = ph('Satış Faturaları', 'Teklif, sipariş ve teslim edilen işler · tutarlar KDV dahil', `<label class="search">${ICON_SEARCH}<span class="sr">Ara</span><input id="fq" type="search" placeholder="Cari, fatura no, ürün" value="${esc(fFilter.q)}"></label><a class="btn" href="#fatura/yeni">${ICON_PLUS}Yeni Fatura</a>`)
  + `<section class="card"><div class="ch"><div class="tabs" role="group" aria-label="Durum">${tabs.map(([k, l]) => `<button type="button" data-d="${k}" aria-pressed="${fFilter.durum === k}">${l}</button>`).join('')}</div>${fFilter.asama ? `<span class="row sm"><span class="pill info">${esc(stLabel[fFilter.asama])}</span><button class="btn-g" type="button" id="clr">Filtreyi temizle</button></span>` : ''}</div>
    <div class="tw"><table style="min-width:820px"><thead><tr><th>Fatura No</th><th>Cari</th><th>Tarih</th><th>Vade</th><th>Aşama</th><th class="r">Tutar</th><th class="r">Kalan</th><th>Durum</th></tr></thead><tbody id="fb"></tbody><tfoot id="ff"></tfoot></table></div></section>`;
  $('#fq').oninput = (e) => { fFilter.q = e.target.value; draw(); };
  $$('[data-d]', m).forEach((b) => (b.onclick = () => { fFilter.durum = b.dataset.d; $$('[data-d]', m).forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); }));
  if ($('#clr')) $('#clr').onclick = () => { fFilter.asama = ''; route(); };
  draw();
};
function nextNo() {
  const y = today().slice(0, 4);
  const used = new Set(S.satislar.map((s) => s.no));
  let n = S.satislar.filter((s) => String(s.no || '').startsWith(`BP-${y}-`)).length + 1;
  while (used.has(`BP-${y}-${String(n).padStart(4, '0')}`)) n++;
  return `BP-${y}-${String(n).padStart(4, '0')}`;
}
VIEWS.fatura = (m, id) => {
  const orig = S.satislar.find((s) => s.id === id);
  if (id !== 'yeni' && !orig) { m.innerHTML = ph('Fatura bulunamadı', '', '', '<a class="back" href="#faturalar">← Satış Faturaları</a>'); return; }
  const F = orig ? structuredClone(orig) : { tarih: today(), vade: addDays(today(), 30), durum: 'teklif', no: nextNo(), satirlar: [], tahsilat: [], faturaTipi: FATURA_TIP[0], odemeSekli: ODEME[0], not: 'Ölçü ve montaj dahildir.' };
  F.satirlar = F.satirlar || []; F.tahsilat = F.tahsilat || [];
  const cl = cariler().filter((c) => c.tur === 'musteri');
  const kAll = [...S.kalemler].sort((a, b) => String(a.ad).localeCompare(b.ad, 'tr'));
  const kumas = kAll.filter((k) => k.stokTur === 'kumas' || /tül|tul|fon|kumaş/i.test(k.ad));
  const detayOf = (l) => l.detay ?? [l.oda, l.olcu, l.pile].filter(Boolean).join(' · ');
  const lineRow = (l, i) => `<tr data-i="${i}"><td><div class="nm"><input list="klist" data-f="ad" value="${esc(l.ad)}" placeholder="Ürün / hizmet" aria-label="Ürün / hizmet"><input data-f="detay" value="${esc(detayOf(l))}" placeholder="Oda, ölçü, pile…" aria-label="Açıklama"></div></td>
    <td><input class="q num" data-f="miktar" value="${N2(l.miktar ?? 1)}" inputmode="decimal" aria-label="Miktar"></td><td><input data-f="birim" value="${esc(l.birim || 'adet')}" style="width:64px" aria-label="Birim"></td>
    <td><input class="p num" data-f="fiyat" value="${N2(l.fiyat ?? 0)}" inputmode="decimal" aria-label="Birim fiyat"></td><td><select class="k" data-f="kdv" aria-label="KDV">${[20, 10, 1, 0].map((k) => `<option value="${k}"${num(l.kdv ?? ayar().kdv) === k ? ' selected' : ''}>%${k}</option>`).join('')}</select></td>
    <td class="r num" data-t style="font-weight:600;white-space:nowrap"></td><td><button type="button" class="btn-g danger" data-x aria-label="Kalemi sil">Sil</button></td></tr>`;
  const ia = asamaOf(F);
  m.innerHTML = ph(orig ? `Fatura ${esc(F.no)}` : 'Yeni Satış Faturası', orig ? `${esc(F.musteri)} · ${fmtDate(F.tarih)}` : '',
    `${orig ? '<button class="btn-g danger" type="button" id="fdel">Sil</button>' : ''}<button class="btn-o" type="button" id="fdraft">Taslak Kaydet</button><button class="btn-o" type="button" id="fpr">Önizle / Yazdır</button><button class="btn" type="button" id="fok">${F.durum === 'teklif' ? 'Faturayı Kes' : 'Kaydet'}</button>`,
    '<a class="back" href="#faturalar">← Satış Faturaları</a>')
  + `<datalist id="klist">${kAll.map((k) => `<option value="${esc(k.ad)}">${k.kod ? esc(k.kod) + ' · ' : ''}${TL(k.satis)}</option>`).join('')}</datalist>
  <datalist id="clist">${cl.map((c) => `<option value="${esc(c.ad)}">${esc(c.tel || '')}</option>`).join('')}</datalist>
  <div class="split"><div class="w2" style="display:flex;flex-direction:column;gap:16px">
    <section class="card" aria-label="Fatura bilgileri"><div class="fgrid">
      <label>Cari (Müşteri)<input id="musteri" list="clist" value="${esc(F.musteri)}" required autocomplete="off" placeholder="Ad soyad / firma"></label>
      <label>Telefon<input id="tel" type="tel" value="${esc(F.tel)}"></label>
      <label>Fatura No<input id="no" class="num" value="${esc(F.no)}"></label>
      <label>Fatura Tarihi<input id="tarih" type="date" value="${esc(F.tarih)}"></label>
      <label>Vade Tarihi<input id="vade" type="date" value="${esc(F.vade || '')}"></label>
      <label>Fatura Tipi<select id="faturaTipi">${FATURA_TIP.map((x) => `<option${x === F.faturaTipi ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
      <label style="grid-column:1/-1">Sipariş / Montaj Adresi<input id="adres" value="${esc(F.adres)}"></label>
      <label>Sipariş durumu<select id="asama">${ASAMA.map(([k, l]) => `<option value="${k}"${k === ia ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      <label>Montaj tarihi<input id="montaj" type="date" value="${esc(F.montaj || '')}"></label>
      <label>Montaj saati<input id="montajSaat" type="time" value="${esc(F.montajSaat || '')}"></label>
    </div></section>
    <section class="card" aria-label="Kalemler"><div class="ch"><h2>Kalemler</h2><button class="btn-o" type="button" id="addl" style="height:38px">${ICON_PLUS}Kalem Ekle</button></div>
      <div class="tw lines"><table style="min-width:640px"><thead><tr><th>Ürün / Hizmet</th><th>Miktar</th><th>Birim</th><th>Birim Fiyat</th><th>KDV</th><th class="r">Tutar</th><th><span class="sr">Sil</span></th></tr></thead><tbody id="lines">${F.satirlar.map(lineRow).join('')}</tbody></table></div>
      <p class="note" id="nolines"${F.satirlar.length ? ' hidden' : ''}>Henüz kalem yok. "Kalem Ekle" ile ekleyin; ürün adını yazarken stoktaki ürünler önerilir ve fiyatı otomatik gelir.</p>
      <label>Not (faturada görünür)<textarea id="not" rows="2">${esc(F.not)}</textarea></label>
    </section>
  </div>
  <aside class="w1" style="display:flex;flex-direction:column;gap:16px">
    <section class="card" aria-label="Toplam"><h2>Özet</h2><div id="tot" class="tot"></div>
      <div class="seg" role="group" aria-label="İskonto">${[0, 5, 10, 15].map((p) => `<button type="button" data-isk="${p}">${p ? '%' + p : 'İskontosuz'}</button>`).join('')}</div>
      <label>İskonto (₺, KDV hariç)<input id="iskonto" class="num" value="${N2(F.iskonto || 0)}" inputmode="decimal"></label>
      <label>Ödeme Şekli<select id="odemeSekli">${ODEME.map((x) => `<option${x === F.odemeSekli ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
    </section>
    <section class="card" aria-label="Tahsilatlar"><div class="ch"><h2>Tahsilatlar</h2><button class="btn-g" type="button" id="addt">+ Tahsilat ekle</button></div><div class="list" id="tahs"></div></section>
    <section class="card" aria-label="Kumaş metraj hesabı"><h2>Kumaş Metraj Hesabı</h2><span class="sm mut">Pencere eni ve pile sıklığına göre gereken kumaş.</span>
      <div class="g2"><label>Pencere eni (cm)<input id="cw" class="num" type="number" value="320" min="0"></label><label>Pile sıklığı<select id="cp"><option value="2">1:2</option><option value="2.5" selected>1:2,5</option><option value="3">1:3</option></select></label></div>
      <label>Kumaş (isteğe bağlı)<select id="ck"><option value="">Tül perde (fiyatı elle girin)</option>${kumas.map((k) => `<option value="${k.id}">${esc(k.ad)} · ${TL(k.satis)}</option>`).join('')}</select></label>
      <div class="calc"><span>Gereken kumaş</span><b id="cm"></b></div>
      <button class="btn-o" type="button" id="cadd">Faturaya ekle</button>
    </section>
  </aside></div>`;
  const pull = () => {
    F.satirlar = $$('#lines tr').map((tr) => { const i = +tr.dataset.i, o = { ...(tr._l || F.satirlar[i] || {}) }; $$('[data-f]', tr).forEach((x) => { o[x.dataset.f] = ['miktar', 'fiyat', 'kdv'].includes(x.dataset.f) ? num(x.value) : x.value.trim(); }); return o; });
    for (const k of ['musteri', 'tel', 'no', 'tarih', 'vade', 'faturaTipi', 'adres', 'montaj', 'montajSaat', 'odemeSekli']) F[k] = $('#' + k).value.trim();
    F.iskonto = num($('#iskonto').value); F.not = $('#not').value.trim();
    const as = $('#asama').value;
    F.durum = as === 'olcu' ? 'teklif' : as === 'teslim' ? 'teslim' : 'siparis';
    if (F.durum === 'siparis') F.asama = as;
    if (F.durum === 'teslim' && !F.teslimTarihi) F.teslimTarihi = today();
  };
  const refresh = () => {
    pull();
    $$('#lines tr').forEach((tr, i) => { const l = F.satirlar[i]; $('[data-t]', tr).textContent = TL(num(l.miktar) * num(l.fiyat)); });
    $('#nolines').hidden = F.satirlar.length > 0;
    const c = calcSatis(F);
    const pct = c.ara ? Math.round((c.isk / c.ara) * 100) : 0;
    $('#tot').innerHTML = `<div><span>Ara Toplam</span><span class="num">${TL(c.ara)}</span></div><div><span>İskonto${pct ? ` (%${pct})` : ''}</span><span class="num">−${TL(c.isk)}</span></div><div><span>KDV</span><span class="num">${TL(c.kdv)}</span></div><div class="g"><span>Genel Toplam</span><span class="num">${TL(c.toplam)}</span></div>${F.durum !== 'teklif' ? `<div><span>Tahsil edilen</span><span class="num">${TL(c.tahsil)}</span></div><div><span>Kalan</span><span class="num" style="font-weight:700">${TL(c.kalan)}</span></div>` : ''}${c.maliyet ? `<div><span>Tahmini kâr</span><span class="num">${TL(c.kar)}</span></div>` : ''}`;
    $$('[data-isk]', m).forEach((b) => b.setAttribute('aria-pressed', String(c.ara ? Math.abs(c.isk - (c.ara * +b.dataset.isk) / 100) < 0.01 : +b.dataset.isk === 0)));
    $('#tahs').innerHTML = F.tahsilat.map((x, i) => `<div><div class="t"><b class="num">${TL(x.tutar)}</b><span>${fmtDate(x.tarih)} · ${esc(x.hesap || H0())}${x.not ? ' · ' + esc(x.not) : ''}</span></div><button class="btn-g danger" type="button" data-tx="${i}">Sil</button></div>`).join('') || '<p class="empty">Tahsilat yok.</p>';
    $$('[data-tx]', m).forEach((b) => (b.onclick = () => { F.tahsilat.splice(+b.dataset.tx, 1); refresh(); }));
    const cw = num($('#cw').value), cp = parseFloat($('#cp').value);
    $('#cm').textContent = `${(Math.ceil((cw / 100) * cp * 10) / 10).toLocaleString('tr-TR')} m`;
  };
  const addLine = (l) => { pull(); F.satirlar.push(l); $('#lines').insertAdjacentHTML('beforeend', lineRow(l, F.satirlar.length - 1)); refresh(); };
  m.oninput = (e) => { if (e.target.closest('.card')) refresh(); };
  m.onchange = (e) => {
    if (e.target.matches('[data-f="ad"]')) {
      const k = S.kalemler.find((x) => x.ad === e.target.value), tr = e.target.closest('tr');
      if (k) { const i = +tr.dataset.i; pull(); Object.assign(F.satirlar[i], { kalemId: k.id, tur: k.tur || 'urun', birim: k.birim || 'adet', fiyat: num(k.satis), alis: num(k.alis), kdv: num(k.kdv ?? ayar().kdv) }); const set = (f, v) => { const x = $(`[data-f="${f}"]`, tr); if (x) x.value = v; }; set('birim', k.birim || 'adet'); set('fiyat', N2(k.satis)); set('kdv', String(num(k.kdv ?? ayar().kdv))); tr._l = F.satirlar[i]; }
    }
    if (e.target.id === 'musteri') { const o = cl.find((c) => c.ad === e.target.value); if (o) { if (!$('#tel').value) $('#tel').value = o.tel || ''; if (!$('#adres').value) $('#adres').value = o.adres || ''; } }
    refresh();
  };
  $('#lines').onclick = (e) => { const b = e.target.closest('[data-x]'); if (!b) return; pull(); const i = +b.closest('tr').dataset.i; F.satirlar.splice(i, 1); $('#lines').innerHTML = F.satirlar.map(lineRow).join(''); refresh(); };
  $('#addl').onclick = () => addLine({ ad: '', miktar: 1, birim: 'adet', fiyat: 0, kdv: num(ayar().kdv), tur: 'urun' });
  $$('[data-isk]', m).forEach((b) => (b.onclick = () => { pull(); const c = calcSatis({ ...F, iskonto: 0 }); $('#iskonto').value = N2(r2((c.ara * +b.dataset.isk) / 100)); refresh(); }));
  $('#addt').onclick = () => openDlg(`<h2>Tahsilat ekle</h2><div class="g2">${field('tt', 'Tutar (₺)', N2(Math.max(0, calcSatis(F).kalan)), 'text', 'inputmode="decimal" required')}${field('td', 'Tarih', today(), 'date', 'required')}${sel('th', 'Hesap', ayar().hesaplar.map((h) => [h, h]), H0())}${field('tn', 'Açıklama', '', 'text', 'placeholder="Kapora, kalan…"')}</div><p class="note">Tahsilat, faturayı kaydettiğinizde işlenir.</p>`,
    (f) => { const t = num(val(f, 'tt')); if (t <= 0) { toast('Tutar girin', true); return false; } F.tahsilat.push({ tarih: val(f, 'td'), tutar: t, hesap: val(f, 'th'), not: val(f, 'tn') }); refresh(); return true; }, null, 'Ekle', true);
  $('#cadd').onclick = () => { const cw = num($('#cw').value), cp = $('#cp').value, mt = Math.ceil((cw / 100) * parseFloat(cp) * 10) / 10, k = S.kalemler.find((x) => x.id === $('#ck').value);
    addLine({ ad: k ? k.ad : 'Tül Perde', detay: `${N2(cw)} cm en · 1:${cp.replace('.', ',')} pile`, miktar: mt, birim: 'm', fiyat: k ? num(k.satis) : 0, alis: k ? num(k.alis) : 0, kdv: num(k ? k.kdv ?? ayar().kdv : ayar().kdv), kalemId: k ? k.id : '', tur: 'urun' }); };
  const kaydet = async (durum) => {
    pull();
    if (!F.musteri) { toast('Cari (müşteri) adını girin', true); $('#musteri').focus(); return; }
    if (durum) { F.durum = durum; if (durum === 'siparis' && !F.asama) F.asama = 'onay'; }
    F.satirlar = F.satirlar.filter((l) => l.ad || num(l.fiyat));
    const d = await save('satislar', { ...F });
    if (d) { if (!orig) location.hash = '#fatura/' + d.id; else route(); }
  };
  $('#fdraft').onclick = () => kaydet('teklif');
  $('#fok').onclick = () => kaydet(F.durum === 'teklif' && $('#asama').value === 'olcu' ? 'siparis' : null);
  $('#fpr').onclick = () => { pull(); printSatis(F); };
  if ($('#fdel')) armBtn($('#fdel'), `${F.no} numaralı fatura ve tahsilatları silinecek. Bu işlem geri alınamaz.`, async () => { if (await remove('satislar', F.id)) location.hash = '#faturalar'; });
  refresh();
};

/* ---------------- ALIŞ FATURALARI ---------------- */
let aTab = '';
VIEWS.alislar = (m) => {
  const t = today(), ym = ymOf(t), R = calcAy(ym);
  const ayA = S.alislar.filter((a) => ymOf(a.tarih) === ym);
  const acik = S.alislar.filter((a) => calcAlis(a).kalan > 0.009).sort((a, b) => String(a.vade || a.tarih).localeCompare(b.vade || b.tarih));
  const odenecek = acik.reduce((s, a) => s + calcAlis(a).kalan, 0);
  const list = [...S.alislar].filter((a) => !aTab || alisDurum(a, t).k === aTab).sort((a, b) => String(b.tarih).localeCompare(a.tarih));
  m.innerHTML = ph('Alış Faturaları', 'Tedarikçilerden gelen kumaş, aksesuar ve hizmet faturaları', `<button class="btn" type="button" id="new">${ICON_PLUS}Alış Faturası Gir</button>`)
  + `<section class="kpis">${kpiBox('Bu Ay Alış', TL0(R.alisToplam), `${ayA.length} fatura · KDV dahil`)}${kpiBox('Ödenecek', TL0(odenecek), acik[0] ? `En yakın vade ${acik[0].vade ? dayMon(acik[0].vade) : 'belirtilmemiş'}` : 'Açık borç yok', acik.some((a) => alisDurum(a, t).k === 'gecikti') ? 'bad' : '')}${kpiBox('İndirilecek KDV', TL0(R.alisKdv + R.giderKdv), `${AYLAR[+ym.slice(5) - 1]} dönemi · alış ve giderler`)}</section>
  <div class="split"><section class="card w2"><div class="tabs" role="group" aria-label="Durum">${[['', 'Tümü'], ['odenecek', 'Ödenecek'], ['gecikti', 'Gecikti'], ['odendi', 'Ödendi']].map(([k, l]) => `<button type="button" data-t="${k}" aria-pressed="${aTab === k}">${l}</button>`).join('')}</div>
    <div class="tw"><table style="min-width:640px"><thead><tr><th>Belge No</th><th>Tedarikçi</th><th>Kategori</th><th>Vade</th><th class="r">Tutar</th><th>Durum</th></tr></thead><tbody>${list.map((a) => `<tr class="click" data-e="${a.id}"><td class="num sm">${esc(a.faturaNo || '—')}<br><span class="xs mut">${fmtDate(a.tarih)}</span></td><td style="font-weight:500">${esc(a.tedarikci)}</td><td class="mut">${esc(a.kategori || a.aciklama || '')}</td><td class="mut">${a.vade ? fmtDate(a.vade) : '—'}</td><td class="r num" style="font-weight:600">${TL0(calcAlis(a).toplam)}</td><td>${pill(alisDurum(a, t))}</td></tr>`).join('') || emptyRow(6, 'Kayıt yok.')}</tbody></table></div></section>
    <aside class="card w1"><h2>Ödeme Takvimi</h2><div class="list">${acik.slice(0, 8).map((a) => { const d = a.vade || a.tarih; return `<div><span style="display:flex;gap:12px;align-items:center;min-width:0"><span style="width:44px;text-align:center;flex:none"><b class="num" style="display:block;font-size:18px">${+d.slice(8)}</b><span class="xs mut">${AY3[+d.slice(5, 7) - 1]}</span></span><span class="t"><b>${esc(a.tedarikci)}</b><span>${esc(a.faturaNo || '')}${alisDurum(a, t).k === 'gecikti' ? ' · <span style="color:var(--bad-t)">gecikti</span>' : ''}</span></span></span><span style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="num" style="font-weight:600">${TL0(calcAlis(a).kalan)}</span><button class="btn-g" type="button" data-pay="${esc(a.tedarikci)}" style="height:24px;padding:0">Ödeme Yap</button></span></div>`; }).join('') || '<p class="empty">Ödenecek fatura yok.</p>'}</div></aside></div>`;
  $$('[data-t]', m).forEach((b) => (b.onclick = () => { aTab = b.dataset.t; route(); }));
  $('#new').onclick = () => editAlis({ tarih: today(), kdvOran: ayar().kdv });
  $$('[data-e]', m).forEach((r) => (r.onclick = () => editAlis(structuredClone(S.alislar.find((d) => d.id === r.dataset.e)))));
  $$('[data-pay]', m).forEach((b) => (b.onclick = () => { const o = cariler().find((c) => c.key === tKey(b.dataset.pay)); if (o) tahsilatDlg(o); }));
};
function editAlis(d) {
  const yeni = !d.id;
  const stokKs = S.kalemler.filter((k) => k.stok).sort((a, b) => String(a.ad).localeCompare(b.ad, 'tr'));
  const sRow = (x) => `<div class="row" data-sr><select data-sk aria-label="Kalem" style="flex:2 1 200px"><option value="">Kalem seç…</option>${stokKs.map((k) => `<option value="${k.id}"${k.id === x.kalemId ? ' selected' : ''}>${esc(k.ad)} (${esc(k.birim)})</option>`).join('')}</select><input data-sm class="num" value="${N2(x.miktar || 0)}" inputmode="decimal" aria-label="Miktar" style="flex:1 1 90px"><button type="button" class="btn-g danger" data-sx>Sil</button></div>`;
  const oRow = (o) => `<div class="row" data-or><input type="date" data-of="tarih" value="${esc(o.tarih)}" aria-label="Tarih" style="flex:1 1 140px"><input data-of="tutar" class="num" value="${N2(o.tutar)}" inputmode="decimal" aria-label="Tutar" style="flex:1 1 110px"><select data-of="hesap" aria-label="Hesap" style="flex:1 1 140px">${hesapOpts(o.hesap)}</select><button type="button" class="btn-g danger" data-ox>Sil</button></div>`;
  const tedler = [...new Set([...S.alislar.map((a) => a.tedarikci), ...S.cariler.filter((c) => c.tur === 'tedarikci').map((c) => c.ad)].filter(Boolean))];
  openDlg(`<h2>${yeni ? 'Alış faturası gir' : 'Alış faturası'}</h2><div class="g2">${field('tedarikci', 'Tedarikçi', d.tedarikci, 'text', 'required list="tlist" autocomplete="off"')}${field('faturaNo', 'Belge no', d.faturaNo)}
    ${field('tarih', 'Fatura tarihi', d.tarih, 'date', 'required')}${field('vade', 'Vade (son ödeme)', d.vade, 'date')}${sel('kategori', 'Kategori', [['', '—'], ...ALIS_KAT.map((k) => [k, k])], d.kategori || '')}${field('aciklama', 'Açıklama', d.aciklama)}
    ${field('matrah', 'Tutar (KDV hariç, ₺)', N2(d.matrah || 0), 'text', 'inputmode="decimal" required')}${sel('kdvOran', 'KDV', [20, 10, 1, 0].map((k) => [k, '%' + k]), num(d.kdvOran ?? ayar().kdv))}</div>
    <datalist id="tlist">${tedler.map((t) => `<option value="${esc(t)}">`).join('')}</datalist>
    <div class="sumbox" id="ks"></div>
    <h3>Ödemeler</h3>${yeni ? `<label class="chk"><input type="checkbox" id="pesin"> Peşin ödendi</label><div id="pesinH" hidden>${sel('pesinHesap', 'Ödenen hesap', ayar().hesaplar.map((h) => [h, h]), H0())}</div>` : ''}
    <div id="ods" class="form">${(yeni ? [] : alisOdemeler(d)).map(oRow).join('')}</div><div><button type="button" class="btn-g" id="addo">+ Ödeme ekle</button></div>
    <h3>Stoğa giren kalemler</h3>${stokKs.length ? `<div id="sks" class="form">${(d.stok || []).map(sRow).join('')}</div><div><button type="button" class="btn-g" id="adds">+ Stok satırı</button></div>` : '<p class="note">Stok takibi açık ürün yok.</p>'}`,
  (f) => {
    const c = calcKdvli({ matrah: val(f, 'matrah'), kdvOran: val(f, 'kdvOran') });
    let odemeler = $$('[data-or]').map((r) => ({ tarih: $('[data-of="tarih"]', r).value, tutar: num($('[data-of="tutar"]', r).value), hesap: $('[data-of="hesap"]', r).value })).filter((o) => o.tutar);
    if (yeni && $('#pesin').checked) odemeler = [{ tarih: val(f, 'tarih'), tutar: c.toplam, hesap: $('#pesinHesap').value }];
    const stok = $$('[data-sr]').map((r) => ({ kalemId: $('[data-sk]', r).value, miktar: num($('[data-sm]', r).value) })).filter((x) => x.kalemId && x.miktar);
    return save('alislar', { ...d, tarih: val(f, 'tarih'), tedarikci: val(f, 'tedarikci'), faturaNo: val(f, 'faturaNo'), kategori: val(f, 'kategori'), aciklama: val(f, 'aciklama'), matrah: num(val(f, 'matrah')), kdvOran: num(val(f, 'kdvOran')), vade: val(f, 'vade'), odemeler, stok });
  },
  d.id ? () => remove('alislar', d.id) : null);
  const upd = () => {
    const c = calcKdvli({ matrah: $('#matrah').value, kdvOran: $('#kdvOran').value });
    const od = yeni && $('#pesin').checked ? c.toplam : $$('[data-of="tutar"]').reduce((a, i) => a + num(i.value), 0);
    $('#ks').innerHTML = `<span>KDV</span><b>${TL(c.kdv)}</b><span>Toplam</span><b>${TL(c.toplam)}</b><span>Ödenen</span><b>${TL(od)}</b><span>Kalan borç</span><b>${TL(c.toplam - od)}</b>`;
  };
  $('#dlg-form').oninput = upd; $('#dlg-form').onchange = upd;
  if (yeni) $('#pesin').onchange = (e) => { $('#pesinH').hidden = !e.target.checked; $('#ods').hidden = e.target.checked; $('#addo').hidden = e.target.checked; upd(); };
  $('#addo').onclick = () => { const c = calcKdvli({ matrah: $('#matrah').value, kdvOran: $('#kdvOran').value }); const od = $$('[data-of="tutar"]').reduce((a, i) => a + num(i.value), 0); $('#ods').insertAdjacentHTML('beforeend', oRow({ tarih: today(), tutar: Math.max(0, r2(c.toplam - od)) })); upd(); };
  $('#ods').onclick = (e) => { if (e.target.matches('[data-ox]')) { e.target.closest('[data-or]').remove(); upd(); } };
  if ($('#adds')) { $('#adds').onclick = () => $('#sks').insertAdjacentHTML('beforeend', sRow({})); $('#sks').onclick = (e) => { if (e.target.matches('[data-sx]')) e.target.closest('[data-sr]').remove(); }; }
  upd();
}

/* ---------------- CARİ HESAPLAR ---------------- */
let cTab = 'all', cSel = '', cQ = '';
VIEWS.cariler = (m) => {
  const all = cariler();
  const alacak = all.filter((c) => c.tur === 'musteri').reduce((s, c) => s + c.bakiye, 0);
  const borc = all.filter((c) => c.tur === 'tedarikci').reduce((s, c) => s + c.bakiye, 0);
  const gec = all.reduce((s, c) => s + c.gecikmis, 0);
  const draw = () => {
    const q = cQ.toLocaleLowerCase('tr');
    const rows = all.filter((c) => (cTab === 'all' || (cTab === 'acik' ? c.bakiye > 0.009 : c.tur === cTab)) && (!q || `${c.ad} ${c.tel}`.toLocaleLowerCase('tr').includes(q)));
    if (!all.find((c) => c.key === cSel)) cSel = (rows[0] || {}).key || '';
    $('#cb').innerHTML = rows.map((c) => `<tr class="click${c.key === cSel ? ' on' : ''}" data-k="${esc(c.key)}"><td><button class="cn" type="button"><span class="av">${esc(initials(c.ad))}</span><span><b>${esc(c.ad)}</b><small>${esc(c.tel || '—')}</small></span></button></td><td class="mut">${c.tur === 'musteri' ? 'Müşteri' : 'Tedarikçi'}</td><td class="mut">${c.son ? fmtDate(c.son) : '—'}</td><td class="r"><span class="bal${c.gecikmis > 0.009 ? ' neg' : ''}">${c.bakiye > 0.009 ? TL0(c.bakiye) : '₺0'}</span>${c.bakiye > 0.009 ? `<br><span class="xs mut">${c.tur === 'musteri' ? 'alacak' : 'borç'}</span>` : ''}</td></tr>`).join('') || emptyRow(4, 'Cari yok.');
    $$('[data-k]', m).forEach((r) => (r.onclick = () => { cSel = r.dataset.k; draw(); }));
    const o = all.find((c) => c.key === cSel);
    const box = $('#ext');
    if (!o) { box.innerHTML = '<p class="empty">Soldan bir cari seçin.</p>'; return; }
    let run = 0;
    const mv = ekstre(o).map((x) => ({ ...x, bak: (run = r2(run + (o.tur === 'musteri' ? x.borc - x.alacak : x.alacak - x.borc))) }));
    const wa = o.tur === 'musteri' && o.bakiye > 0.009 ? waLink(o.tel, `Merhaba ${o.ad},\n${ayar().firma} cari hesap özetiniz:\n${o.satislar.filter((s) => s.durum !== 'teklif' && calcSatis(s).kalan > 0.009).map((s) => `• ${s.no} (${fmtDate(s.tarih)}): kalan ${TL(calcSatis(s).kalan)}`).join('\n')}\n\nToplam açık bakiye: ${TL(o.bakiye)}\nTeşekkür ederiz.\n${ayar().firma} · ${ayar().tel}`) : '';
    box.innerHTML = `<span class="xs mut" style="text-transform:uppercase;letter-spacing:.04em;font-weight:600">Cari Ekstresi</span><div class="ch"><div><h2>${esc(o.ad)}</h2><span class="sm mut">${o.tur === 'musteri' ? 'Müşteri' : 'Tedarikçi'} · ${esc(o.tel || 'telefon yok')}</span></div><span class="bal${o.gecikmis > 0.009 ? ' neg' : ''}" style="font-size:22px">${TL(o.bakiye)}</span></div>
      <div class="row"><button class="btn" type="button" id="ctah"${o.bakiye > 0.009 ? '' : ' disabled'}>${o.tur === 'musteri' ? 'Tahsilat Al' : 'Ödeme Yap'}</button>${o.tur === 'musteri' ? (wa ? `<a class="btn-o" href="${esc(wa)}" target="_blank" rel="noopener">Ekstre Gönder</a>` : `<span class="btn-o" style="opacity:.5" title="${o.bakiye > 0.009 ? 'Telefon numarası girin' : 'Açık bakiye yok'}">Ekstre Gönder</span>`) : ''}<button class="btn-g" type="button" id="cedit">${o.doc ? 'Düzenle' : 'Bilgileri kaydet'}</button></div>
      <div class="tw stmt"><table><thead><tr><th>Tarih</th><th>İşlem</th><th class="r">Borç</th><th class="r">Alacak</th><th class="r">Bakiye</th></tr></thead><tbody>${mv.reverse().map((x) => `<tr${x.satis ? ` class="click" data-go="#fatura/${x.satis}"` : x.alis ? ` class="click" data-ae="${x.alis}"` : ''}><td class="mut">${fmtDate(x.tarih)}</td><td>${esc(x.acik)}</td><td class="r num">${x.borc ? TL0(x.borc) : ''}</td><td class="r num">${x.alacak ? TL0(x.alacak) : ''}</td><td class="r num">${TL0(x.bak)}</td></tr>`).join('') || emptyRow(5, 'Hareket yok.')}</tbody></table></div>`;
    if (!$('#ctah').disabled) $('#ctah').onclick = () => tahsilatDlg(o);
    $('#cedit').onclick = () => editCari(o.doc ? structuredClone(o.doc) : { ad: o.ad, tur: o.tur, tel: o.tel, adres: o.adres });
    $$('[data-go]', box).forEach((r) => (r.onclick = () => (location.hash = r.dataset.go)));
    $$('[data-ae]', box).forEach((r) => (r.onclick = () => editAlis(structuredClone(S.alislar.find((a) => a.id === r.dataset.ae)))));
  };
  m.innerHTML = ph('Cari Hesaplar', 'Müşteri ve tedarikçi bakiyeleri', `<button class="btn-o" type="button" id="cx">Excel'e Aktar</button><button class="btn" type="button" id="cn">${ICON_PLUS}Yeni Cari</button>`)
  + `<section class="kpis">${kpiBox('Toplam Alacak (müşterilerden)', TL0(alacak))}${kpiBox('Toplam Borç (tedarikçilere)', TL0(borc))}${kpiBox('Vadesi Geçmiş', TL0(gec), gec > 0.009 ? 'Alacak ve borçlarda' : 'Yok', gec > 0.009 ? 'bad' : '')}</section>
  <div class="split"><section class="card w2"><div class="ch"><div class="tabs" role="group" aria-label="Tür">${[['all', 'Tümü'], ['musteri', 'Müşteriler'], ['tedarikci', 'Tedarikçiler'], ['acik', 'Bakiyesi olan']].map(([k, l]) => `<button type="button" data-ct="${k}" aria-pressed="${cTab === k}">${l}</button>`).join('')}</div><label class="search" style="min-width:200px">${ICON_SEARCH}<span class="sr">Cari ara</span><input id="cq" type="search" placeholder="Cari ara" value="${esc(cQ)}"></label></div>
    <div class="tw"><table style="min-width:520px"><thead><tr><th>Cari</th><th>Tür</th><th>Son İşlem</th><th class="r">Bakiye</th></tr></thead><tbody id="cb"></tbody></table></div></section>
    <aside class="card w1" id="ext"></aside></div>`;
  $$('[data-ct]', m).forEach((b) => (b.onclick = () => { cTab = b.dataset.ct; $$('[data-ct]', m).forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); }));
  $('#cq').oninput = (e) => { cQ = e.target.value; draw(); };
  $('#cn').onclick = () => editCari();
  $('#cx').onclick = () => download(makeXlsx([{ name: 'Cariler', cols: [{ h: 'Cari', t: 's', w: 30 }, { h: 'Tür', t: 's', w: 12 }, { h: 'Telefon', t: 's', w: 16 }, { h: 'Adres', t: 's', w: 36 }, { h: 'Son işlem', t: 'd', w: 12 }, { h: 'Bakiye', t: 'n', w: 14 }, { h: 'Vadesi geçmiş', t: 'n', w: 14 }],
    rows: all.map((c) => [c.ad, c.tur === 'musteri' ? 'Müşteri' : 'Tedarikçi', c.tel, c.adres, c.son, c.bakiye, c.gecikmis]) }]), `beyperde-cariler-${today()}.xlsx`);
  draw();
};

/* ---------------- STOK VE KUMAŞ ---------------- */
let sTur = '', sQ = '', sLimit = 60;
const kalemKullanimda = (id) => S.satislar.some((x) => (x.satirlar || []).some((l) => l.kalemId === id)) || S.alislar.some((a) => (a.stok || []).some((x) => x.kalemId === id));
async function kalemleriSil(ids) {
  const sil = ids.filter((id) => !kalemKullanimda(id)), kalan = ids.length - sil.length;
  if (!sil.length) { toast('Seçilen ürünler satış ya da alış kayıtlarında kullanıldığı için silinemez', true); return; }
  const r = await api({ a: 'bulkdel', col: 'kalemler', ids: sil, confirm: 'TOPLU_SIL' });
  if (!r.ok) { toast(r.error === 'session' ? 'Oturum süresi doldu, yeniden giriş yapın.' : 'Silinemedi: ' + r.error, true); return; }
  const set = new Set(sil); S.kalemler = S.kalemler.filter((k) => !set.has(k.id));
  toast(`${sil.length} ürün silindi${kalan ? `, ${kalan} ürün kayıtlarda kullanıldığı için bırakıldı` : ''}`);
  route();
}
function editKalem(k) {
  openDlg(`<h2>${k.id ? 'Ürünü düzenle' : 'Yeni ürün / hizmet'}</h2><div class="g2">${field('ad', 'Ad', k.ad, 'text', 'required')}${field('kod', 'Kod', k.kod)}
    ${sel('tur', 'Tür', Object.entries(TUR), k.tur || 'urun')}${field('birim', 'Birim (m, m², adet…)', k.birim)}
    ${field('alis', 'Alış fiyatı (KDV hariç)', N2(k.alis || 0), 'text', 'inputmode="decimal"')}${field('satis', 'Satış fiyatı (KDV hariç)', N2(k.satis || 0), 'text', 'inputmode="decimal"')}
    ${sel('kdv', 'KDV', [20, 10, 1, 0].map((x) => [x, '%' + x]), num(k.kdv ?? ayar().kdv))}${field('tedarikci', 'Tedarikçi', k.tedarikci || '')}</div>
    <label class="chk"><input type="checkbox" id="stok" ${k.stok ? 'checked' : ''}> Stoğunu takip et</label>
    <div class="g2">${sel('stokTur', 'Stok türü', [['', '—'], ...Object.entries(STOK_TUR)], k.stokTur || '')}${field('acilisStok', 'Başlangıç stoğu', N2(k.acilisStok || 0), 'text', 'inputmode="decimal"')}${field('kritik', 'Minimum (uyarı seviyesi)', N2(k.kritik || 0), 'text', 'inputmode="decimal"')}</div>
    ${k.dovizFiyat || k.en || k.kategori ? `<p class="note">${[k.kategori, k.dovizFiyat ? `liste fiyatı ${N2(k.dovizFiyat)} ${k.doviz || ''}` : '', k.en ? `en ${k.en} cm` : '', k.durum].filter(Boolean).map(esc).join(' · ')}</p>` : ''}`,
  (f) => save('kalemler', { ...k, kod: val(f, 'kod'), ad: val(f, 'ad'), tur: val(f, 'tur'), birim: val(f, 'birim'), alis: num(val(f, 'alis')), satis: num(val(f, 'satis')), kdv: num(val(f, 'kdv')), stok: $('#stok').checked, stokTur: val(f, 'stokTur'), tedarikci: val(f, 'tedarikci'), acilisStok: num(val(f, 'acilisStok')), kritik: num(val(f, 'kritik')) }),
  k.id ? async () => { if (kalemKullanimda(k.id)) { toast('Bu ürün satış ya da alış kayıtlarında kullanılıyor; silinemez', true); return false; } return remove('kalemler', k.id); } : null);
}
function stokIslem(mode, k) {   // mode: 'sayim' | 'giris'
  const ks = S.kalemler.filter((x) => x.stok).sort((a, b) => String(a.ad).localeCompare(b.ad, 'tr'));
  openDlg(`<h2>${mode === 'sayim' ? 'Sayım gir' : 'Stok girişi'}</h2>
    ${sel('kid', 'Ürün', ks.map((x) => [x.id, `${x.ad} (${x.birim || ''})`]), k ? k.id : (ks[0] || {}).id)}
    <p class="note" id="cur"></p>
    <div class="g2">${mode === 'sayim' ? field('mk', 'Depoda sayılan miktar', '', 'text', 'inputmode="decimal" required') : `${field('mk', 'Giren miktar', '', 'text', 'inputmode="decimal" required')}${field('tr', 'Tarih', today(), 'date')}`}</div>
    ${mode === 'giris' ? `${field('nt', 'Açıklama', '', 'text', 'placeholder="Faturasız giriş, iade, devir…"')}<p class="note">Faturalı alımları "Alış Faturaları" ekranından girin; stok oradan da artar.</p>` : ''}`,
  (f) => {
    const x = S.kalemler.find((y) => y.id === val(f, 'kid')); if (!x) return false;
    const v = num(val(f, 'mk'));
    if (mode === 'sayim') return save('kalemler', { ...x, duzeltme: r2(num(x.duzeltme) + v - stokOf(x).mevcut), sonSayim: today() });
    if (!v) { toast('Miktar girin', true); return false; }
    return save('kalemler', { ...x, girisler: [...(x.girisler || []), { tarih: val(f, 'tr') || today(), miktar: v, not: val(f, 'nt') }] });
  }, null, mode === 'sayim' ? 'Sayımı kaydet' : 'Girişi kaydet');
  const show = () => { const x = S.kalemler.find((y) => y.id === $('#kid').value); $('#cur').textContent = x ? `Sistemdeki miktar: ${N2(stokOf(x).mevcut)} ${x.birim || ''}` : ''; };
  $('#kid').onchange = show; show();
}
VIEWS.stok = (m) => {
  const stoklu = S.kalemler.filter((k) => k.stok);
  const deger = stoklu.reduce((s, k) => s + Math.max(0, stokOf(k).mevcut) * num(k.alis), 0);
  const kumasM = stoklu.filter((k) => k.stokTur === 'kumas').reduce((s, k) => s + Math.max(0, stokOf(k).mevcut), 0);
  const low = (k) => num(k.kritik) > 0 && stokOf(k).mevcut <= num(k.kritik);
  const kritikN = stoklu.filter(low).length;
  const tabs = [['', 'Tümü', stoklu.length], ...Object.entries(STOK_TUR).map(([v, t]) => [v, t, stoklu.filter((k) => k.stokTur === v).length]), ['_hizmet', 'Stoksuz kalemler', S.kalemler.filter((k) => !k.stok).length]];
  m.innerHTML = ph('Stok ve Kumaş', 'Kumaş metrajı, aksesuar ve mekanik ürünler', `<button class="btn-o" type="button" id="fl">Fiyat listesi yükle</button><button class="btn-o" type="button" id="sy">Sayım Yap</button><button class="btn-o" type="button" id="sg">${ICON_PLUS}Stok Girişi</button><button class="btn" type="button" id="sn">${ICON_PLUS}Yeni Ürün</button>`)
  + `<section class="kpis">${kpiBox('Stok Değeri (alış)', TL0(deger), `${stoklu.length} ürün`)}${kpiBox('Kumaş Toplamı', `${Math.round(kumasM).toLocaleString('tr-TR')} m`, 'Kumaş türündeki ürünler')}${kpiBox('Kritik Seviyede', `${kritikN} ürün`, kritikN ? 'Minimumun altında' : 'Hepsi yeterli', kritikN ? 'warn' : '')}</section>
  <section class="card"><div class="ch"><div class="seg" role="group" aria-label="Kategori">${tabs.map(([v, t, n]) => `<button type="button" data-st="${v}" aria-pressed="${sTur === v}">${t} (${n})</button>`).join('')}</div><label class="search" style="min-width:220px">${ICON_SEARCH}<span class="sr">Ürün ara</span><input id="sq" type="search" placeholder="Ürün ya da kod ara" value="${esc(sQ)}"></label></div>
    <div class="row sm"><label class="chk" style="font-size:13px"><input type="checkbox" id="selall"> Görünenlerin tümünü seç</label><span class="mut" id="selc">0 seçili</span><button class="btn-sm danger" type="button" id="selsil" disabled>Seçilenleri sil</button></div>
    <div class="sgrid" id="sgrid"></div><div id="more"></div></section>`;
  const draw = () => {
    const q = sQ.toLocaleLowerCase('tr');
    const list = (sTur === '_hizmet' ? S.kalemler.filter((k) => !k.stok) : stoklu.filter((k) => !sTur || k.stokTur === sTur)).filter((k) => !q || `${k.kod} ${k.ad} ${k.tedarikci}`.toLocaleLowerCase('tr').includes(q))
      .sort((a, b) => (low(b) - low(a)) || String(a.ad).localeCompare(b.ad, 'tr'));
    $('#sgrid').innerHTML = list.slice(0, sLimit).map((k) => { const s = stokOf(k), lw = k.stok && low(k), u = esc(k.birim || '');
      return `<article class="sc${lw ? ' low' : ''}"><input type="checkbox" class="ck" data-sel="${k.id}" aria-label="${esc(k.ad)} seç"><div class="top"><div class="sw" aria-hidden="true">${esc(initials(k.ad))}</div><div class="nm"><b>${esc(k.ad)}</b><span>${[k.kod, STOK_TUR[k.stokTur] || TUR[k.tur], k.tedarikci].filter(Boolean).map(esc).join(' · ')}</span></div></div>
      ${k.stok ? `<div class="q"><b>${N2(s.mevcut)} ${u}</b><span>${num(k.kritik) ? `min. ${N2(k.kritik)} ${u}` : 'min. girilmemiş'}</span></div><div class="meter${lw ? '' : ' tl'}"><i style="width:${Math.max(2, Math.min(100, num(k.kritik) ? (s.mevcut / (num(k.kritik) * 3)) * 100 : s.mevcut > 0 ? 100 : 0))}%"></i></div>` : ''}
      <div class="pr"><span>Alış <b>${TL(k.alis)}${u ? '/' + u : ''}</b></span><span>Satış <b>${TL(k.satis)}${u ? '/' + u : ''}</b></span></div>
      <div class="act">${k.stok ? `<button class="btn-sm" type="button" data-say="${k.id}">Sayım</button><button class="btn-sm" type="button" data-gir="${k.id}">Giriş</button>` : ''}<button class="btn-sm" type="button" data-ed="${k.id}">Düzenle</button><button class="btn-sm danger" type="button" data-sil="${k.id}">Sil</button></div></article>`; }).join('') || `<p class="empty">${S.kalemler.length ? 'Uyan ürün yok.' : 'Henüz ürün yok. "Fiyat listesi yükle" ya da "Yeni Ürün" ile ekleyin.'}</p>`;
    $('#more').innerHTML = list.length > sLimit ? `<button class="btn-o" type="button" id="mb" style="width:100%">Daha fazla göster (${list.length - sLimit} ürün daha)</button>` : '';
    if ($('#mb')) $('#mb').onclick = () => { sLimit += 120; draw(); };
    $('#selall').checked = false; guncelle();
    $$('[data-say]', m).forEach((b) => (b.onclick = () => stokIslem('sayim', S.kalemler.find((k) => k.id === b.dataset.say))));
    $$('[data-gir]', m).forEach((b) => (b.onclick = () => stokIslem('giris', S.kalemler.find((k) => k.id === b.dataset.gir))));
    $$('[data-ed]', m).forEach((b) => (b.onclick = () => editKalem(structuredClone(S.kalemler.find((k) => k.id === b.dataset.ed)))));
    $$('[data-sil]', m).forEach((b) => armBtn(b, () => `"${(S.kalemler.find((k) => k.id === b.dataset.sil) || {}).ad || 'Ürün'}" silinecek. Bu işlem geri alınamaz.`, () => kalemleriSil([b.dataset.sil])));
    $$('[data-sel]', m).forEach((c) => (c.onchange = guncelle));
  };
  const secili = () => $$('[data-sel]:checked', m).map((c) => c.dataset.sel);
  const guncelle = () => { const n = secili().length; $('#selc').textContent = `${n} seçili`; $('#selsil').disabled = !n; $('#selsil').textContent = n ? `Seçilen ${n} ürünü sil` : 'Seçilenleri sil'; };
  $('#selall').onchange = (e) => { $$('[data-sel]', m).forEach((c) => (c.checked = e.target.checked)); guncelle(); };
  armBtn($('#selsil'), () => `Seçilen ${secili().length} ürün silinecek. Bu işlem geri alınamaz.`, () => kalemleriSil(secili()));
  $$('[data-st]', m).forEach((b) => (b.onclick = () => { sTur = b.dataset.st; sLimit = 60; $$('[data-st]', m).forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); }));
  $('#sq').oninput = (e) => { sQ = e.target.value; sLimit = 60; draw(); };
  $('#fl').onclick = () => fiyatListesiYukle();
  $('#sy').onclick = () => stokIslem('sayim');
  $('#sg').onclick = () => stokIslem('giris');
  $('#sn').onclick = () => editKalem({ tur: 'urun', birim: 'm', kdv: ayar().kdv, stok: true, stokTur: sTur && sTur !== '_hizmet' ? sTur : '' });
  draw();
};

/* ---------------- KASA VE BANKA ---------------- */
let kSel = '', kPer = '7', kMode = 'in';
VIEWS.kasa = (m, arg) => {
  if (arg === 'tahsilat') kMode = 'in';
  const a = ayar(), hs = hareketler(), t = today();
  const bak = (h) => r2(num(a.acilis[h]) + hs.filter((x) => x.hesap === h).reduce((s, x) => s + x.tutar, 0));
  const top = a.hesaplar.reduce((s, h) => s + bak(h), 0);
  if (kSel && !a.hesaplar.includes(kSel)) kSel = '';
  const bugun = (h) => hs.filter((x) => x.hesap === h && x.tarih === t).reduce((s, x) => s + x.tutar, 0);
  const from = kPer === '7' ? addDays(t, -6) : kPer === 'ay' ? t.slice(0, 8) + '01' : '';
  const mv = hs.filter((x) => (!kSel || x.hesap === kSel) && (!from || x.tarih >= from)).reverse();
  const cl = cariler().filter((c) => c.bakiye > 0.009 && c.tur === (kMode === 'in' ? 'musteri' : 'tedarikci'));
  m.innerHTML = ph('Kasa ve Banka', `Toplam nakit varlık <b class="num" style="color:var(--ink)">${TL0(top)}</b>`, `<button class="btn-o" type="button" id="vir">Hesaplar Arası Virman</button><button class="btn-o" type="button" id="say">Gün Sonu Kasa Sayımı</button><button class="btn-g" type="button" id="hes">Hesapları düzenle</button>`)
  + `<section class="accs"><button class="acc" type="button" data-h="" aria-pressed="${!kSel}"><span class="hd">Tüm Hesaplar</span><span class="v">${TL0(top)}</span><small>${a.hesaplar.length} hesap</small></button>${a.hesaplar.map((h) => { const b = bugun(h); return `<button class="acc" type="button" data-h="${esc(h)}" aria-pressed="${kSel === h}"><span class="hd">${esc(h)}<span>${hesapTur(h)}</span></span><span class="v">${TL0(bak(h))}</span><small>${b ? `Bugün ${b > 0 ? '+' : ''}${TL0(b)}` : 'Bugün hareket yok'}</small></button>`; }).join('')}</section>
  <div class="split"><section class="card w2"><div class="ch"><h2>Hareketler — ${esc(kSel || 'Tüm Hesaplar')}</h2><div class="tabs" role="group" aria-label="Dönem">${[['7', 'Son 7 gün'], ['ay', 'Bu ay'], ['', 'Tümü']].map(([k, l]) => `<button type="button" data-p="${k}" aria-pressed="${kPer === k}">${l}</button>`).join('')}</div></div>
    <div>${mv.slice(0, 200).map((x) => `<div class="mv"><span class="sg ${x.tutar >= 0 ? 'in' : 'out'}" aria-hidden="true">${x.tutar >= 0 ? '+' : '−'}</span><span class="t"><b>${x.satis ? `<a href="#fatura/${x.satis}" style="color:inherit">${esc(x.acik)}</a>` : esc(x.acik)}</b><span>${fmtDate(x.tarih)} · ${esc(x.hesap)}</span></span><span class="a ${x.tutar >= 0 ? 'in' : 'out'}">${x.tutar >= 0 ? '+' : '−'}${TL(Math.abs(x.tutar))}</span>${x.virman ? `<button class="btn-g danger" type="button" data-vdel="${x.virman}">Sil</button>` : ''}</div>`).join('') || '<p class="empty">Bu dönemde hareket yok.</p>'}</div></section>
    <aside class="card w1"><h2>Hızlı Kayıt</h2><div class="tabs" role="group" aria-label="Kayıt türü"><button type="button" data-mo="in" aria-pressed="${kMode === 'in'}">Tahsilat</button><button type="button" data-mo="out" aria-pressed="${kMode === 'out'}">Ödeme</button></div>
      <form class="form" id="qf">${cl.length ? `<label>${kMode === 'in' ? 'Müşteri' : 'Tedarikçi'}<select id="qc">${cl.map((c) => `<option value="${esc(c.key)}">${esc(c.ad)} · ${TL0(c.bakiye)}</option>`).join('')}</select></label>
        <label>Hesap<select id="qh">${hesapOpts(kSel || H0())}</select></label><label>Tutar (₺)<input id="qt" class="num" inputmode="decimal" placeholder="0,00" required></label><label>Tarih<input id="qd" type="date" value="${t}"></label>${kMode === 'in' ? '<label>Açıklama<input id="qn" placeholder="Örn. kısmi tahsilat"></label>' : ''}
        <button class="btn" type="submit">${kMode === 'in' ? 'Tahsilatı Kaydet' : 'Ödemeyi Kaydet'}</button>` : `<p class="empty">${kMode === 'in' ? 'Açık alacağı olan müşteri yok.' : 'Açık borcu olan tedarikçi yok.'}</p>`}</form></aside></div>`;
  $$('[data-h]', m).forEach((b) => (b.onclick = () => { kSel = b.dataset.h; route(); }));
  $$('[data-p]', m).forEach((b) => (b.onclick = () => { kPer = b.dataset.p; route(); }));
  $$('[data-mo]', m).forEach((b) => (b.onclick = () => { kMode = b.dataset.mo; route(); }));
  $$('[data-vdel]', m).forEach((b) => armBtn(b, 'Bu virman kaydı silinecek. Bu işlem geri alınamaz.', async () => { if (await remove('virmanlar', b.dataset.vdel)) route(); }));
  if ($('#qc')) $('#qf').onsubmit = async (e) => { e.preventDefault(); const o = cariler().find((c) => c.key === $('#qc').value), tt = num($('#qt').value); if (!o || tt <= 0) { toast('Tutar girin', true); return; } if (await tahsilatUygula(o, tt, $('#qd').value || t, $('#qh').value, $('#qn') ? $('#qn').value.trim() : '')) route(); };
  $('#vir').onclick = () => openDlg(`<h2>Hesaplar arası virman</h2><div class="g2">${sel('kaynak', 'Çıkan hesap', a.hesaplar.map((h) => [h, h]), a.hesaplar[0])}${sel('hedef', 'Giren hesap', a.hesaplar.map((h) => [h, h]), a.hesaplar[a.hesaplar.length - 1])}${field('tutar', 'Tutar (₺)', '', 'text', 'inputmode="decimal" required')}${field('tarih', 'Tarih', t, 'date', 'required')}</div>${field('aciklama', 'Açıklama', '', 'text', 'placeholder="Bankaya yatırıldı"')}`,
    (f) => { if (val(f, 'kaynak') === val(f, 'hedef')) { toast('Hesaplar aynı olamaz', true); return false; } return save('virmanlar', { tarih: val(f, 'tarih'), kaynak: val(f, 'kaynak'), hedef: val(f, 'hedef'), tutar: num(val(f, 'tutar')), aciklama: val(f, 'aciklama') }); }, null, 'Virmanı kaydet');
  $('#say').onclick = () => {
    const kh = a.hesaplar.filter((h) => hesapTur(h) === 'Nakit'), hl = kh.length ? kh : a.hesaplar;
    openDlg(`<h2>Gün sonu kasa sayımı</h2>${sel('sh', 'Hesap', hl.map((h) => [h, h]), hl[0])}<p class="note" id="sk"></p>${field('ss', 'Sayılan tutar (₺)', '', 'text', 'inputmode="decimal" required')}${field('sn', 'Not', '', 'text', 'placeholder="Fark nedeni"')}<p class="note">Fark varsa bugünkü tarihle "sayım farkı" olarak işlenir.</p>`,
      async (f) => { const h = val(f, 'sh'), fark = r2(num(val(f, 'ss')) - bak(h)); if (Math.abs(fark) < 0.01) { toast('Kasa tutuyor, fark yok'); return true; } return saveAyar({ sayimlar: [...(a.sayimlar || []), { tarih: t, hesap: h, fark, not: val(f, 'sn') }] }).then((d) => { if (d) toast(`Sayım farkı işlendi: ${TL(fark)}`); return d; }); }, null, 'Sayımı kaydet');
    const sh = () => { $('#sk').textContent = `Sistemdeki bakiye: ${TL(bak($('#sh').value))}`; }; $('#sh').onchange = sh; sh();
  };
  $('#hes').onclick = () => {
    const used = new Set(hs.map((x) => x.hesap));
    const rowH = (h, v) => `<div class="row" data-hr><input data-hn value="${esc(h)}" aria-label="Hesap adı" style="flex:2 1 180px"${used.has(h) ? ' readonly title="Kayıtlarda kullanılan hesabın adı değiştirilemez"' : ''}><input data-hv class="num" value="${N2(v || 0)}" inputmode="decimal" aria-label="Açılış bakiyesi" style="flex:1 1 120px">${used.has(h) ? '<span class="xs mut" style="width:40px">kullanılıyor</span>' : '<button type="button" class="btn-g danger" data-hx>Sil</button>'}</div>`;
    openDlg(`<h2>Hesaplar</h2><p class="note">Hesap adı ve açılış bakiyesi (panelde kayıt başlamadan önceki tutar).</p><div class="form" id="hl">${a.hesaplar.map((h) => rowH(h, a.acilis[h])).join('')}</div><div><button class="btn-g" type="button" id="ha">+ Hesap ekle</button></div>`,
      () => { const rows = $$('[data-hr]').map((r) => [$('[data-hn]', r).value.trim(), num($('[data-hv]', r).value)]).filter(([n]) => n); if (!rows.length) { toast('En az bir hesap olmalı', true); return false; } if (new Set(rows.map((r) => r[0])).size !== rows.length) { toast('Hesap adları farklı olmalı', true); return false; } return saveAyar({ hesaplar: rows.map((r) => r[0]), acilis: Object.fromEntries(rows) }); }, null, 'Kaydet');
    $('#ha').onclick = () => $('#hl').insertAdjacentHTML('beforeend', rowH('', 0));
    $('#hl').onclick = (e) => { if (e.target.matches('[data-hx]')) e.target.closest('[data-hr]').remove(); };
  };
};

/* ---------------- GİDERLER ---------------- */
let gYM = '', gKat = '';
VIEWS.giderler = (m) => {
  const t = today();
  if (!gYM) gYM = ymOf(t);
  const ms = months();
  const list = S.giderler.filter((g) => ymOf(g.tarih) === gYM);
  const tot = list.reduce((s, g) => s + calcKdvli(g).toplam, 0);
  const kat = {}; list.forEach((g) => { const k = g.kategori || 'Diğer'; kat[k] = (kat[k] || 0) + calcKdvli(g).toplam; });
  const katL = Object.entries(kat).sort((a, b) => b[1] - a[1]);
  const rows = list.filter((g) => !gKat || (g.kategori || 'Diğer') === gKat).sort((a, b) => String(b.tarih).localeCompare(a.tarih));
  // tekrarlanan giderlerden bu ay henüz girilmemiş olanlar
  const tekrar = gYM === ymOf(t) ? Object.values(S.giderler.filter((g) => g.tekrar && ymOf(g.tarih) < gYM).reduce((o, g) => { const k = `${g.kategori}|${g.aciklama}`; if (!o[k] || o[k].tarih < g.tarih) o[k] = g; return o; }, {}))
    .filter((g) => !list.some((x) => x.kategori === g.kategori && x.aciklama === g.aciklama)) : [];
  m.innerHTML = ph('Giderler', `${ymLabel(gYM)} · toplam <b class="num" style="color:var(--ink)">${TL0(tot)}</b>`, `<label style="flex-direction:row;align-items:center;gap:10px">Dönem<select id="gym" style="width:auto">${ms.map((y) => `<option value="${y}"${y === gYM ? ' selected' : ''}>${ymLabel(y)}</option>`).join('')}</select></label>`)
  + (tekrar.length ? `<section class="card" style="border-color:#EBC992;background:#FFFBF3"><div class="ch"><h2>Bu ay girilmemiş tekrarlı giderler</h2></div><div class="list">${tekrar.map((g) => `<div><div class="t"><b>${esc(g.kategori)}${g.aciklama ? ' · ' + esc(g.aciklama) : ''}</b><span>Son: ${fmtDate(g.tarih)} · ${esc(g.hesap || H0())}</span></div><span class="row"><span class="num" style="font-weight:600">${TL(calcKdvli(g).toplam)}</span><button class="btn-sm" type="button" data-tk="${g.id}">Bu aya ekle</button></span></div>`).join('')}</div></section>` : '')
  + `<section class="card"><div class="ch"><h2>Kategoriye Göre</h2><span class="sm mut">Listeyi süzmek için kategoriye tıklayın</span></div><div class="cats">${katL.map(([k, v]) => `<button class="cat" type="button" data-k="${esc(k)}" aria-pressed="${gKat === k}"><span class="hd"><span>${esc(k)}</span><b>${TL0(v)}</b></span><span class="meter tl"><i style="width:${Math.max(3, (v / (katL[0][1] || 1)) * 100)}%"></i></span></button>`).join('') || '<p class="empty">Bu dönemde gider yok.</p>'}</div></section>
  <div class="split"><section class="card w2"><div class="ch"><h2>Kayıtlar — ${esc(gKat || 'Tümü')}</h2>${gKat ? '<button class="btn-g" type="button" id="gclr">Filtreyi temizle</button>' : ''}</div>
    <div class="tw"><table style="min-width:600px"><thead><tr><th>Tarih</th><th>Açıklama</th><th>Kategori</th><th>Ödeme</th><th class="r">Tutar</th></tr></thead><tbody>${rows.map((g) => `<tr class="click" data-e="${g.id}"><td class="mut">${fmtDate(g.tarih)}</td><td style="font-weight:500">${esc(g.aciklama || '—')}${g.tekrar ? ' <span class="pill mut">her ay</span>' : ''}${g.fis ? ' <span class="pill info">fiş</span>' : ''}</td><td class="mut">${esc(g.kategori)}</td><td class="mut">${esc(g.hesap || H0())}</td><td class="r num" style="font-weight:600">${TL(calcKdvli(g).toplam)}</td></tr>`).join('') || emptyRow(5, 'Kayıt yok.')}</tbody></table></div></section>
    <aside class="card w1"><h2>Yeni Gider</h2><form class="form" id="gf">${giderForm({ tarih: t, kdvOran: ayar().kdv })}<button class="btn" type="submit">Gideri Kaydet</button></form></aside></div>`;
  $('#gym').onchange = (e) => { gYM = e.target.value; gKat = ''; route(); };
  $$('[data-k]', m).forEach((b) => (b.onclick = () => { gKat = gKat === b.dataset.k ? '' : b.dataset.k; route(); }));
  if ($('#gclr')) $('#gclr').onclick = () => { gKat = ''; route(); };
  $$('[data-e]', m).forEach((r) => (r.onclick = () => editGider(S.giderler.find((g) => g.id === r.dataset.e))));
  $$('[data-tk]', m).forEach((b) => (b.onclick = async () => { const g = S.giderler.find((x) => x.id === b.dataset.tk); const gun = Math.min(28, +String(g.tarih).slice(8) || 1); const { id, guncelleme, fis, ...rest } = g; if (await save('giderler', { ...rest, tarih: `${gYM}-${String(gun).padStart(2, '0')}` })) route(); }));
  $('#gf').onsubmit = async (e) => { e.preventDefault(); if (await giderKaydet({}, e.target)) route(); };
};
function giderForm(d) {
  const toplam = d.id ? calcKdvli(d).toplam : '';
  return `<label>Tarih<input name="tarih" type="date" value="${esc(d.tarih)}" required></label>
    <label>Kategori<select name="kategori">${giderKatlari().map((k) => `<option${k === d.kategori ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select></label>
    <label>Açıklama<input name="aciklama" value="${esc(d.aciklama)}" placeholder="Örn. ${AYLAR[+today().slice(5, 7) - 1]} elektrik faturası"></label>
    <label>Tutar (₺, KDV dahil)<input name="tutar" class="num" value="${toplam === '' ? '' : N2(toplam)}" inputmode="decimal" placeholder="0,00" required></label>
    <label>KDV<select name="kdvOran">${[[20, '%20'], [10, '%10'], [1, '%1'], [0, 'Yok']].map(([v, l]) => `<option value="${v}"${num(d.kdvOran ?? 20) === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    <label>Ödendiği hesap<select name="hesap">${hesapOpts(d.hesap)}</select></label>
    <label class="chk"><input type="checkbox" name="tekrar"${d.tekrar ? ' checked' : ''}> Her ay tekrarla</label>
    <label>Fiş / fatura görseli${d.fis ? ' <span class="xs">(yüklü — yenisi seçilirse değişir)</span>' : ''}<input name="fis" type="file" accept="image/*"></label>`;
}
async function giderKaydet(d, f) {
  const v = (n) => f.elements[n].value.trim();
  const tutar = num(v('tutar')), k = num(v('kdvOran'));
  if (tutar <= 0) { toast('Tutar girin', true); return false; }
  const doc = await save('giderler', { ...d, tarih: v('tarih') || today(), kategori: v('kategori'), aciklama: v('aciklama'), matrah: r2(tutar / (1 + k / 100)), kdvOran: k, hesap: v('hesap'), tekrar: f.elements.tekrar.checked }, true);
  if (!doc) return false;
  const file = f.elements.fis.files[0];
  if (file) {
    try { const data = await shrink(file); const r = await api({ a: 'save', col: 'fotolar', doc: { satisId: doc.id, ad: file.name, kategori: 'Fiş', data } }); if (r.ok) await save('giderler', { ...doc, fis: r.doc.id }, true); else toast('Fiş yüklenemedi: ' + r.error, true); }
    catch (_) { toast('Fiş görseli okunamadı', true); }
  }
  toast('Gider kaydedildi');
  return true;
}
function editGider(d) {
  openDlg(`<h2>Gideri düzenle</h2><div class="g2">${giderForm(d)}</div>${d.fis ? '<div><button class="btn-o" type="button" id="fisg">Fişi göster</button></div><div id="fisv"></div>' : ''}`,
    (f) => giderKaydet(d, f), () => remove('giderler', d.id));
  if ($('#fisg')) $('#fisg').onclick = async () => { const r = await api({ a: 'fotolar', satisId: d.id }); const p = r.ok && r.docs.find((x) => x.id === d.fis); $('#fisv').innerHTML = p ? `<img src="${esc(p.data)}" alt="Fiş görseli" style="max-width:100%;border-radius:8px;border:1px solid var(--line)">` : '<p class="note">Fiş bulunamadı.</p>'; };
}

/* ---------------- RAPORLAR ---------------- */
let rPer = 'month';
const grupOf = (l) => { const k = l.kalemId && S.kalemler.find((x) => x.id === l.kalemId); if ((l.tur || 'urun') !== 'urun') return 'Dikim, montaj ve hizmet'; if (k && STOK_TUR[k.stokTur]) return STOK_TUR[k.stokTur]; return 'Diğer ürünler'; };
function satisGruplari(match, kdvDahil) {
  const g = {};
  for (const s of S.satislar.filter((x) => x.durum !== 'teklif' && match(x.tarih))) {
    const c = calcSatis(s), oran = c.ara ? (c.ara - c.isk) / c.ara : 0;
    for (const l of s.satirlar || []) { const v = num(l.miktar) * num(l.fiyat) * oran * (kdvDahil ? 1 + num(l.kdv) / 100 : 1); const k = grupOf(l); g[k] = r2((g[k] || 0) + v); }
  }
  return g;
}
VIEWS.raporlar = (m) => {
  const t = today(), y = t.slice(0, 4), ym = ymOf(t), l3 = lastMonths(3);
  const P = { month: { l: 'Bu Ay', txt: `1–${+t.slice(8)} ${AYLAR[+ym.slice(5) - 1]} ${y}`, match: (d) => ymOf(d) === ym, key: ym },
    quarter: { l: 'Son 3 Ay', txt: `${AYLAR[+l3[0].slice(5) - 1]} – ${AYLAR[+ym.slice(5) - 1]} ${y}`, match: (d) => ymOf(d) >= l3[0] && ymOf(d) <= ym, key: '' },
    year: { l: 'Bu Yıl', txt: `Ocak – ${AYLAR[+ym.slice(5) - 1]} ${y}`, match: (d) => String(d).startsWith(y), key: y } };
  const p = P[rPer], R = calcDonem(p.match);
  const cogs = r2(R.mUrun + R.mIsc), pct = (n) => (R.ciro ? Math.round((n / R.ciro) * 100) : 0);
  const kdvIn = r2(R.alisKdv + R.giderKdv);
  const grp = Object.entries(satisGruplari(p.match)).sort((a, b) => b[1] - a[1]), gt = grp.reduce((s, x) => s + x[1], 0);
  const cust = Object.values(S.satislar.filter((s) => s.durum !== 'teklif' && p.match(s.tarih)).reduce((o, s) => { const k = mKey(s); o[k] = o[k] || { ad: s.musteri, v: 0 }; o[k].v += calcSatis(s).toplam; return o; }, {})).sort((a, b) => b.v - a.v).slice(0, 5);
  const nx = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5), 28)).toISOString().slice(0, 10);
  const COL = ['#0E5E5B', '#3E8C86', '#E2A04A', '#7FA9A5', '#B9CFCC', '#C9B8A0'];
  m.innerHTML = ph('Raporlar', p.txt, `<div class="tabs" role="group" aria-label="Dönem">${Object.entries(P).map(([k, v]) => `<button type="button" data-p="${k}" aria-pressed="${rPer === k}">${v.l}</button>`).join('')}</div>`)
  + `<div class="split"><section class="card w2"><div class="ch"><h2>Kâr / Zarar Özeti</h2><span class="sm mut">KDV hariç</span></div>
      <div class="pl"><div><span>Satış gelirleri</span><b class="num">${TL0(R.ciro)}</b></div><div><span>Satılan malın maliyeti (kumaş, aksesuar, işçilik)</span><span class="num">−${TL0(cogs)}</span></div><div class="s"><span>Brüt kâr (%${pct(R.brutKar)})</span><span class="num">${TL0(R.brutKar)}</span></div><div><span>Faaliyet giderleri (kira, personel, enerji…)</span><span class="num">−${TL0(R.giderMatrah)}</span></div><div class="s" style="color:${R.netKar >= 0 ? 'var(--ok)' : 'var(--bad-t)'}"><span>Net kâr (%${pct(R.netKar)})</span><span class="num">${TL0(R.netKar)}</span></div></div>
      ${R.ciro ? `<div class="stack" aria-hidden="true"><i style="width:${Math.max(0, pct(cogs))}%;background:var(--out)"></i><i style="width:${Math.max(0, pct(R.giderMatrah))}%;background:#7FA9A5"></i><i style="width:${Math.max(0, pct(R.netKar))}%;background:var(--acc)"></i></div><div class="leg"><span><i class="o"></i>Maliyet</span><span><i style="background:#7FA9A5"></i>Gider</span><span><i></i>Net kâr</span></div>` : ''}
      <p class="note">Maliyet, satış satırlarına girilen alış fiyatlarından hesaplanır. Alış faturaları stoğa girer; satıldıkça maliyete yansır.</p></section>
    <section class="card w1"><h2>KDV Durumu</h2><div class="pl"><div><span>Hesaplanan KDV</span><span class="num">${TL0(R.satisKdv)}</span></div><div><span>İndirilecek KDV</span><span class="num">−${TL0(kdvIn)}</span></div><div class="s"><span>${R.kdvFark >= 0 ? 'Ödenecek KDV' : 'Devreden KDV'}</span><span class="num">${TL0(Math.abs(R.kdvFark))}</span></div></div>
      <p class="note">${rPer === 'month' ? `Bu ayın KDV beyannamesi genellikle ${fmtDate(nx)} tarihine kadar verilir. ` : ''}Rakamlar mali müşavirinizle paylaşılmadan önce kontrol edilmelidir.</p></section></div>
  <div class="split"><section class="card w2"><h2>Satışın Ürün Gruplarına Dağılımı</h2>${grp.length ? `<div class="stack" aria-hidden="true">${grp.map(([, v], i) => `<i style="width:${(v / gt) * 100}%;background:${COL[i % COL.length]}"></i>`).join('')}</div><div class="list">${grp.map(([k, v], i) => `<div><span class="row" style="gap:10px"><i style="width:12px;height:12px;border-radius:3px;background:${COL[i % COL.length]};display:inline-block"></i>${esc(k)}</span><span class="num sm">${TL0(v)} · %${Math.round((v / gt) * 100)}</span></div>`).join('')}</div>` : '<p class="empty">Bu dönemde satış yok.</p>'}</section>
    <section class="card w1"><h2>En Çok Satış Yapılan Cariler</h2>${cust.map((c, i) => `<div class="rank"><span class="no">${i + 1}</span><span class="nm">${esc(c.ad)}</span><span class="num" style="font-weight:600">${TL0(c.v)}</span></div>`).join('') || '<p class="empty">Bu dönemde satış yok.</p>'}</section></div>
  <section class="card"><h2>Hazır Raporlar</h2><div class="list">
    <div><div class="t"><b>Muhasebeci paketi (Excel)</b><span>Özet, satışlar, satış kalemleri, tahsilatlar, alışlar ve giderler · ${p.key ? esc(p.txt) : 'bu yıl'}</span></div><button class="btn-sm" type="button" id="r1">İndir</button></div>
    <div><div class="t"><b>Aylık rapor (yazdır / PDF)</b><span>Kâr hesabı, nakit ve KDV özeti · ${ymLabel(ym)}</span></div><button class="btn-sm" type="button" id="r2">Yazdır</button></div>
    <div><div class="t"><b>Cari bakiye listesi (Excel)</b><span>Tüm müşteri ve tedarikçi bakiyeleri</span></div><button class="btn-sm" type="button" id="r3">İndir</button></div>
    <div><div class="t"><b>Stok listesi (Excel)</b><span>Mevcut miktar, minimum, alış ve satış fiyatları</span></div><button class="btn-sm" type="button" id="r4">İndir</button></div></div></section>`;
  $$('[data-p]', m).forEach((b) => (b.onclick = () => { rPer = b.dataset.p; route(); }));
  $('#r1').onclick = () => exportXlsx(p.key || y);
  $('#r2').onclick = () => printRapor(ym);
  $('#r3').onclick = () => { cTab = 'all'; const all = cariler(); download(makeXlsx([{ name: 'Cariler', cols: [{ h: 'Cari', t: 's', w: 30 }, { h: 'Tür', t: 's', w: 12 }, { h: 'Telefon', t: 's', w: 16 }, { h: 'Son işlem', t: 'd', w: 12 }, { h: 'Bakiye', t: 'n', w: 14 }, { h: 'Vadesi geçmiş', t: 'n', w: 14 }], rows: all.map((c) => [c.ad, c.tur === 'musteri' ? 'Müşteri' : 'Tedarikçi', c.tel, c.son, c.bakiye, c.gecikmis]) }]), `beyperde-cariler-${t}.xlsx`); };
  $('#r4').onclick = () => download(makeXlsx([{ name: 'Stok', cols: [{ h: 'Kod', t: 's' }, { h: 'Ürün', t: 's', w: 34 }, { h: 'Tür', t: 's', w: 12 }, { h: 'Tedarikçi', t: 's', w: 24 }, { h: 'Birim', t: 's', w: 8 }, { h: 'Mevcut', t: 'n' }, { h: 'Minimum', t: 'n' }, { h: 'Alış', t: 'n' }, { h: 'Satış', t: 'n' }, { h: 'Stok değeri', t: 'n' }],
    rows: S.kalemler.filter((k) => k.stok).sort((a, b) => String(a.ad).localeCompare(b.ad, 'tr')).map((k) => { const s = stokOf(k).mevcut; return [k.kod, k.ad, STOK_TUR[k.stokTur] || '', k.tedarikci, k.birim, s, k.kritik, k.alis, k.satis, r2(Math.max(0, s) * num(k.alis))]; }) }]), `beyperde-stok-${t}.xlsx`);
};

/* ---------------- YILLIK TABLO ---------------- */
let yY = today().slice(0, 4), yView = 'gelir';
VIEWS.yillik = (m) => {
  const y = yY, cur = ymOf(today());
  const ys = [...new Set([today().slice(0, 4), ...months().map((x) => x.slice(0, 4))])].sort().reverse();
  const yms = Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`);
  const gg = yms.map((x) => (x > cur ? null : ayGG(x)));
  const T = calcDonem((d) => String(d).startsWith(y));
  const gel = r2(T.satisToplam), gid = r2(T.alisToplam + T.giderToplam);
  const dol = gg.filter(Boolean).length || 1;
  const kayit = S.satislar.filter((s) => s.durum !== 'teklif' && String(s.tarih).startsWith(y)).length + S.alislar.filter((a) => String(a.tarih).startsWith(y)).length + S.giderler.filter((g) => String(g.tarih).startsWith(y)).length;
  const katsiz = S.giderler.filter((g) => String(g.tarih).startsWith(y) && !g.kategori).length + S.alislar.filter((a) => String(a.tarih).startsWith(y) && !a.kategori).length;
  let rows;
  if (yView === 'gelir') {
    const per = yms.map((x) => (x > cur ? null : satisGruplari((d) => ymOf(d) === x, true)));
    const keys = [...new Set(per.filter(Boolean).flatMap((o) => Object.keys(o)))];
    rows = keys.map((k) => ({ l: k, c: per.map((o) => (o ? o[k] || 0 : null)) }));
  } else {
    const keys = new Map();
    yms.forEach((x, i) => {
      if (x > cur) return;
      for (const a of S.alislar.filter((z) => ymOf(z.tarih) === x)) { const k = `Alış — ${a.kategori || 'kategorisiz'}`; if (!keys.has(k)) keys.set(k, Array(12).fill(0)); keys.get(k)[i] += calcKdvli(a).toplam; }
      for (const g of S.giderler.filter((z) => ymOf(z.tarih) === x)) { const k = g.kategori || 'Diğer'; if (!keys.has(k)) keys.set(k, Array(12).fill(0)); keys.get(k)[i] += calcKdvli(g).toplam; }
    });
    rows = [...keys.entries()].map(([l, c]) => ({ l, c: c.map((v, i) => (yms[i] > cur ? null : v)) }));
  }
  rows.forEach((r) => (r.t = r.c.reduce((s, v) => s + (v || 0), 0)));
  rows.sort((a, b) => b.t - a.t);
  const all = rows.reduce((s, r) => s + r.t, 0);
  const sumC = yms.map((x, i) => (x > cur ? null : rows.reduce((s, r) => s + (r.c[i] || 0), 0)));
  m.innerHTML = ph('Yıllık Gelir-Gider Tablosu', `Ocak – Aralık ${y} · KDV dahil · satış faturaları, alış faturaları ve giderlerden otomatik toplanır`, `<div class="tabs" role="group" aria-label="Yıl">${ys.map((x) => `<button type="button" data-y="${x}" aria-pressed="${x === y}">${x}</button>`).join('')}</div><button class="btn-o" type="button" id="yx">Excel'e Aktar</button><button class="btn-o" type="button" id="yp">Yazdır</button>`)
  + `<section class="kpis">${kpiBox('Toplam Gelir', TL0(gel), 'Satış faturaları · KDV dahil')}${kpiBox('Toplam Gider', TL0(gid), 'Alış faturaları ve giderler')}${kpiBox('Fark (Gelir − Gider)', TL0(gel - gid), gel - gid >= 0 ? 'Pozitif' : 'Negatif', gel - gid >= 0 ? 'ok' : 'bad')}${kpiBox('Tahsilat', TL0(T.tahsilAy), `Açık alacak ${TL0(T.alacak)}`)}</section>
  <section class="card"><h2>Aylık Gelir ve Gider — ${y}</h2>${bars(yms.map((x, i) => ({ ad: AY3[i], gelir: gg[i] ? gg[i].gelir : 0, gider: gg[i] ? gg[i].gider : 0 })))}</section>
  <section class="card"><div class="ch"><h2>Kategori Bazında Aylık Tablo</h2><div class="tabs" role="group" aria-label="Görünüm"><button type="button" data-v="gelir" aria-pressed="${yView === 'gelir'}">Gelirler</button><button type="button" data-v="gider" aria-pressed="${yView === 'gider'}">Giderler</button></div></div>
    <div class="tw"><table class="ytab"><thead><tr><th>Kalem</th>${AY3.map((a) => `<th class="r">${a}</th>`).join('')}<th class="r">Yıllık</th><th class="r">Pay</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.l)}</td>${r.c.map((v) => `<td>${v === null ? '' : v ? TL0(v) : '—'}</td>`).join('')}<td style="font-weight:600">${TL0(r.t)}</td><td>%${all ? Math.round((r.t / all) * 100) : 0}</td></tr>`).join('') || emptyRow(15, 'Bu yıl kayıt yok.')}${rows.length ? `<tr class="tt"><td>Toplam</td>${sumC.map((v) => `<td>${v === null ? '' : TL0(v)}</td>`).join('')}<td>${TL0(all)}</td><td>%100</td></tr>` : ''}</tbody></table></div>
    <p class="note">Gelecek aylar boş görünür. Tablo yana kaydırılabilir; kalem sütunu sabit kalır.</p></section>
  <section class="card"><h2>Kontrol</h2><div class="pl"><div><span>Kayıt sayısı (${y})</span><span class="num">${kayit}</span></div><div><span>Kategorisiz kayıt (alış ve gider)</span><span class="num"${katsiz ? ' style="color:var(--warn-t)"' : ''}>${katsiz}</span></div><div><span>Ortalama aylık gelir</span><span class="num">${TL0(gel / dol)}</span></div><div><span>Ortalama aylık gider</span><span class="num">${TL0(gid / dol)}</span></div></div><a href="#raporlar" class="sm">Kâr / zarar raporuna git</a></section>`;
  $$('[data-y]', m).forEach((b) => (b.onclick = () => { yY = b.dataset.y; route(); }));
  $$('[data-v]', m).forEach((b) => (b.onclick = () => { yView = b.dataset.v; route(); }));
  $('#yx').onclick = () => exportXlsx(y);
  $('#yp').onclick = () => doPrint(`<div class="doc">${docHead('Yıllık Gelir-Gider', `${y} · ${yView === 'gelir' ? 'Gelirler' : 'Giderler'} (KDV dahil)`)}<table><thead><tr><th>Kalem</th>${AY3.map((a) => `<th class="n">${a}</th>`).join('')}<th class="n">Yıllık</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.l)}</td>${r.c.map((v) => `<td class="n">${v ? TL0(v) : ''}</td>`).join('')}<td class="n"><b>${TL0(r.t)}</b></td></tr>`).join('')}</tbody></table><p>Toplam gelir: <b>${TL0(gel)}</b> · Toplam gider: <b>${TL0(gid)}</b> · Fark: <b>${TL0(gel - gid)}</b></p>${docFoot()}</div>`, 'A4 landscape');
};

/* ---------------- pencereler ---------------- */
function field(id, label, v = '', type = 'text', extra = '') { return `<label>${label}<input id="${id}" name="${id}" type="${type}" value="${esc(v)}" ${extra}></label>`; }
function sel(id, label, opts, v, extra = '') { return `<label>${label}<select id="${id}" name="${id}" ${extra}>${opts.map(([o, t]) => `<option value="${esc(o)}"${String(o) === String(v) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`; }
const hesapOpts = (v) => ayar().hesaplar.map((h) => `<option${h === (v || H0()) ? ' selected' : ''}>${esc(h)}</option>`).join('');
const val = (f, n) => (f.elements[n] ? f.elements[n].value.trim() : '');
function openDlg(html, onSave, onDel, okText = 'Kaydet', noRoute = false) {
  const d = $('#dlg'), f = $('#dlg-form');
  f.oninput = null; f.onchange = null; f.onclick = null;
  f.innerHTML = html + `<div class="dlg-foot"><div class="row">${onDel ? '<button class="btn-g danger" type="button" id="dlg-del">Sil</button>' : ''}</div><div class="row"><button class="btn-o" value="cancel" formnovalidate>Vazgeç</button>${onSave ? `<button class="btn" id="dlg-ok" type="button">${esc(okText)}</button>` : ''}</div></div>`;
  if (!d.open) d.showModal();
  d.scrollTop = 0; f.scrollTop = 0;
  if (onSave) $('#dlg-ok').onclick = async () => { if (!f.reportValidity()) return; const b = $('#dlg-ok'); b.disabled = true; const r = await onSave(f); b.disabled = false; if (r !== false && r != null) { d.close(); if (!noRoute) route(); } };
  if (onDel) armBtn($('#dlg-del'), 'Bu kayıt kalıcı olarak silinecek. Bu işlem geri alınamaz.', async () => { if (await onDel()) { d.close(); route(); } });
}
// Ekranın ortasında uyarı penceresi (tarayıcı onay pencereleri yerine). Onaylanırsa true döner.
function onayIste(mesaj, okText = 'Evet, sil', baslik = 'Emin misiniz?') {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'onay';
    d.innerHTML = `<div class="onay-in" role="alertdialog" aria-labelledby="onay-h" aria-describedby="onay-p"><div class="onay-ic" aria-hidden="true">!</div><h2 id="onay-h">${esc(baslik)}</h2><p id="onay-p">${esc(mesaj)}</p><div class="onay-btns"><button class="btn-o" type="button" data-v="0">Vazgeç</button><button class="btn red" type="button" data-v="1">${esc(okText)}</button></div></div>`;
    document.body.appendChild(d);
    let sonuc = false;
    d.addEventListener('close', () => { d.remove(); resolve(sonuc); });
    d.querySelectorAll('[data-v]').forEach((b) => (b.onclick = () => { sonuc = b.dataset.v === '1'; d.close(); }));
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    d.showModal();
    d.querySelector('[data-v="0"]').focus();
  });
}
function armBtn(btn, confirmText, fn) {
  btn.onclick = async (e) => {
    e.stopPropagation();
    const msg = typeof confirmText === 'function' ? confirmText() : confirmText;
    if (await onayIste(msg)) await fn();
  };
}

/* ---------------- FİYAT LİSTESİ (Excel) İÇE AKTARMA ---------------- */
function fiyatListesiYukle(preFile) {
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
    toast(`${plan.yeni.length} yeni ürün eklendi, ${plan.degisen.length} ürün güncellendi`);
    return true;
  });
  const okBtn = $('#dlg-ok'); okBtn.textContent = 'Listeyi uygula'; okBtn.disabled = true;
  const replan = () => {
    const ted = $('#flted').value.trim(), vt = $('#flvt') ? $('#flvt').value : '';
    const items = parsed.items.map((it) => ({ ...it, stokTur: it.stokTur || vt }));
    plan = planImport(S.kalemler, items, { tedarikci: ted, tarih: today(), kdv: num(ayar().kdv), kaynak: fname });
    const fiyat = plan.degisen.filter((d) => d.fiyatDegisti);
    const turSay = {}; plan.yeni.forEach((d) => (turSay[d.stokTur || '-'] = (turSay[d.stokTur || '-'] || 0) + 1));
    $('#flsum').innerHTML = `<ul class="checks" style="list-style:none;margin:0;padding:0;display:grid;gap:8px">
      <li><span class="pill ok">Yeni</span> <span>${plan.yeni.length} ürün stok kalemi olarak eklenecek${plan.yeni.length ? ' (' + Object.entries(turSay).map(([t, c]) => `${STOK_TUR[t] || 'türü seçilmemiş'}: ${c}`).join(', ') + ')' : ''}</span></li>
      <li><span class="pill warn">Güncelleme</span> <span>${fiyat.length} üründe fiyat değişti${plan.degisen.length - fiyat.length ? `, ${plan.degisen.length - fiyat.length} üründe en/durum bilgisi değişti` : ''}</span></li>
      <li><span class="pill mut">Aynı</span> <span>${plan.ayni} ürün değişmedi</span></li>
      ${plan.atlanan ? `<li><span class="pill bad">Atlandı</span> <span>${plan.atlanan} satır listede iki kez geçiyor</span></li>` : ''}</ul>
      ${fiyat.length ? `<div class="tw"><table><thead><tr><th>Kod</th><th>Ürün</th><th class="n">Eski alış</th><th class="n">Yeni alış</th><th class="n">Eski satış</th><th class="n">Yeni satış</th></tr></thead><tbody>${fiyat.slice(0, 200).map((d) => `<tr><td>${esc(d.yeni.kod)}</td><td>${esc(d.yeni.ad)}</td><td class="n">${TL(d.eski.alis)}</td><td class="n"><b>${TL(d.yeni.alis)}</b></td><td class="n">${TL(d.eski.satis)}</td><td class="n"><b>${TL(d.yeni.satis)}</b></td></tr>`).join('')}</tbody></table></div>` : ''}`;
    okBtn.disabled = !(plan.yeni.length || plan.degisen.length) || !ted || (plan.yeni.some((d) => !d.stokTur));
  };
  const oku = async (f) => {
    fname = f.name;
    const out = $('#flres'); out.innerHTML = '<p class="note">Okunuyor…</p>';
    try { parsed = parseFiyatListesi(await readXlsx(await f.arrayBuffer())); }
    catch (err) { out.innerHTML = `<p><span class="pill bad">Hata</span> ${esc(err.message)}. Dosya Excel (.xlsx) biçiminde olmalı; PDF ise önce Excel'e aktarılmış hâlini yükleyin.</p>`; return; }
    if (!parsed.items.length) { out.innerHTML = '<p><span class="pill bad">Hata</span> Listede ürün satırı bulunamadı.</p>'; return; }
    const eksikTur = parsed.items.some((it) => !it.stokTur);
    const kur = Object.entries(parsed.kur).map(([k, v]) => `${esc(k)}: ${N2(v)}`).join(' · ');
    out.innerHTML = `<div class="g2">${field('flted', 'Tedarikçi', parsed.tedarikci, 'text', 'required')}${eksikTur ? sel('flvt', 'Kategorisinden türü anlaşılmayan ürünlerin stok türü', turOpts, '') : `<div><label>Okunan</label><p>${parsed.items.length} ürün${kur ? ' · ' + kur : ''}</p></div>`}</div>
      <p class="note">Tedarikçi adı eşleştirme için kullanılır: aynı firmanın sonraki listelerini aynı adla yükleyin.</p><div id="flsum"></div>`;
    $('#flted').oninput = replan;
    if ($('#flvt')) $('#flvt').onchange = replan;
    replan();
  };
  $('#flf').onchange = (e) => { const f = e.target.files[0]; if (f) oku(f); };
  if (preFile) oku(preFile);
}

/* ---------------- FOTOĞRAF KÜÇÜLTME ---------------- */
async function shrink(file) {   // en uzun kenar 1600 px, JPEG; sunucu sınırının altına inene kadar kalite düşürülür
  const bmp = await createImageBitmap(file);
  const sc = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  for (const q of [0.8, 0.7, 0.6, 0.5, 0.4]) { const d = c.toDataURL('image/jpeg', q); if (d.length < 850 * 1024) return d; }
  throw new Error('çok büyük');
}

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
  const rows = (s.satirlar || []).map((l) => `<tr><td>${esc(l.ad)}${(l.detay ?? [l.oda, l.olcu].filter(Boolean).join(' · ')) ? `<br><small>${esc(l.detay ?? [l.oda, l.olcu].filter(Boolean).join(' · '))}</small>` : ''}</td><td class="n">${N2(l.miktar)} ${esc(l.birim)}</td><td class="n">${TL(l.fiyat)}</td><td class="n">%${N2(l.kdv)}</td><td class="n">${TL(num(l.miktar) * num(l.fiyat))}</td></tr>`).join('');
  doPrint(`<div class="doc">${docHead(s.durum === 'teklif' ? 'Teklif' : 'Sipariş Özeti', `No: ${esc(s.no)} · ${fmtDate(s.tarih)}${s.vade && s.durum !== 'teklif' ? ' · Vade ' + fmtDate(s.vade) : ''}`)}
    <p><b>Müşteri:</b> ${esc(s.musteri)}${s.tel ? ' · ' + esc(s.tel) : ''}<br>${s.adres ? '<b>Adres:</b> ' + esc(s.adres) : ''}${s.montaj ? `<br><b>Montaj:</b> ${fmtDate(s.montaj)} ${esc(s.montajSaat || '')}` : ''}</p>
    <table><thead><tr><th>Ürün / hizmet</th><th class="n">Miktar</th><th class="n">Birim fiyat</th><th class="n">KDV</th><th class="n">Tutar</th></tr></thead><tbody>${rows}</tbody></table>
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

if (!window.__BP_TEST__) boot();
