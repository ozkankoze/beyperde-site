# Yönetim paneli (beyperde.com/tr/admin)

Ön muhasebe paneli: satışlar ve siparişler, alışlar, giderler, kalem listesi, aylık rapor, PDF kontrol ve etiket yazdırma.
Resmî defter, e-fatura ya da beyanname yerine geçmez.

## Kurulum (bir kez yapılır)

1. **Veri deposu:** Vercel → proje (beyperde-site) → **Storage** → **Neon** (ücretsiz plan, bölge Frankfurt, Auth kapalı) → projeye bağla.
   Bağlayınca `DATABASE_URL` kendiliğinden eklenir; panel tablosunu ilk kullanımda kendisi oluşturur.
   (Upstash for Redis da desteklenir: `KV_REST_API_URL` / `KV_REST_API_TOKEN`.)
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

- **Özet:** Ekranın üstündeki kartlar şunları gösterir:
  - bugünkü ve geciken montajlar
  - vadesi geçen alacaklar
  - vadesi gelen tedarikçi borçları
  - azalan stok
  - yedek hatırlatması

  Altında seçilen ayın raporu ve "Muhasebeci için Excel" düğmesi bulunur.
- **Montaj takvimi:** Sipariş durumundaki işler gün gün listelenir; tarihi geçenler ve henüz tarih verilmemiş olanlar ayrıca gösterilir. İş bitince "Teslim edildi" düğmesine basılır.
- **Satışlar:**
  - Teklif, sipariş ve teslim kayıtları tutulur; teklif tek tuşla siparişe çevrilir.
  - Satırlar kalem listesinden seçilir. Her satırda atölye için pile ve ray/not alanları vardır.
  - Tahsilat hangi hesaba (kasa, POS, banka) girdiyse o hesaba işlenir.
  - Satış ekranındaki düğmeler: WhatsApp ile teklif ya da özet gönderme, ödeme hatırlatma, sipariş/teklif yazdırma, atölye iş emri (A4, sayfa başına 6 ürün) ve etiket.
  - Siparişe fotoğraf eklenebilir (ölçü, bitmiş iş). Fotoğraf yüklenirken küçültülür.
- **Müşteriler:** Satışlardan otomatik oluşur; aynı telefon numarası tek müşteri sayılır. Müşteri kartında bütün siparişler, ödemeler ve borç görünür; buradan WhatsApp ile bakiye hatırlatması gönderilebilir.
- **Alışlar:**
  - Fatura girilirken "Peşin ödendi" seçilebilir ya da vade girilip ödemeler sonradan eklenebilir.
  - "Stoğa giren kalemler" satırları stoğu artırır.
- **Tedarikçiler:** Toplam alış, ödenen tutar, kalan borç ve vadesi geçmiş borç tedarikçi bazında görünür.
- **Giderler:** Her gider, ödendiği hesaptan düşülür.
- **Kasa ve banka:** Her hesabın bakiyesi ve aylık hareketleri görünür. Kasadan bankaya para yatırma gibi işlemler için "Transfer" kullanılır. Başlangıç bakiyeleri Ayarlar ekranından girilir.
- **Kalemler ve stok:**
  - Kumaş, ray ve aksesuar gibi kalemlerde stok takibi açılabilir.
  - Alış faturasıyla stok artar; sipariş ve teslimlerle düşer (teklifler düşmez).
  - Uyarı seviyesinin altına inen kalem özet ekranında görünür.
  - Depo sayıldığında "Sayım gir" ile düzeltilir.
- **Yıllık rapor:** 12 ay yan yana; satışlar geçen yılın aynı ayıyla karşılaştırılır. Grafik, yazdırma ve yıllık Excel bu ekrandadır.
- **Muhasebeci için Excel (.xlsx):** Dosyada şu sayfalar bulunur: Özet, Satışlar, Satış kalemleri, Tahsilatlar, Alışlar, Giderler.
- **PDF kontrol:** PDF tarayıcıda okunur, sunucuya yüklenmez.
  - Tedarikçi faturası: fatura no, tarih, VKN, matrah, KDV ve genel toplam okunur; "matrah + KDV = toplam" kontrol edilir. Aynı fatura no daha önce kaydedildiyse uyarır. "Alış olarak kaydet" formu doldurur; kaydetmeden önce kontrol edilir.
  - Sipariş ve teklif formu: her satırda miktar × birim fiyat = tutar ve toplamlar kontrol edilir.
  - Etiket PDF'i: sayfa ölçüsü ayarlardaki etiket ölçüsüyle karşılaştırılır.
  - Taranmış (resim) PDF'lerde metin okunamaz.
- **Etiket yazdır:** Siparişin satırlarından askı etiketi çıkarır. Ölçü (mm) etiket rulosuna göre ayarlanır. Yazdırırken yazıcı olarak etiket makinesi, kağıt olarak aynı ölçü seçilir.
- **Yedek:**
  - Sunucu her hafta panele ilk girişte otomatik yedek alır; son 6 yedek saklanır.
  - Ayarlar ekranından herhangi bir yedeğe geri dönülebilir; dönmeden önce o anki hâlin de yedeği alınır.
  - Ayrıca bilgisayara JSON yedek indirilebilir; özet ekranı 7 günde bir hatırlatır.
  - Fotoğraflar yedeklere girmez.
- **Telefon:** Panel telefona göre düzenlenir. iPhone'da Safari → Paylaş → "Ana Ekrana Ekle"; Android'de Chrome → "Ana ekrana ekle".
