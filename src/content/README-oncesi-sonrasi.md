# Öncesi / sonrası karşılaştırması

Bileşen hazır ama yayında **gizli**: `compare.json` boş olduğu sürece hiçbir sayfada görünmez.
Gerçek bir uygulamanın öncesi ve sonrası fotoğrafları olduğunda:

1. Fotoğrafları `src/images/projeler/<proje>/` altına `.webp` olarak koyun (aynı açı, aynı kadraj).
2. `python3 tools/images.py` çalıştırın.
3. `src/content/compare.json` dosyasına ekleyin:

```json
[
  {
    "project": "erenkoy-hk-evi",
    "before": "projeler/erenkoy-hk-evi/salon-once",
    "after": "projeler/erenkoy-hk-evi/salon-sonra",
    "ratio": "4/3",
    "before_alt": {"tr": "…", "en": "…", "ar": "…"},
    "after_alt": {"tr": "…", "en": "…", "ar": "…"},
    "caption": {"tr": "…", "en": "…", "ar": "…"}
  }
]
```

4. `python3 src/build.py`. Karşılaştırma anasayfadaki Uygulamalar bölümünde, Projeler sayfasında ve
   `project` alanı eşleşen proje sayfasında çıkar. Sürgü fare, dokunmatik ve klavye (ok tuşları) ile çalışır.
