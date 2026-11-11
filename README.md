# Bey Perde — web sitesi (önizleme)

Statik prototip: 3D giriş animasyonlu anasayfa, Rustik Perde ürün sayfası, Erenköy H.K Evi proje sayfası.

## Vercel
- Framework Preset: **Other**
- Build Command: boş
- Output Directory: `public` (vercel.json içinde tanımlı)

Önizleme sürümü arama motorlarına kapalıdır (`robots.txt` ve `X-Robots-Tag: noindex`).
Canlıya alırken bu iki ayar kaldırılmalı ve eski adresler (`/tr/urunler/...`) için yönlendirmeler eklenmelidir.
