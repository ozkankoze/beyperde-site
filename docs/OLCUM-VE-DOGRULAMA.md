# Search Console, Bing ve Google Analytics 4 kurulumu

Altyapı hazır; kod girilene kadar siteye hiçbir etiket ya da betik eklenmez.

## 1. Google Search Console
1. https://search.google.com/search-console → Mülk ekle → **URL öneki**: `https://www.beyperde.com/`
2. Doğrulama yöntemi **HTML etiketi**: `content="..."` içindeki değeri kopyalayın.
3. `src/content/data.py` → `GSC_VERIFICATION = 'kopyalanan-değer'`
4. `python3 src/build.py && npm test && git add -A && git commit -m "Search Console doğrulaması" && git push`
5. Search Console'da **Doğrula**, ardından **Site haritaları** → `sitemap.xml` gönderin.

(Alternatif: Alan adı mülkü için Natro DNS Yönetimi'ne TXT kaydı eklenir; MX kayıtlarına dokunulmaz.)

## 2. Bing Webmaster Tools
Search Console'dan içe aktarma en kolayıdır. Etiket yöntemi için `BING_VERIFICATION` doldurulur.

## 3. Google Analytics 4
1. Analytics → Yönetici → Veri akışları → Web → ölçüm kimliği (`G-XXXXXXXXXX`).
2. `src/content/data.py` → `GA4_ID = 'G-XXXXXXXXXX'`
3. **Önemli:** GA4 açıldığında çerez bildirimi metni de güncellenmeli (şu an "yalnızca zorunlu depolama" diyor) ve
   `src/content/local.py` içindeki çerez politikasına Google Analytics eklenmeli. Bildirimde "İstatistiğe izin ver" düğmesi
   GA4_ID girildiğinde kendiliğinden görünür; GA yalnızca bu izin verilirse yüklenir.
4. İçerik Güvenliği Politikası (vercel.json) Google Analytics adreslerine zaten izin veriyor.

Gönderilen olaylar: `whatsapp_click`, `phone_click`, `email_click` (link_location: header/footer/float/content),
`generate_lead` (detaylı teklif formu gerçekten gönderildiğinde). GA4'te `generate_lead` ve `whatsapp_click`
"Önemli etkinlik" (dönüşüm) olarak işaretlenmelidir.
