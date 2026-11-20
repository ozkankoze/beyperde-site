// Fiyat listesi içe aktarma (src/admin/fiyat.mjs): Excel okuma ve eşleştirme
'use strict';
const test = require('node:test');
const assert = require('node:assert');

// Küçük bir .xlsx (sıkıştırmasız ZIP) üretir: paneldeki dışa aktarma ile aynı yapı
function makeZip(files) {
  const enc = new TextEncoder(), parts = [], cd = []; let off = 0;
  const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  for (const [n, s] of Object.entries(files)) {
    const name = enc.encode(n), data = enc.encode(s), h = Buffer.alloc(30), c = Buffer.alloc(46);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc(data), 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt32LE(crc(data), 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, name, data); cd.push(c, name); off += 30 + name.length + data.length;
  }
  const size = cd.reduce((a, b) => a + b.length, 0), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(Object.keys(files).length, 8); e.writeUInt16LE(Object.keys(files).length, 10); e.writeUInt32LE(size, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, ...cd, e]);
}
const row = (r, cells) => `<row r="${r}">${cells.map((v, i) => { const ref = String.fromCharCode(65 + i) + r; return typeof v === 'number' ? `<c r="${ref}"><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${v}</t></is></c>`; }).join('')}</row>`;
const sheet = (rows) => `<worksheet><sheetData>${rows.map((r, i) => row(i + 1, r)).join('')}</sheetData></worksheet>`;
const xlsx = (fiyat, notlar) => makeZip({
  'xl/workbook.xml': '<workbook><sheets><sheet name="Fiyat Listesi" sheetId="1" r:id="rId1"/><sheet name="Notlar" sheetId="2" r:id="rId2"/></sheets></workbook>',
  'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>',
  'xl/worksheets/sheet1.xml': sheet(fiyat), 'xl/worksheets/sheet2.xml': sheet(notlar),
});
const H = ['Kod', 'Ürün Adı', 'Kategori', 'Birim', 'Alış Fiyatı', 'Satış Fiyatı', 'Para Birimi', 'Döviz / Liste Fiyatı', 'En (cm)', 'Durum'];

test('Excel fiyat listesi okunur; tedarikçi, birim ve stok türü çıkarılır', async () => {
  const F = await import('../src/admin/fiyat.mjs');
  const buf = xlsx([H, ['CAS-001', 'Casting ALADRA', 'Tül', 'm', 256.88, 667.89, 'USD', 5.2, '300', ''], ['CAS-002', 'Casting RAY', 'Ray', 'adet', 100, 260, 'USD', 2, '', 'HAVUZ'], ['', '', '', '', '', '', '', '', '', '']],
    [['Casting Tekstil Ltd. Şti. — Ürün Fiyat Listesi']]);
  const r = F.parseFiyatListesi(await F.readXlsx(buf));
  assert.strictEqual(r.items.length, 2);
  assert.strictEqual(r.tedarikci, 'Casting Tekstil Ltd. Şti.');
  assert.deepStrictEqual([r.items[0].birim, r.items[0].stokTur, r.items[0].alis, r.items[0].en], ['metre', 'kumas', 256.88, '300']);
  assert.strictEqual(r.items[1].stokTur, 'mekanik');
  assert.strictEqual(r.items[1].durum, 'HAVUZ');
});

test('ilk yüklemede kalem eklenir, yeniden yüklemede yalnızca fiyat güncellenir, stok korunur', async () => {
  const F = await import('../src/admin/fiyat.mjs');
  const items = [{ kod: 'CAS-001', ad: 'Casting ALADRA', kategori: 'Tül', birim: 'metre', alis: 256.88, satis: 667.89, doviz: 'USD', dovizFiyat: 5.2, en: '300', durum: '', stokTur: 'kumas' }];
  const p1 = F.planImport([], items, { tedarikci: 'Casting', tarih: '2026-11-20' });
  assert.strictEqual(p1.yeni.length, 1);
  assert.strictEqual(p1.yeni[0].stok, true);
  const mevcut = [{ ...p1.yeni[0], id: 'k1', acilisStok: 40, duzeltme: -3 }];
  assert.strictEqual(F.planImport(mevcut, items, { tedarikci: 'Casting' }).ayni, 1);
  const p2 = F.planImport(mevcut, [{ ...items[0], alis: 300, satis: 780, dovizFiyat: 6 }], { tedarikci: 'Casting', tarih: '2026-12-01' });
  assert.strictEqual(p2.degisen.length, 1);
  const d = p2.degisen[0].yeni;
  assert.deepStrictEqual([d.id, d.alis, d.satis, d.acilisStok, d.duzeltme, d.fiyatGecmis.length], ['k1', 300, 780, 40, -3, 2]);
  // başka tedarikçinin aynı kodlu ürünüyle karışmaz
  assert.strictEqual(F.planImport(mevcut, items, { tedarikci: 'Başka Firma' }).yeni.length, 1);
});
