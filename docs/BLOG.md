# Bey Perde Journal — yazı ekleme

Yazılar `src/content/blog/` klasöründe, her biri ayrı bir `.md` (Markdown) dosyasıdır.
Adres: `/<dil>/blog/<adres>` (adres verilmezse dosya adı kullanılır).

## Dosya biçimi

```
---
baslik: Yazının başlığı
seo_baslik: Google'da görünecek başlık          # isteğe bağlı; yoksa başlık kullanılır
aciklama: Arama sonucunda görünecek özet (en fazla 155 karakter).
kategori: perde-rehberi                        # aşağıdaki listeden biri
tarih: 2026-11-20                              # yayın tarihi
guncelleme: 2026-12-01                         # isteğe bağlı: sonradan güncellendiyse
yazar: Bey Perde                               # gerçek kişi ya da işletme adı
kapak: blog/yazi-adi/kapak                     # src/images içindeki görsel (uzantısız)
urunler: tul-perde, fon-perde                  # yazıda gerçekten geçen ürünler, en fazla 3
etiketler: Tül perde, Bakım
dil: tr                                        # tr | en | ar
ceviri: tul-perde-secimi                       # aynı yazının çevirilerini bağlayan ortak anahtar (isteğe bağlı)
adres: tul-perde-secerken                      # isteğe bağlı; çevirilerde hepsi aynı adresi kullanır
one_cikan: evet                                # isteğe bağlı: öne çıkan yazıyı elle seçer (yoksa en yenisi)
taslak: hayır                                  # "evet" ise yayınlanmaz
---

Giriş paragrafı...

## Ara başlık

Metin. **Kalın**, *italik*, [bağlantı](/tr/urunler/perde/tul-perde).

> Alıntı bloğu

![Fotoğrafın açıklaması](blog/yazi-adi/foto-1 "İsteğe bağlı fotoğraf altyazısı")
```

**Kategoriler:** `perde-rehberi` (Perde Rehberi), `duvar-kagidi` (Duvar Kağıdı), `dekorasyon` (Dekorasyon),
`kumas-ve-dokular` (Kumaş ve Dokular), `atolyeden` (Atölyeden), `proje-hikayeleri` (Proje Hikâyeleri).
Listede yalnızca yazısı olan kategoriler görünür; süzgeç `?kategori=<anahtar>` ile paylaşılabilir.

**Ürün anahtarları:** `src/content/data.py` içindeki `PRODUCTS` (örn. `tul-perde`, `fon-perde`, `tekstil`, `sisal`).

**Kurallar**
- `tarih` bugünden ileri ise yazı o güne kadar yayınlanmaz (o gün site yeniden derlenip yüklenmelidir).
- Bir yazı yalnızca yazıldığı dilde yayınlanır; İngilizce/Arapça çeviri ayrı bir dosyadır (`dil: en`, aynı `ceviri` ve `adres`).
- Yazıda `#` yerine `##` ve `###` kullanın; sayfanın tek H1'i `baslik` alanıdır. 4 veya daha fazla `##` başlık varsa içindekiler otomatik çıkar.
- Fotoğraflar `src/images/blog/<yazi-adi>/` klasörüne konur ve `python3 tools/images.py` çalıştırılır.
  Bey Perde uygulaması olmayan (stok/temsilî) bir görsel kullanılırsa altyazıda bunu belirtin.

## Yayınlama

```
python3 tools/images.py   # yeni fotoğraf eklendiyse
python3 src/build.py
npm test
git add -A && git commit -m "Journal: yeni yazı" && git push
```

Liste sayfası, öne çıkan yazı, kategori süzgeci, ilgili yazılar, site haritası ve Google için yapılandırılmış veri (BlogPosting, BreadcrumbList) otomatik güncellenir.

## İleri tarihli yayın

`tarih` alanı bugünden sonraki bir gün olan yazı derlenmez; o tarihte (ya da sonrasında) yapılan ilk derleme ve yayınla otomatik olarak yayına girer. Yayına girmemiş bir yazıya verilen bağlantılar o güne kadar düz metin olarak gösterilir.

Belirli bir günü önceden denemek için: `BP_TODAY=2026-11-27 python3 src/build.py` (denedikten sonra normal `python3 src/build.py` ile yeniden derleyin).

## SSS (Sıkça sorulan sorular)

Yazının sonuna `## Sıkça sorulan sorular` başlığı ve altına her soru için `### Soru?` ve cevap paragrafı eklenirse, bu bölüm Google ve yapay zekâ aramaları için otomatik olarak FAQPage şemasına dönüştürülür.
