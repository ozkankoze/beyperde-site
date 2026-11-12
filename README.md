# Bey Perde — web sitesi

Statik site: Python ile üretilir (`src/`), `public/` klasörü Vercel'de yayınlanır. Detaylı teklif formu için
tek bir sunucusuz fonksiyon var (`api/teklif.js`).

## Komutlar

| Komut | Ne yapar |
|---|---|
| `python3 tools/images.py` | `src/images` içindeki fotoğraflardan AVIF + WebP (480/960/1600 px) üretir |
| `python3 src/build.py` | Tüm sayfaları `public/` içine üretir (TR, EN, AR + site haritası, robots, 404) |
| `npm test` | API birim testleri + site denetimi (kırık bağlantı, alt metin, başlık hiyerarşisi, JSON-LD, hreflang) |
| `npm run lint` | JavaScript ve Python sözdizimi kontrolü |
| `npm run dev` | `http://localhost:8000/tr` adresinde yerel önizleme |

Vercel'de derleme komutu gerekmez: `public/` depoda üretilmiş hâliyle durur. İçerik değişince
`python3 src/build.py` çalıştırıp `public/` ile birlikte commit edin.

## İçerik nerede

- `src/content/products.raw.json`, `pages.raw.json` — beyperde.com'daki metinler (TR/EN/AR), fotoğraf açıklamaları
- `src/content/data.py` — arayüz metinleri, ürün listesi, kullanım alanları / malzemeler / avantajlar, katalog sözlüğü, oda rehberi
- `src/content/pages.py` — anasayfa, katalog, form ve 404 metinleri
- `src/content/local.py` — yalnızca Türkçe sayfalar: hizmet bölgeleri, KVKK, gizlilik, çerez politikası
- `src/content/catalog.py` — katalog etiketleri (fotoğraf açıklamalarından türetilir)
- `src/content/compare.json` — öncesi/sonrası fotoğrafları (bkz. `README-oncesi-sonrasi.md`)

## Detaylı teklif formu (e-posta)

Vercel → Project → Settings → Environment Variables:

- `RESEND_API_KEY` — resend.com API anahtarı
- `TEKLIF_ALICI` — teklif e-postalarının gideceği adres (birden fazlaysa virgülle)
- `TEKLIF_GONDEREN` — Resend'de doğrulanmış gönderen, ör. `Bey Perde <teklif@beyperde.com>`

Bunlar tanımlanmadan form **başarı mesajı göstermez**; kullanıcıya durumu söyler ve bilgilerini
WhatsApp mesajına aktarmayı önerir. Hızlı teklif her zaman WhatsApp üzerinden çalışır.

## Arama motorları

`*.vercel.app` adreslerinde tüm sayfalar `X-Robots-Tag: noindex` ile kapalıdır (vercel.json). Alan adı
`beyperde.com` bağlandığında indekslenir; `robots.txt` ve `sitemap.xml` hazırdır. URL yapısı eski
siteyle aynıdır (`/tr/urunler/perde/tul-perde` vb.), fotoğrafı olmayan proje sayfaları `/projeler`e yönlenir.

## Geri dönüş

Önceki prototip `yedek-v0-prototip` dalında durur.
