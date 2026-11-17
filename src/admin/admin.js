/* Bey Perde yönetim paneli — ön yüz. Veriler /api/admin üzerinden sunucudaki depoda tutulur.
   Hesaplamalar burada yapılır (calc); yazdırma için #print-area kullanılır. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => { const n = typeof v === 'number' ? v : parseTR(v); return Number.isFinite(n) ? n : 0; };
const r2 = (n) => Math.round(n * 100) / 100;
const TL = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(num(n));
const N2 = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num(n));
const today = () => new Date().toISOString().slice(0, 10);
const ymOf = (d) => String(d || '').slice(0, 7);
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const ymLabel = (ym) => { const [y, m] = ym.split('-'); return `${AYLAR[+m - 1]} ${y}`; };
const fmtDate = (d) => (d ? d.split('-').reverse().join('.') : '');
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
  const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BP-Admin': '1' }, credentials: 'same-origin', body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ ok: false, error: 'network' }));
  j.status = r.status;
  return j;
}
const S = { kalemler: [], satislar: [], alislar: [], giderler: [], ayarlar: [] };
const ayar = () => ({ firma: 'Bey Perde', tel: '0553 596 26 14', adres: 'Ekşioğlu Mah. Kuran Kursu Cad. No:4, Demek Sitesi B Blok, İç Kapı No:12, 34794 Çekmeköy/İstanbul', web: 'beyperde.com', kdv: 20, etiketW: 62, etiketH: 100,
  kategoriler: ['Kira', 'Personel / işçilik', 'Elektrik, su, doğalgaz', 'Yakıt ve ulaşım', 'Reklam', 'Vergi ve SGK', 'Malzeme (sarf)', 'Diğer'], ...(S.ayarlar.find((a) => a.id === 'genel') || {}) });
async function save(col, doc) {
  const r = await api({ a: 'save', col, doc });
  if (!r.ok) { toast(r.error === 'session' ? 'Oturum süresi doldu, yeniden giriş yapın.' : 'Kaydedilemedi: ' + r.error, true); if (r.error === 'session') showLogin(); return null; }
  const i = S[col].findIndex((d) => d.id === r.doc.id);
  if (i >= 0) S[col][i] = r.doc; else S[col].push(r.doc);
  toast('Kaydedildi');
  return r.doc;
}
async function remove(col, id) {
  const r = await api({ a: 'del', col, id });
  if (!r.ok) { toast('Silinemedi: ' + r.error, true); return false; }
  S[col] = S[col].filter((d) => d.id !== id);
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
export function calcAy(ym, data = S) {
  const st = data.satislar.filter((s) => s.durum !== 'teklif' && ymOf(s.tarih) === ym).map(calcSatis);
  const sum = (arr, k) => r2(arr.reduce((a, x) => a + num(x[k]), 0));
  const al = data.alislar.filter((a) => ymOf(a.tarih) === ym).map(calcKdvli);
  const gd = data.giderler.filter((g) => ymOf(g.tarih) === ym);
  const gdc = gd.map(calcKdvli);
  const kat = {};
  gd.forEach((g, i) => { kat[g.kategori || 'Diğer'] = r2((kat[g.kategori || 'Diğer'] || 0) + gdc[i].matrah); });
  const tahsilAy = r2(data.satislar.flatMap((s) => s.tahsilat || []).filter((t) => ymOf(t.tarih) === ym).reduce((a, t) => a + num(t.tutar), 0));
  const R = { adet: st.length, ciro: sum(st, 'matrah'), satisKdv: sum(st, 'kdv'), satisToplam: sum(st, 'toplam'), mUrun: sum(st, 'mUrun'), mIsc: sum(st, 'mIsc'),
    alisMatrah: sum(al, 'matrah'), alisKdv: sum(al, 'kdv'), alisToplam: sum(al, 'toplam'), giderMatrah: sum(gdc, 'matrah'), giderKdv: sum(gdc, 'kdv'), giderToplam: sum(gdc, 'toplam'), kat, tahsilAy };
  R.brutKar = r2(R.ciro - R.mUrun - R.mIsc);
  R.netKar = r2(R.brutKar - R.giderMatrah);
  R.nakit = r2(R.tahsilAy - R.alisToplam - R.giderToplam);
  R.kdvFark = r2(R.satisKdv - R.alisKdv - R.giderKdv);
  R.alacak = r2(data.satislar.filter((s) => s.durum !== 'teklif').map(calcSatis).reduce((a, c) => a + Math.max(0, c.kalan), 0));
  return R;
}

/* ---------------- giriş ---------------- */
function showLogin() { $('#shell').hidden = true; $('#setup').hidden = true; $('#login').hidden = false; $('#pw').focus(); }
async function boot() {
  const me = await api({ a: 'me' });
  if (me.status === 503) {
    $('#setup').hidden = false;
    $('#setup-list').innerHTML = (me.missing?.store ? '<li>Veri deposu (Upstash Redis) bağlı değil.</li>' : '') + (me.missing?.password ? '<li>ADMIN_PASSWORD tanımlı değil.</li>' : '');
    return;
  }
  if (!me.ok) return showLogin();
  await loadAll();
}
async function loadAll() {
  const r = await api({ a: 'all' });
  if (!r.ok) { if (r.error === 'session') return showLogin(); toast('Veriler alınamadı: ' + r.error, true); return; }
  Object.assign(S, r.data);
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
  const v = (location.hash || '#ozet').slice(1).split('/')[0];
  const fn = VIEWS[v] || VIEWS.ozet;
  $$('#nav a').forEach((a) => { if (a.getAttribute('href') === '#' + (VIEWS[v] ? v : 'ozet')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const m = $('#main'); m.innerHTML = ''; fn(m);
}
addEventListener('hashchange', () => { if (!$('#shell').hidden) route(); });
const months = () => {
  const set = new Set([ymOf(today())]);
  for (const c of ['satislar', 'alislar', 'giderler']) S[c].forEach((d) => d.tarih && set.add(ymOf(d.tarih)));
  return [...set].sort().reverse();
};
const head = (h, p, btns = '') => `<div class="head"><div><h1>${h}</h1>${p ? `<p>${p}</p>` : ''}</div><div class="row">${btns}</div></div>`;

/* ---------------- ÖZET / RAPOR ---------------- */
let curYM = ymOf(today());
VIEWS.ozet = (m) => {
  const R = calcAy(curYM);
  const k = (l, v, cls = '') => `<div class="kpi ${cls}"><span>${l}</span><b>${TL(v)}</b></div>`;
  const kat = Object.entries(R.kat).sort((a, b) => b[1] - a[1]).map(([n, v]) => `<tr><td>${esc(n)}</td><td class="n">${TL(v)}</td></tr>`).join('') || '<tr><td colspan="2" class="empty">Bu ay gider yok</td></tr>';
  m.innerHTML = head('Özet ve aylık rapor', 'Teklif durumundaki satışlar rapora girmez. Tutarlar KDV hariçtir; KDV ayrıca gösterilir.',
    `<select id="ym" aria-label="Ay">${months().map((y) => `<option value="${y}"${y === curYM ? ' selected' : ''}>${ymLabel(y)}</option>`).join('')}</select><button class="btn" id="pr">Raporu yazdır</button>`)
  + `<div class="kpis">${k('Satış (KDV hariç)', R.ciro)}${k('Satılan malzeme maliyeti', R.mUrun)}${k('İşçilik / hizmet maliyeti', R.mIsc)}${k('Brüt kâr', R.brutKar, R.brutKar >= 0 ? 'pos' : 'neg')}${k('Giderler (KDV hariç)', R.giderMatrah)}${k('Net kâr', R.netKar, R.netKar >= 0 ? 'pos' : 'neg')}</div>
  <div class="kpis">${k('Bu ay tahsilat', R.tahsilAy)}${k('Alışlar (KDV dahil)', R.alisToplam)}${k('Giderler (KDV dahil)', R.giderToplam)}${k('Nakit akışı', R.nakit, R.nakit >= 0 ? 'pos' : 'neg')}${k('Tahmini ödenecek KDV', R.kdvFark)}${k('Toplam açık alacak', R.alacak)}</div>
  <div class="grid2"><div class="tbl-wrap"><table><thead><tr><th>Gider kategorisi</th><th class="n">Tutar</th></tr></thead><tbody>${kat}</tbody></table></div>
  <div class="card note"><h3>Nasıl hesaplanıyor?</h3><p>Brüt kâr = satış − (satırlardaki alış/işçilik maliyeti). Net kâr = brüt kâr − giderler. Nakit akışı = bu ay tahsil edilen − bu ayki alışlar − giderler. Tahmini KDV = satış KDV'si − alış ve gider KDV'si. Bu panel ön muhasebe içindir; resmî defter, e-fatura ve beyanname yerine geçmez.</p></div></div>`;
  $('#ym').onchange = (e) => { curYM = e.target.value; route(); };
  $('#pr').onclick = () => printRapor(curYM);
};

/* ---------------- KALEMLER ---------------- */
const TUR = { urun: 'Ürün', iscilik: 'İşçilik', hizmet: 'Hizmet' };
VIEWS.kalemler = (m) => {
  const rows = [...S.kalemler].sort((a, b) => String(a.ad).localeCompare(b.ad, 'tr')).map((k) => {
    const marj = num(k.satis) ? ((num(k.satis) - num(k.alis)) / num(k.satis)) * 100 : 0;
    return `<tr><td>${esc(k.kod)}</td><td>${esc(k.ad)}</td><td>${TUR[k.tur] || ''}</td><td>${esc(k.birim)}</td><td class="n">${TL(k.alis)}</td><td class="n">${TL(k.satis)}</td><td class="n">%${N2(k.kdv)}</td><td class="n">%${N2(marj)}</td><td><button class="btn-sm" data-e="${k.id}">Düzenle</button></td></tr>`;
  }).join('');
  m.innerHTML = head('Kalemler', 'Ürün, işçilik ve hizmet kalemleri; alış (maliyet) ve satış fiyatları. Fiyatı değişen kalemi buradan güncelleyin.', '<button class="btn" id="new">Yeni kalem</button>')
    + `<div class="tbl-wrap"><table><thead><tr><th>Kod</th><th>Ad</th><th>Tür</th><th>Birim</th><th class="n">Alış / maliyet</th><th class="n">Satış</th><th class="n">KDV</th><th class="n">Marj</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="9" class="empty">Henüz kalem yok. "Yeni kalem" ile ekleyin.</td></tr>'}</tbody></table></div>`;
  $('#new').onclick = () => editKalem({ tur: 'urun', birim: 'metre', kdv: ayar().kdv });
  $$('[data-e]', m).forEach((b) => (b.onclick = () => editKalem(S.kalemler.find((k) => k.id === b.dataset.e))));
};
function field(id, label, val = '', type = 'text', extra = '') { return `<div><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${esc(val)}" ${extra}></div>`; }
function sel(id, label, opts, val) { return `<div><label for="${id}">${label}</label><select id="${id}" name="${id}">${opts.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`; }
function openDlg(html, onSave, onDel) {
  const d = $('#dlg'), f = $('#dlg-form');
  f.innerHTML = html + `<div class="dlg-foot"><div class="row">${onDel ? '<button class="btn-sm danger" value="del" type="button" id="dlg-del">Sil</button>' : ''}</div><div class="row"><button class="btn-ghost" value="cancel" formnovalidate>Vazgeç</button><button class="btn" value="ok" id="dlg-ok" type="button">Kaydet</button></div></div>`;
  d.showModal();
  $('#dlg-ok').onclick = async () => { if (!f.reportValidity()) return; if ((await onSave(f)) !== false) { d.close(); route(); } };
  if (onDel) {
    let armed = false;
    $('#dlg-del').onclick = async (e) => {
      if (!armed) { armed = true; e.target.textContent = 'Silmeyi onayla'; return; }
      if (await onDel()) { d.close(); route(); }
    };
  }
}
const val = (f, n) => f.elements[n] ? f.elements[n].value.trim() : '';
function editKalem(k) {
  openDlg(`<h2>${k.id ? 'Kalemi düzenle' : 'Yeni kalem'}</h2><div class="grid2">${field('kod', 'Kod', k.kod)}${field('ad', 'Ad', k.ad, 'text', 'required')}
    ${sel('tur', 'Tür', Object.entries(TUR), k.tur)}${field('birim', 'Birim (metre, m², adet, saat…)', k.birim)}
    ${field('alis', 'Alış / maliyet fiyatı (KDV hariç)', N2(k.alis || 0), 'text', 'inputmode="decimal"')}${field('satis', 'Satış fiyatı (KDV hariç)', N2(k.satis || 0), 'text', 'inputmode="decimal"')}
    ${field('kdv', 'KDV %', k.kdv ?? ayar().kdv, 'text', 'inputmode="decimal"')}</div><p class="note">İşçilik ve hizmet kalemlerinde "alış" alanına ustaya ödenen ya da size maliyeti olan tutarı yazın; kâr hesabı buna göre yapılır.</p>`,
  (f) => save('kalemler', { ...k, kod: val(f, 'kod'), ad: val(f, 'ad'), tur: val(f, 'tur'), birim: val(f, 'birim'), alis: num(val(f, 'alis')), satis: num(val(f, 'satis')), kdv: num(val(f, 'kdv')) }),
  k.id ? () => remove('kalemler', k.id) : null);
}

/* ---------------- SATIŞLAR ---------------- */
const DURUM = { teklif: 'Teklif', siparis: 'Sipariş', teslim: 'Teslim edildi' };
VIEWS.satislar = (m) => {
  const list = [...S.satislar].sort((a, b) => String(b.tarih).localeCompare(a.tarih));
  const rows = list.map((s) => { const c = calcSatis(s); return `<tr><td>${fmtDate(s.tarih)}</td><td>${esc(s.no)}</td><td>${esc(s.musteri)}</td><td><span class="pill ${s.durum}">${DURUM[s.durum] || ''}</span></td><td class="n">${TL(c.toplam)}</td><td class="n">${TL(c.kar)}</td><td class="n">${TL(c.kalan)}</td><td class="row"><button class="btn-sm" data-e="${s.id}">Aç</button><button class="btn-sm" data-p="${s.id}">Yazdır</button></td></tr>`; }).join('');
  m.innerHTML = head('Satışlar', 'Teklif, sipariş ve teslimler. Ürün, işçilik ve hizmet satırları; KDV, iskonto, maliyet, kâr ve tahsilat otomatik hesaplanır.', '<button class="btn" id="new">Yeni satış</button>')
    + `<div class="tbl-wrap"><table><thead><tr><th>Tarih</th><th>No</th><th>Müşteri</th><th>Durum</th><th class="n">Toplam (KDV dahil)</th><th class="n">Kâr</th><th class="n">Kalan</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="empty">Henüz satış yok.</td></tr>'}</tbody></table></div>`;
  $('#new').onclick = () => editSatis({ tarih: today(), durum: 'siparis', no: nextNo(), satirlar: [], tahsilat: [] });
  $$('[data-e]', m).forEach((b) => (b.onclick = () => editSatis(structuredClone(S.satislar.find((s) => s.id === b.dataset.e)))));
  $$('[data-p]', m).forEach((b) => (b.onclick = () => printSatis(S.satislar.find((s) => s.id === b.dataset.p))));
};
function nextNo() {
  const ym = today().slice(0, 7).replace('-', '');
  const n = S.satislar.filter((s) => String(s.no || '').startsWith('BP-' + ym)).length + 1;
  return `BP-${ym}-${String(n).padStart(3, '0')}`;
}
function editSatis(s) {
  s.satirlar = s.satirlar || []; s.tahsilat = s.tahsilat || [];
  const kOpts = '<option value="">Kalem seç…</option>' + [...S.kalemler].sort((a, b) => String(a.ad).localeCompare(b.ad, 'tr')).map((k) => `<option value="${k.id}">${esc(k.ad)} (${TUR[k.tur] || ''})</option>`).join('');
  const lineRow = (l, i) => `<tr data-i="${i}"><td><select data-k aria-label="Kalem">${kOpts}</select><input data-f="ad" value="${esc(l.ad)}" placeholder="Açıklama" aria-label="Açıklama"></td>
    <td><select data-f="tur" aria-label="Tür">${Object.entries(TUR).map(([v, t]) => `<option value="${v}"${(l.tur || 'urun') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></td>
    <td><input data-f="oda" value="${esc(l.oda)}" placeholder="Salon" aria-label="Oda"></td><td><input data-f="olcu" value="${esc(l.olcu)}" placeholder="300×260" aria-label="Ölçü"></td>
    <td><input data-f="miktar" value="${N2(l.miktar ?? 1)}" inputmode="decimal" aria-label="Miktar" style="width:70px"></td><td><input data-f="birim" value="${esc(l.birim)}" aria-label="Birim" style="width:70px"></td>
    <td><input data-f="fiyat" value="${N2(l.fiyat ?? 0)}" inputmode="decimal" aria-label="Birim fiyat" style="width:100px"></td><td><input data-f="alis" value="${N2(l.alis ?? 0)}" inputmode="decimal" aria-label="Birim maliyet" style="width:100px"></td>
    <td><input data-f="kdv" value="${N2(l.kdv ?? ayar().kdv)}" inputmode="decimal" aria-label="KDV" style="width:52px"></td><td class="n" data-t></td><td><button type="button" class="btn-sm danger" data-x aria-label="Satırı sil">×</button></td></tr>`;
  const tRow = (t, i) => `<tr data-ti="${i}"><td><input type="date" data-tf="tarih" value="${esc(t.tarih)}" aria-label="Tahsilat tarihi"></td><td><input data-tf="tutar" value="${N2(t.tutar)}" inputmode="decimal" aria-label="Tutar"></td><td><input data-tf="not" value="${esc(t.not)}" placeholder="Nakit, kart, havale…" aria-label="Not"></td><td><button type="button" class="btn-sm danger" data-tx aria-label="Tahsilatı sil">×</button></td></tr>`;
  openDlg(`<h2>${s.id ? 'Satış ' + esc(s.no) : 'Yeni satış'}</h2>
    <div class="grid2">${field('tarih', 'Tarih', s.tarih, 'date', 'required')}${field('no', 'Sipariş no', s.no)}${sel('durum', 'Durum', Object.entries(DURUM), s.durum)}
    ${field('musteri', 'Müşteri', s.musteri, 'text', 'required')}${field('tel', 'Telefon', s.tel)}${field('adres', 'Adres', s.adres)}</div>
    <div class="tbl-wrap lines"><table><thead><tr><th>Kalem / açıklama</th><th>Tür</th><th>Oda</th><th>Ölçü</th><th>Miktar</th><th>Birim</th><th>Birim fiyat</th><th>Birim maliyet</th><th>KDV %</th><th class="n">Tutar</th><th></th></tr></thead><tbody id="lines">${s.satirlar.map(lineRow).join('')}</tbody></table></div>
    <div class="row"><button type="button" class="btn-sm" id="addl">+ Satır ekle</button></div>
    <div class="grid2"><div>${field('iskonto', 'İskonto (TL, KDV hariç)', N2(s.iskonto || 0), 'text', 'inputmode="decimal"')}
      <div><label for="not">Not</label><textarea id="not" name="not">${esc(s.not)}</textarea></div></div><div class="sum card" id="sum"></div></div>
    <h3>Tahsilatlar</h3><div class="tbl-wrap"><table><thead><tr><th>Tarih</th><th>Tutar (TL)</th><th>Not</th><th></th></tr></thead><tbody id="tahs">${s.tahsilat.map(tRow).join('')}</tbody></table></div>
    <div class="row"><button type="button" class="btn-sm" id="addt">+ Tahsilat ekle</button></div>`,
  async (f) => { pull(); return save('satislar', { ...s, tarih: val(f, 'tarih'), no: val(f, 'no'), durum: val(f, 'durum'), musteri: val(f, 'musteri'), tel: val(f, 'tel'), adres: val(f, 'adres'), iskonto: num(val(f, 'iskonto')), not: $('#not').value.trim() }); },
  s.id ? () => remove('satislar', s.id) : null);
  function pull() {
    s.satirlar = $$('#lines tr').map((tr) => { const o = {}; $$('[data-f]', tr).forEach((i) => { o[i.dataset.f] = ['miktar', 'fiyat', 'alis', 'kdv'].includes(i.dataset.f) ? num(i.value) : i.value.trim(); }); o.kalemId = tr.dataset.kid || ''; return o; });
    s.tahsilat = $$('#tahs tr').map((tr) => ({ tarih: $('[data-tf="tarih"]', tr).value, tutar: num($('[data-tf="tutar"]', tr).value), not: $('[data-tf="not"]', tr).value.trim() })).filter((t) => t.tutar);
    s.iskonto = num($('#iskonto').value);
  }
  function refresh() {
    pull();
    $$('#lines tr').forEach((tr, i) => { const l = s.satirlar[i]; $('[data-t]', tr).textContent = TL(num(l.miktar) * num(l.fiyat)); });
    const c = calcSatis(s);
    $('#sum').innerHTML = `<span>Ara toplam</span><b>${TL(c.ara)}</b><span>İskonto</span><b>−${TL(c.isk)}</b><span>Matrah</span><b>${TL(c.matrah)}</b><span>KDV</span><b>${TL(c.kdv)}</b><span>Genel toplam</span><b>${TL(c.toplam)}</b><span>Maliyet (malzeme + işçilik)</span><b>${TL(c.maliyet)}</b><span>Kâr</span><b style="color:${c.kar >= 0 ? 'var(--ok)' : 'var(--bad)'}">${TL(c.kar)}</b><span>Tahsil edilen</span><b>${TL(c.tahsil)}</b><span>Kalan</span><b>${TL(c.kalan)}</b>`;
  }
  function bind() {
    $$('#lines tr').forEach((tr, i) => { if (s.satirlar[i]?.kalemId) tr.dataset.kid = s.satirlar[i].kalemId; });
    $('#dlg-form').oninput = refresh;
    $('#lines').onchange = (e) => {
      if (!e.target.matches('[data-k]')) return;
      const k = S.kalemler.find((x) => x.id === e.target.value), tr = e.target.closest('tr');
      if (!k) return;
      tr.dataset.kid = k.id;
      const set = (f, v) => { const i = $(`[data-f="${f}"]`, tr); if (i) i.value = v; };
      set('ad', k.ad); set('tur', k.tur || 'urun'); set('birim', k.birim || ''); set('fiyat', N2(k.satis)); set('alis', N2(k.alis)); set('kdv', N2(k.kdv));
      refresh();
    };
    $('#lines').onclick = (e) => { if (e.target.matches('[data-x]')) { e.target.closest('tr').remove(); refresh(); } };
    $('#tahs').onclick = (e) => { if (e.target.matches('[data-tx]')) { e.target.closest('tr').remove(); refresh(); } };
    $('#addl').onclick = () => { pull(); $('#lines').insertAdjacentHTML('beforeend', lineRow({ miktar: 1, kdv: ayar().kdv }, s.satirlar.length)); refresh(); };
    $('#addt').onclick = () => { pull(); $('#tahs').insertAdjacentHTML('beforeend', tRow({ tarih: today() }, s.tahsilat.length)); };
    refresh();
  }
  bind();
}

/* ---------------- ALIŞLAR ve GİDERLER ---------------- */
function kdvliView(col, title, desc, extraCol) {
  return (m) => {
    const list = [...S[col]].sort((a, b) => String(b.tarih).localeCompare(a.tarih));
    let tm = 0, tk = 0, tt = 0;
    const rows = list.map((d) => { const c = calcKdvli(d); tm += c.matrah; tk += c.kdv; tt += c.toplam;
      return `<tr><td>${fmtDate(d.tarih)}</td><td>${esc(d[extraCol.key])}</td><td>${esc(d.aciklama)}</td><td class="n">${TL(c.matrah)}</td><td class="n">${TL(c.kdv)}</td><td class="n">${TL(c.toplam)}</td><td><button class="btn-sm" data-e="${d.id}">Düzenle</button></td></tr>`; }).join('');
    m.innerHTML = head(title, desc, '<button class="btn" id="new">Yeni kayıt</button>')
      + `<div class="tbl-wrap"><table><thead><tr><th>Tarih</th><th>${extraCol.label}</th><th>Açıklama</th><th class="n">Matrah</th><th class="n">KDV</th><th class="n">Toplam</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="empty">Henüz kayıt yok.</td></tr>'}</tbody>${rows ? `<tfoot><tr><td colspan="3">Toplam</td><td class="n">${TL(tm)}</td><td class="n">${TL(tk)}</td><td class="n">${TL(tt)}</td><td></td></tr></tfoot>` : ''}</table></div>`;
    $('#new').onclick = () => editKdvli(col, { tarih: today(), kdvOran: ayar().kdv });
    $$('[data-e]', m).forEach((b) => (b.onclick = () => editKdvli(col, S[col].find((d) => d.id === b.dataset.e))));
  };
}
VIEWS.alislar = kdvliView('alislar', 'Alışlar', 'Tedarikçi faturaları: kumaş, ray, aksesuar alımları. PDF kontrol ekranından faturayı okutup buraya aktarabilirsiniz.', { key: 'tedarikci', label: 'Tedarikçi' });
VIEWS.giderler = kdvliView('giderler', 'Giderler', 'Kira, maaş ve işçilik, faturalar, yakıt, reklam gibi işletme giderleri.', { key: 'kategori', label: 'Kategori' });
function editKdvli(col, d) {
  const isAlis = col === 'alislar';
  openDlg(`<h2>${isAlis ? 'Alış' : 'Gider'} ${d.id ? 'düzenle' : 'ekle'}</h2><div class="grid2">${field('tarih', 'Tarih', d.tarih, 'date', 'required')}
    ${isAlis ? field('tedarikci', 'Tedarikçi', d.tedarikci, 'text', 'required') + field('faturaNo', 'Fatura no', d.faturaNo) : sel('kategori', 'Kategori', ayar().kategoriler.map((k) => [k, k]), d.kategori)}
    ${field('aciklama', 'Açıklama', d.aciklama)}${field('matrah', 'Tutar (KDV hariç)', N2(d.matrah || 0), 'text', 'inputmode="decimal" required')}${field('kdvOran', 'KDV %', N2(d.kdvOran ?? ayar().kdv), 'text', 'inputmode="decimal"')}</div>
    <p class="sum card" id="ks"></p>${d.kaynak ? `<p class="note">Kaynak: ${esc(d.kaynak)}</p>` : ''}`,
  (f) => save(col, { ...d, tarih: val(f, 'tarih'), aciklama: val(f, 'aciklama'), matrah: num(val(f, 'matrah')), kdvOran: num(val(f, 'kdvOran')), ...(isAlis ? { tedarikci: val(f, 'tedarikci'), faturaNo: val(f, 'faturaNo') } : { kategori: val(f, 'kategori') }) }),
  d.id ? () => remove(col, d.id) : null);
  const upd = () => { const c = calcKdvli({ matrah: $('#matrah').value, kdvOran: $('#kdvOran').value }); $('#ks').innerHTML = `<span>KDV</span><b>${TL(c.kdv)}</b><span>Toplam</span><b>${TL(c.toplam)}</b>`; };
  $('#dlg-form').oninput = upd; upd();
}

/* ---------------- YAZDIRMA ---------------- */
function doPrint(html, page) {
  const pa = $('#print-area'); pa.innerHTML = html;
  let st = $('#print-page'); if (!st) { st = document.createElement('style'); st.id = 'print-page'; document.head.appendChild(st); }
  st.textContent = `@page{size:${page};margin:${page.includes('mm') && !page.startsWith('A4') ? '0' : '14mm'}}`;
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  setTimeout(() => window.print(), 50);
}
const docHead = (title, sub) => { const a = ayar(); return `<div class="dh"><div style="display:flex;gap:12px;align-items:center"><img src="/brand/logo-brown-192.webp" alt=""><div><b style="font-size:14pt">${esc(a.firma)}</b><br><span style="font-size:9pt">Perde · Duvar Kağıdı · Döşemelik Kumaş</span></div></div><div style="text-align:right"><h1>${title}</h1><div>${sub}</div></div></div>`; };
const docFoot = () => { const a = ayar(); return `<div class="foot">${esc(a.firma)} · ${esc(a.adres)} · ${esc(a.tel)} · ${esc(a.web)}</div>`; };
function printSatis(s) {
  const c = calcSatis(s);
  const rows = (s.satirlar || []).map((l) => `<tr><td>${esc(l.ad)}</td><td>${esc(l.oda)}</td><td>${esc(l.olcu)}</td><td class="n">${N2(l.miktar)} ${esc(l.birim)}</td><td class="n">${TL(l.fiyat)}</td><td class="n">%${N2(l.kdv)}</td><td class="n">${TL(num(l.miktar) * num(l.fiyat))}</td></tr>`).join('');
  doPrint(`<div class="doc">${docHead(DURUM[s.durum] === 'Teklif' ? 'Teklif' : 'Sipariş Özeti', `No: ${esc(s.no)} · ${fmtDate(s.tarih)}`)}
    <p><b>Müşteri:</b> ${esc(s.musteri)}${s.tel ? ' · ' + esc(s.tel) : ''}<br>${s.adres ? '<b>Adres:</b> ' + esc(s.adres) : ''}</p>
    <table><thead><tr><th>Ürün / hizmet</th><th>Oda</th><th>Ölçü</th><th class="n">Miktar</th><th class="n">Birim fiyat</th><th class="n">KDV</th><th class="n">Tutar</th></tr></thead><tbody>${rows}</tbody></table>
    <table style="width:auto;margin-left:auto"><tbody><tr><td>Ara toplam</td><td class="n">${TL(c.ara)}</td></tr>${c.isk ? `<tr><td>İskonto</td><td class="n">−${TL(c.isk)}</td></tr>` : ''}<tr><td>KDV</td><td class="n">${TL(c.kdv)}</td></tr><tr><td><b>Genel toplam</b></td><td class="n"><b>${TL(c.toplam)}</b></td></tr><tr><td>Tahsil edilen</td><td class="n">${TL(c.tahsil)}</td></tr><tr><td><b>Kalan</b></td><td class="n"><b>${TL(c.kalan)}</b></td></tr></tbody></table>
    ${s.not ? `<p><b>Not:</b> ${esc(s.not)}</p>` : ''}${docFoot()}</div>`, 'A4');
}
function printRapor(ym) {
  const R = calcAy(ym);
  const tr = (l, v, b) => `<tr><td>${b ? '<b>' + l + '</b>' : l}</td><td class="n">${b ? '<b>' + TL(v) + '</b>' : TL(v)}</td></tr>`;
  const kat = Object.entries(R.kat).map(([n, v]) => tr(esc(n), v)).join('');
  doPrint(`<div class="doc">${docHead('Aylık Rapor', ymLabel(ym))}
    <table><thead><tr><th>Kâr hesabı</th><th class="n">Tutar</th></tr></thead><tbody>${tr(`Satış (KDV hariç, ${R.adet} sipariş)`, R.ciro)}${tr('Satılan malzeme maliyeti', R.mUrun)}${tr('İşçilik / hizmet maliyeti', R.mIsc)}${tr('Brüt kâr', R.brutKar, 1)}${tr('Giderler (KDV hariç)', R.giderMatrah)}${tr('Net kâr', R.netKar, 1)}</tbody></table>
    <table><thead><tr><th>Nakit ve KDV</th><th class="n">Tutar</th></tr></thead><tbody>${tr('Tahsilat', R.tahsilAy)}${tr('Alışlar (KDV dahil)', R.alisToplam)}${tr('Giderler (KDV dahil)', R.giderToplam)}${tr('Nakit akışı', R.nakit, 1)}${tr('Satış KDV', R.satisKdv)}${tr('Alış KDV', R.alisKdv)}${tr('Gider KDV', R.giderKdv)}${tr('Tahmini ödenecek KDV', R.kdvFark, 1)}${tr('Toplam açık alacak', R.alacak)}</tbody></table>
    ${kat ? `<table><thead><tr><th>Gider kategorisi</th><th class="n">Tutar</th></tr></thead><tbody>${kat}</tbody></table>` : ''}
    <p style="font-size:9pt;color:#6a5d53">Ön muhasebe raporudur; resmî kayıt ve beyanname yerine geçmez.</p>${docFoot()}</div>`, 'A4');
}

/* ---------------- ETİKET ---------------- */
VIEWS.etiket = (m) => {
  const a = ayar();
  const sOpts = [...S.satislar].sort((x, y) => String(y.tarih).localeCompare(x.tarih)).map((s) => `<option value="${s.id}">${esc(s.no)} · ${esc(s.musteri)} · ${fmtDate(s.tarih)}</option>`).join('');
  m.innerHTML = head('Etiket yazdır', 'Askı etiketleri seçtiğiniz siparişten otomatik doldurulur. Etiket ölçüsünü yazıcınızın rulo ölçüsüne göre ayarlayın; yazdırırken yazıcı olarak etiket makinesini ve aynı kağıt ölçüsünü seçin.')
    + `<div class="card grid2">${field('ew', 'Etiket eni (mm)', a.etiketW, 'number', 'min="20" max="200"')}${field('eh', 'Etiket boyu (mm)', a.etiketH, 'number', 'min="20" max="300"')}<div><label>&nbsp;</label><button class="btn-ghost" id="esave" type="button">Ölçüyü kaydet</button></div></div>
    <div class="card" style="display:grid;gap:12px"><div><label for="es">Sipariş</label><select id="es"><option value="">Sipariş seçin…</option>${sOpts}</select></div><div id="elines" class="checks"></div><div class="row"><button class="btn" id="eprint" type="button" disabled>Seçili etiketleri yazdır</button></div></div>
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
    if (t === 'fatura') $('#toalis').onclick = () => editKdvli('alislar', { ...res.rec, kaynak: f.name });
  };
};

/* ---------------- AYARLAR ve YEDEK ---------------- */
VIEWS.ayarlar = (m) => {
  const a = ayar();
  m.innerHTML = head('Ayarlar ve yedek', 'Yazdırılan belgelerde görünen firma bilgileri, varsayılan KDV ve gider kategorileri.')
    + `<form class="card" id="af" style="display:grid;gap:12px"><div class="grid2">${field('firma', 'Firma adı', a.firma)}${field('tel', 'Telefon', a.tel)}${field('web', 'Web', a.web)}${field('kdv', 'Varsayılan KDV %', a.kdv, 'number')}</div>
      ${field('adres', 'Adres', a.adres)}<div><label for="kat">Gider kategorileri (virgülle ayırın)</label><textarea id="kat">${esc(a.kategoriler.join(', '))}</textarea></div><div class="row"><button class="btn" type="submit">Kaydet</button></div></form>
    <div class="card" style="display:grid;gap:10px"><h3>Yedek</h3><p class="note">Tüm kayıtları bilgisayarınıza JSON dosyası olarak indirin; ayda bir yedek almanızı öneririz.</p>
      <div class="row"><button class="btn-ghost" id="exp" type="button">Yedeği indir</button><label class="btn-ghost" for="imp" style="margin:0">Yedekten geri yükle…</label><input id="imp" type="file" accept="application/json" hidden></div><p class="note" id="impmsg"></p></div>`;
  $('#af').onsubmit = (e) => { e.preventDefault(); save('ayarlar', { ...a, id: 'genel', firma: $('#firma').value.trim(), tel: $('#tel').value.trim(), web: $('#web').value.trim(), adres: $('#adres').value.trim(), kdv: num($('#kdv').value), kategoriler: $('#kat').value.split(',').map((x) => x.trim()).filter(Boolean) }); };
  $('#exp').onclick = () => {
    const blob = new Blob([JSON.stringify({ surum: 1, tarih: new Date().toISOString(), data: S }, null, 1)], { type: 'application/json' });
    const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = `beyperde-yedek-${today()}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
  };
  let armed = null;
  $('#imp').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { armed = JSON.parse(await f.text()).data; } catch (_) { $('#impmsg').textContent = 'Dosya okunamadı.'; return; }
    $('#impmsg').innerHTML = `Bu yedek mevcut tüm kayıtların yerine geçecek. <button class="btn-sm danger" id="impok" type="button">Evet, geri yükle</button>`;
    $('#impok').onclick = async () => { const r = await api({ a: 'import', confirm: 'YEDEKTEN_YUKLE', data: armed }); if (r.ok) { toast(`${r.n} kayıt yüklendi`); loadAll(); } else toast('Yüklenemedi: ' + r.error, true); };
  };
};

if (!window.__BP_TEST__) boot();
