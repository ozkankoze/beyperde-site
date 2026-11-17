# Yönetim paneli (beyperde.com/tr/admin)

Ön muhasebe paneli: satışlar ve siparişler, alışlar, giderler, kalem listesi, aylık rapor, PDF kontrol ve etiket yazdırma.
Resmî defter, e-fatura ya da beyanname yerine geçmez.

## Kurulum (bir kez yapılır)

1. **Veri deposu:** Vercel → proje (beyperde-site) → **Storage** → **Create Database** → **Upstash for Redis** (ücretsiz plan) → projeye bağla.
   Bağlayınca `KV_REST_API_URL` ve `KV_REST_API_TOKEN` (ya da `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) ortam değişkenleri kendiliğinden eklenir.
2. **Şifre:** Vercel → proje → **Settings → Environment Variables**:
   - `ADMIN_PASSWORD`: panel şifresi (en az 12 karakter; kimseyle paylaşmayın).
   - `ADMIN_SESSION_SECRET`: 40 karakterden uzun, rastgele bir metin (oturum çerezini imzalar).
3. **Yeniden yayınla:** Deployments → son yayın → **Redeploy**.

Kurulum tamamlanana kadar panel "Kurulum tamamlanmadı" ekranını gösterir; veri göstermez.

## Güvenlik

- Şifre yalnızca sunucuda tutulur; tarayıcıya gönderilmez.
- Oturum 12 saat sürer (HttpOnly, SameSite=Strict, Secure çerez).
- 15 dakikada 8 hatalı denemeden sonra giriş geçici olarak kapanır.
- Sayfa arama motorlarına kapalıdır (noindex, robots.txt).

## Kullanım

- **Kalemler:** ürün, işçilik ve hizmet kalemleri; alış (maliyet), satış fiyatı ve KDV.
- **Satışlar:** teklif, sipariş ya da teslim. Satırlar kalem listesinden seçilir. Ara toplam, iskonto, KDV, maliyet, kâr ve kalan otomatik hesaplanır. "Yazdır" A4 sipariş özeti verir.
- **Alışlar ve giderler:** KDV hariç tutar ile KDV oranı girilir; toplam otomatik hesaplanır.
- **Özet:** seçilen ayın satış, maliyet, brüt ve net kâr, nakit akışı ve tahmini KDV farkı. Teklifler rapora girmez. "Raporu yazdır" ile A4 çıktı alınır.
- **PDF kontrol:** PDF tarayıcıda okunur, sunucuya yüklenmez.
  - Tedarikçi faturası: fatura no, tarih, VKN, matrah, KDV ve genel toplam okunur; "matrah + KDV = toplam" kontrol edilir; aynı fatura no daha önce kaydedildiyse uyarır. "Alış olarak kaydet" formu doldurur, kaydetmeden önce kontrol edersiniz.
  - Sipariş ve teklif formu: her satırda miktar × birim fiyat = tutar ve toplamlar kontrol edilir.
  - Etiket PDF'i: sayfa ölçüsü ayarlardaki etiket ölçüsüyle karşılaştırılır.
  - Taranmış (resim) PDF'lerde metin okunamaz.
- **Etiket yazdır:** siparişin satırlarından askı etiketi çıkarır. Ölçü (mm) etiket rulosuna göre ayarlanır. Yazdırırken yazıcı olarak etiket makinesini, kağıt olarak aynı ölçüyü seçin. Sürücüsü kurulu her etiket yazıcısıyla çalışır.
- **Ayarlar ve yedek:** belgelerde görünen firma bilgileri ve gider kategorileri burada değiştirilir. "Yedeği indir" bütün kayıtları JSON olarak indirir; ayda bir yedek alın.
