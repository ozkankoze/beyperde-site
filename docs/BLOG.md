# Blog yazısı ekleme

Yazılar `src/content/blog/` klasöründe, her biri ayrı bir `.md` (Markdown) dosyasıdır.
Dosya adı yazının adresi olur: `tul-perde-secerken.md` → `/tr/blog/tul-perde-secerken`.

## Dosya biçimi

```
---
baslik: Yazının başlığı
tarih: 2026-11-20
aciklama: Google'da görünecek kısa özet (en fazla 155 karakter).
kapak: blog/yazi-adi/kapak          # src/images içindeki görsel (uzantısız); boş bırakılabilir
etiketler: Tül perde, Bakım
taslak: hayır                       # "evet" yazarsanız yayınlanmaz
guncelleme: 2026-12-01              # isteğe bağlı: yazıyı sonradan güncellediyseniz
---

Giriş paragrafı...

## Ara başlık

Metin. **Kalın**, *italik*, [bağlantı](/tr/urunler/perde/tul-perde).

- madde
- madde

![Fotoğrafın açıklaması](blog/yazi-adi/foto-1)
```

- `tarih` bugünden ileri ise yazı o gün gelene kadar yayınlanmaz (zamanlanmış yazı).
- Fotoğraflar `src/images/blog/<yazi-adi>/` klasörüne konur; ardından `python3 tools/images.py` çalıştırılır.
- Yazının içinde `#` yerine `##` ve `###` kullanın; sayfa başlığı (H1) otomatik olarak `baslik` alanından gelir.

## Yayınlama

```
python3 tools/images.py   # yeni fotoğraf eklendiyse
python3 src/build.py
npm test
git add -A && git commit -m "Blog: yeni yazı" && git push
```

Blog sayfası, menüdeki "Blog" bağlantısı, site haritası ve Google için yapılandırılmış veri (BlogPosting) otomatik güncellenir.
