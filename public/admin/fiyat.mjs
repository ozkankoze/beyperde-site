/* Tedarikçi fiyat listesi (.xlsx) okuma ve stok kalemleriyle eşleştirme. DOM kullanmaz; tarayıcıda ve Node testlerinde çalışır.
   Beklenen biçim (Bey Perde muhasebe formatı): "Fiyat Listesi" sayfasında başlık satırı
   Kod | Ürün Adı | Kategori | Birim | Alış Fiyatı | Satış Fiyatı | Minimum Stok | Stok | Para Birimi | Döviz / Liste Fiyatı | En (cm) | Durum
   Sütun sırası ve bazı sütunların eksikliği sorun değildir; başlık adlarından bulunur. */

export const STOK_TUR = { kumas: 'Kumaş', mekanik: 'Mekanik', aksesuar: 'Aksesuar' };

/* ---------- ZIP ---------- */
async function inflateRaw(data) {
  const ds = new DecompressionStream('deflate-raw');
  const out = await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(out);
}
export async function unzip(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Excel dosyası okunamadı (zip değil)');
  const n = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const files = {}, dec = new TextDecoder();
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('Excel dosyası bozuk');
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
    const lnl = dv.getUint16(off + 26, true), lxl = dv.getUint16(off + 28, true);
    const start = off + 30 + lnl + lxl, raw = u8.subarray(start, start + csize);
    files[name] = { method, raw };
    p += 46 + nl + xl + cl;
  }
  return {
    has: (name) => !!files[name],
    async text(name) {
      const f = files[name]; if (!f) return null;
      const data = f.method === 0 ? f.raw : f.method === 8 ? await inflateRaw(f.raw) : null;
      if (!data) throw new Error('Desteklenmeyen sıkıştırma');
      return dec.decode(data);
    },
  };
}

/* ---------- XLSX ---------- */
const unxml = (s) => String(s).replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi, (m, e) => {
  const map = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
  if (map[e.toLowerCase()]) return map[e.toLowerCase()];
  return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
});
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? unxml(m[1]) : null; };
const colIdx = (ref) => { const l = ref.replace(/\d+/g, ''); let n = 0; for (const ch of l) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
const textOf = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unxml(m[1])).join('');

/** Çalışma kitabını { sayfaAdı: [[hücre, ...], ...] } olarak döndürür. Formüllerde Excel'in kaydettiği son değer okunur. */
export async function readXlsx(buf) {
  const z = await unzip(buf);
  const wb = await z.text('xl/workbook.xml');
  if (!wb) throw new Error('Bu bir Excel (.xlsx) dosyası değil');
  const rels = (await z.text('xl/_rels/workbook.xml.rels')) || '';
  const relMap = {};
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) relMap[attr(m[0], 'Id')] = attr(m[0], 'Target');
  const sst = [];
  const ssx = await z.text('xl/sharedStrings.xml');
  if (ssx) for (const m of ssx.matchAll(/<si>([\s\S]*?)<\/si>/g)) sst.push(textOf(m[1]));
  const out = {};
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = attr(m[0], 'name'), rid = attr(m[0], 'r:id');
    let target = relMap[rid] || ''; target = target.replace(/^\/?xl\//, '').replace(/^\//, '');
    const xml = await z.text('xl/' + target);
    if (!xml) continue;
    const rows = [];
    for (const r of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>|<row\b[^>]*\/>/g)) {
      const row = [];
      for (const c of (r[1] || '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const tag = '<c' + c[1] + '>', t = attr(tag, 't'), ref = attr(tag, 'r'), body = c[2] || '';
        const v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        let val = null;
        if (t === 's') val = v != null ? sst[+v] ?? '' : '';
        else if (t === 'inlineStr') val = textOf(body);
        else if (t === 'str' || t === 'e') val = v != null ? unxml(v) : '';
        else if (t === 'b') val = v === '1';
        else if (v != null) val = Number(v);
        const ci = ref ? colIdx(ref) : row.length;
        row[ci] = val;
      }
      rows.push(row);
    }
    out[name] = rows;
  }
  return out;
}

/* ---------- fiyat listesi ---------- */
const norm = (s) => String(s ?? '').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]+/g, ' ').trim();
const toNum = (v) => {
  if (typeof v === 'number') return v;
  if (v == null || v === '') return null;
  let t = String(v).replace(/[^\d,.\-]/g, '');
  if (!t) return null;
  if (t.lastIndexOf(',') > t.lastIndexOf('.')) t = t.replace(/\./g, '').replace(',', '.'); else t = t.replace(/,/g, '');
  const n = parseFloat(t); return Number.isFinite(n) ? n : null;
};
const HEAD = {
  kod: ['kod', 'ürün kodu', 'stok kodu'], ad: ['ürün adı', 'ürün', 'ad', 'açıklama'], kategori: ['kategori', 'grup'], birim: ['birim'],
  alis: ['alış fiyatı', 'alış', 'maliyet'], satis: ['satış fiyatı', 'satış'], kritik: ['minimum stok', 'kritik stok', 'min stok'], stok: ['stok', 'mevcut stok'],
  doviz: ['para birimi', 'döviz cinsi'], dovizFiyat: ['döviz liste fiyatı', 'liste fiyatı', 'döviz fiyatı'], en: ['en cm', 'en', 'kumaş eni'], durum: ['durum', 'not'], stokTur: ['stok türü', 'tür'],
};
export function turFromKategori(k) {
  const s = norm(k);
  if (/(aksesuar|renso|püskül|tutucu|halka|başlık|kanca|bant)/.test(s)) return 'aksesuar';
  if (/(ray|mekanizma|motor|korniş|boru|mekanik|zincir|kumanda)/.test(s)) return 'mekanik';
  if (/(tül|fon|güneşlik|kumaş|stor|perde|plise|blackout|keten|döşemelik)/.test(s)) return 'kumas';
  if (/^(kumaş|mekanik|aksesuar)$/.test(s)) return { 'kumaş': 'kumas', mekanik: 'mekanik', aksesuar: 'aksesuar' }[s];
  return '';
}
const birimOf = (b) => ({ m: 'metre', mt: 'metre', metre: 'metre', 'm2': 'm²', 'm²': 'm²', ad: 'adet', adet: 'adet', tk: 'takım', takım: 'takım' }[norm(b).replace(/\s/g, '')] || String(b || '').trim() || 'adet');

/** Kitaptan ürün satırlarını, tedarikçi adını ve kur bilgisini çıkarır. */
export function parseFiyatListesi(sheets) {
  let rows = null, hdr = -1, cols = null;
  for (const [, rs] of Object.entries(sheets)) {
    for (let i = 0; i < Math.min(rs.length, 15); i++) {
      const h = (rs[i] || []).map(norm);
      if (h.some((x) => HEAD.ad.includes(x)) && h.some((x) => HEAD.alis.includes(x) || HEAD.satis.includes(x))) {
        cols = {};
        for (const [k, names] of Object.entries(HEAD)) { const j = h.findIndex((x) => names.includes(x)); if (j >= 0) cols[k] = j; }
        rows = rs; hdr = i; break;
      }
    }
    if (rows) break;
  }
  if (!rows) throw new Error('Başlık satırı bulunamadı ("Ürün Adı" ve "Alış/Satış Fiyatı" sütunları gerekli)');
  const items = [];
  for (const r of rows.slice(hdr + 1)) {
    const g = (k) => (cols[k] != null ? r[cols[k]] : null);
    const ad = String(g('ad') ?? '').trim();
    if (!ad) continue;
    const kategori = String(g('kategori') ?? '').trim();
    items.push({ kod: String(g('kod') ?? '').trim(), ad, kategori, birim: birimOf(g('birim')), alis: toNum(g('alis')), satis: toNum(g('satis')),
      kritik: toNum(g('kritik')), stok: toNum(g('stok')), doviz: String(g('doviz') ?? '').trim().toUpperCase(), dovizFiyat: toNum(g('dovizFiyat')),
      en: g('en') == null ? '' : String(g('en')).trim(), durum: String(g('durum') ?? '').trim(), stokTur: turFromKategori(g('stokTur')) || turFromKategori(kategori) });
  }
  // Tedarikçi: "Notlar" sayfasının ilk satırı ("Casting Tekstil Ltd. Şti. — …") ya da ürün adlarının ortak ilk kelimesi
  let tedarikci = '';
  const notlar = Object.entries(sheets).find(([n]) => /not/i.test(n));
  if (notlar) { const first = String((notlar[1][0] || [])[0] || ''); tedarikci = first.split(/\s[—–-]\s/)[0].trim(); }
  if (!tedarikci && items.length) {
    const w = items[0].ad.split(/\s+/)[0];
    if (w.length > 2 && items.every((x) => x.ad.startsWith(w + ' '))) tedarikci = w;
  }
  const kur = {};
  const kurS = Object.entries(sheets).find(([n]) => /kur/i.test(n));
  if (kurS) for (const r of kurS[1]) { const k = String(r[0] ?? '').trim(); const v = toNum(r[1]); if (k && v != null) kur[k] = v; }
  return { items, tedarikci, kur };
}

const key = (x) => (x.kod ? 'k:' + norm(x.kod) : 'a:' + norm(x.ad));
const diff = (a, b) => Math.abs((a ?? 0) - (b ?? 0)) > 0.005;

/** Mevcut kalemlerle karşılaştırır. Dönen yeni ve değişen kayıtlar doğrudan kaydedilebilir.
    Stok miktarına (başlangıç stoğu, sayım) güncellemede dokunulmaz. */
export function planImport(kalemler, items, { tedarikci = '', varsayilanTur = '', tarih = '', kdv = 20, kaynak = '' } = {}) {
  const ted = norm(tedarikci);
  const mine = new Map();
  for (const k of kalemler) if (norm(k.tedarikci) === ted) mine.set(key(k), k);
  const yeni = [], degisen = [], seen = new Set();
  let ayni = 0, atlanan = 0;
  for (const it of items) {
    const kk = key(it);
    if (seen.has(kk)) { atlanan++; continue; }
    seen.add(kk);
    const tur = it.stokTur || varsayilanTur;
    const fiyat = { tarih, alis: it.alis, satis: it.satis, dovizFiyat: it.dovizFiyat, kaynak };
    const ex = mine.get(kk);
    if (!ex) {
      yeni.push({ kod: it.kod, ad: it.ad, tur: 'urun', birim: it.birim, alis: it.alis ?? 0, satis: it.satis ?? 0, kdv, stok: true,
        acilisStok: it.stok ?? 0, kritik: it.kritik ?? 0, stokTur: tur, tedarikci, kategori: it.kategori, doviz: it.doviz, dovizFiyat: it.dovizFiyat,
        en: it.en, durum: it.durum, fiyatGecmis: [fiyat] });
      continue;
    }
    const fiyatDegisti = diff(ex.alis, it.alis) || diff(ex.satis, it.satis) || diff(ex.dovizFiyat, it.dovizFiyat);
    const bilgiDegisti = (it.en && it.en !== ex.en) || it.durum !== (ex.durum || '') || (it.kategori && it.kategori !== ex.kategori);
    if (!fiyatDegisti && !bilgiDegisti) { ayni++; continue; }
    const doc = { ...ex, alis: it.alis ?? ex.alis, satis: it.satis ?? ex.satis, doviz: it.doviz || ex.doviz, dovizFiyat: it.dovizFiyat ?? ex.dovizFiyat,
      en: it.en || ex.en, durum: it.durum, kategori: it.kategori || ex.kategori, stokTur: ex.stokTur || tur };
    if (!num0(ex.kritik) && it.kritik) doc.kritik = it.kritik;
    if (fiyatDegisti) doc.fiyatGecmis = [...(ex.fiyatGecmis || []), fiyat].slice(-20);
    degisen.push({ eski: ex, yeni: doc, fiyatDegisti });
  }
  return { yeni, degisen, ayni, atlanan };
}
const num0 = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
