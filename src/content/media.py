# -*- coding: utf-8 -*-
"""Bey Perde'nin gönderdiği uygulama fotoğrafları ve videoları (ürün ve model sayfaları).

Açıklamalar yalnızca fotoğrafta görüneni anlatır. (görsel anahtarı, Türkçe alt, İngilizce alt)
"""

# Ürün sayfalarına eklenen fotoğraflar (galerinin başına, ilk fotoğraftan sonra eklenir)
PROD_IMGS = {
    'plicell-perde': [
        ('urunler/plicell-perde/tavan-plicell-salon', 'Eğimli tavan camlarında motorlu siyah plicell perde', 'Motorised black pleated blinds on sloping roof glazing'),
        ('urunler/plicell-perde/tavan-plicell-genis', 'Çatı camları ve yüksek pencerelerde plicell ve tül', 'Pleated blinds on roof glazing with sheers on the tall windows'),
        ('urunler/plicell-perde/pastane-plicell', 'Vitrin camında siyah plicell perde', 'A black pleated blind on a shop window'),
        ('urunler/plicell-perde/pastane-plicell-yarim', 'Yarıya kadar açılmış siyah plicell perde', 'A black pleated blind opened halfway'),
        ('urunler/plicell-perde/motorlu-plicell-lounge', 'Geniş cam cephede koyu renk plicell perdeler', 'Dark pleated blinds across a wide glass façade'),
        ('urunler/plicell-perde/motorlu-plicell-cephe', 'Cephe boyunca sıralanan plicell perdeler', 'Pleated blinds lined up along the façade'),
        ('urunler/plicell-perde/motorlu-plicell-oturma', 'Oturma alanında koyu plicell perdeler', 'Dark pleated blinds in a lounge'),
    ],
    'katlamali-perde': [
        ('urunler/katlamali-perde/tul-katlamali-cift', 'Bahçe kapısında gri tül katlamalı perdeler', 'Grey sheer Roman blinds on a garden door'),
        ('urunler/katlamali-perde/sari-katlamali', 'Cam balkonda hardal rengi katlamalı perde', 'A mustard Roman blind on a glazed balcony'),
        ('urunler/katlamali-perde/merdiven-katlamali', 'Merdiven boşluğundaki pencerelerde bordürlü katlamalı perde', 'Bordered Roman blinds on stairwell windows'),
        ('urunler/katlamali-perde/tul-katlamali-tek', 'Tek pencerede gri tül katlamalı perde', 'A grey sheer Roman blind on a single window'),
        ('urunler/katlamali-perde/tul-katlamali-yakin', 'Tül katlamalı perdenin katları', 'The folds of a sheer Roman blind'),
    ],
    'dikey-perde': [
        ('urunler/dikey-perde/ofis-dikey', 'Ofis penceresinde gri dikey perde', 'A grey vertical blind on an office window'),
        ('urunler/dikey-perde/manzara-dikey', 'Şehir manzaralı pencerede açık dikey perde', 'An open vertical blind on a city-view window'),
    ],
    'stor-perde': [
        ('projeler/surat-kargo/toplanti', 'Ofiste her cama ayrı stor perde', 'Separate roller blinds on each pane in an office'),
        ('urunler/stor-perde/screen-stor-ofis', 'Ofiste dört ayrı screen stor', 'Four separate screen roller blinds in an office'),
    ],
    'jaluzi-perde': [
        ('projeler/md-ofis/kemerler', 'Kemerli ofis pencerelerinde metal jaluzi', 'Metal Venetian blinds on arched office windows'),
        ('projeler/rapsodi/salon-jaluzi', 'Salonda tül ve fonun yanında ahşap jaluzi', 'A wooden Venetian blind beside sheer and drape in a living room'),
        ('projeler/birbahce/banyo-jaluzi', 'Banyoda boydan koyu ahşap jaluzi', 'A tall dark wooden Venetian blind in a bathroom'),
    ],
    'rustik-perde': [
        ('urunler/rustik-perde/altin-fon-salon', 'Altın rustiklerde çapraz toplanmış desenli fon perdeler', 'Patterned drapes swept to the side on gold poles'),
        ('urunler/rustik-perde/altin-fon-kose', 'Püsküllü tutucuyla toplanan desenli fon', 'A patterned drape gathered with a tassel tieback'),
        ('urunler/rustik-perde/mermer-rustik', 'Mermer top başlıklı siyah rustik', 'A black pole with a marble ball finial'),
        ('urunler/rustik-perde/yildiz-baslik', 'Rustikte pileli fon perde', 'A pleated drape on a pole'),
        ('urunler/rustik-perde/altin-fon-sol', 'Koltuk köşesinde altın rustik ve desenli fon', 'A gold pole and patterned drape in a corner'),
    ],
    'fon-perde': [
        ('urunler/fon-perde/gri-fon-salon', 'Gizli ışıklı tavanın altında gri fon ve tül', 'Grey drapes and sheers under a cove-lit ceiling'),
        ('urunler/rustik-perde/altin-fon-salon', 'Çapraz toplanmış desenli fon perdeler', 'Patterned drapes swept to the side'),
        ('urunler/fon-perde/gri-fon-oturma', 'Oturma alanında gri fon ve tül', 'Grey drapes and sheers in a sitting area'),
        ('projeler/birbahce/salon', 'Dekoratif alınlıklı salonda kahverengi fon ve tül', 'Brown drapes and sheers under a decorative pelmet'),
    ],
}

# Model sayfalarına (alt kategori) eklenen fotoğraflar ve videolar
SUB_MEDIA = {
    'dekoratif-alinlik': {
        'imgs': [
            ('urunler/perde-aksesuarlari/beyaz-alinlik-salon', 'Yüksek salonda beyaz dekoratif alınlık, tül ve dikey perde', 'A white decorative pelmet over sheers in a tall living room'),
            ('urunler/perde-aksesuarlari/alinlik-ray', 'Dekoratif alınlığın içindeki ray sistemi', 'The track inside a decorative pelmet'),
            ('urunler/perde-aksesuarlari/beyaz-alinlik-yuksek', 'Yüksek pencerede beyaz alınlık ve tül', 'A white pelmet and sheer on a tall window'),
            ('urunler/perde-aksesuarlari/gri-alinlik-bahce', 'Bahçe kapısının üstünde antrasit alınlık', 'An anthracite pelmet above a garden door'),
            ('urunler/perde-aksesuarlari/gri-alinlik-oda', 'Köşe pencerelerde duvardan duvara alınlık', 'A wall-to-wall pelmet across corner windows'),
            ('urunler/perde-aksesuarlari/gri-alinlik-avlu', 'Pencere üstünde antrasit dekoratif alınlık', 'An anthracite decorative pelmet over a window'),
            ('urunler/perde-aksesuarlari/alinlik-tavan', 'Tavana sıfır dekoratif alınlık', 'A decorative pelmet flush with the ceiling'),
            ('urunler/perde-aksesuarlari/alinlik-pencere', 'Alınlığın pencereyle birleştiği köşe', 'Where the pelmet meets the window'),
            ('urunler/perde-aksesuarlari/alinlik-yakin', 'Dekoratif alınlığın yakından görünümü', 'Close-up of a decorative pelmet'),
            ('urunler/perde-aksesuarlari/kis-bahcesi-genel', 'Kış bahçesinde camlar boyunca uzanan perde kasası', 'A blind cassette along the glazing of a winter garden'),
            ('urunler/perde-aksesuarlari/kis-bahcesi-manzara', 'Ahşap tavanlı kış bahçesinde kasa', 'A cassette in a winter garden with a timber ceiling'),
            ('urunler/perde-aksesuarlari/kis-bahcesi-uzun', 'Kış bahçesinin uzun cephesinde kasa', 'A cassette along the long side of a winter garden'),
            ('urunler/perde-aksesuarlari/kis-bahcesi-kose', 'Kış bahçesinde köşeyi dönen kasa', 'A cassette turning the corner of a winter garden'),
            ('urunler/perde-aksesuarlari/kis-bahcesi-egik', 'Eğimli camlarda kasa birleşimi', 'Cassettes meeting on angled glazing'),
            ('urunler/perde-aksesuarlari/kis-bahcesi-bahce', 'Bahçeye bakan kış bahçesi camları boyunca kasa', 'A cassette along winter-garden windows facing the garden'),
            ('urunler/perde-aksesuarlari/kis-bahcesi-kasa', 'Kış bahçesinde camlar boyunca kasa', 'Cassettes along winter-garden glazing'),
        ],
        'video': ('/video/urunler/dekoratif-alinlik.mp4', 'urunler/video/dekoratif-alinlik'),
    },
    'rustik-aksesuar': {'imgs': [
        ('urunler/rustik-perde/mermer-rustik', 'Mermer top başlıklı siyah rustik', 'A black pole with a marble ball finial'),
        ('projeler/yenibosna/mermer-top-rustik', 'Mermer başlıklı rustikte astarlı fon', 'A lined drape on a marble-finial pole'),
        ('urunler/rustik-perde/pirinc-boru', 'Oluklu pirinç rustik boru', 'A fluted brass pole'),
    ]},
    'mermer-renso': {'imgs': [
        ('urunler/rensolar/mermer-renso', 'Mermer başlıklı renso ile toplanan fon perde', 'A drape gathered with a marble-knob renso'),
    ]},
    'ahsap-renso': {'imgs': [
        ('urunler/rensolar/ahsap-renso-ip', 'Örgü ip ve püsküllü tutucuyla toplanan lacivert fon', 'A navy drape gathered with a braided tassel tieback'),
        ('urunler/rensolar/ahsap-renso-ip-2', 'Ahşap kaplamalı duvarda örgü tutucu', 'A braided tieback against a timber-clad wall'),
    ]},
    'metal-renso': {
        'imgs': [('urunler/rensolar/metal-renso', 'Gri fonu toplayan metal renso', 'A metal renso holding back a grey drape')],
        'video': ('/video/urunler/fon-metal-tutucu.mp4', 'urunler/video/fon-metal-tutucu'),
    },
    'aluminyum-jaluzi': {'imgs': [
        ('projeler/md-ofis/kemerler', 'Kemerli ofis pencerelerinde metal jaluzi', 'Metal Venetian blinds on arched office windows'),
        ('projeler/md-ofis/toplanti', 'Toplantı masasının arkasında metal jaluzi', 'A metal Venetian blind behind a meeting table'),
        ('projeler/md-ofis/merdiven', 'Merdiven boşluğundaki kemerli pencerede metal jaluzi', 'A metal Venetian blind on an arched stairwell window'),
    ]},
    'motorlu-plise': {'imgs': [
        ('urunler/plicell-perde/tavan-plicell-salon', 'Eğimli tavan camlarında motorlu plicell', 'Motorised pleated blinds on sloping roof glazing'),
    ]},
    'screen-stor': {'imgs': [
        ('urunler/stor-perde/screen-stor-ofis', 'Ofiste her cama ayrı screen stor', 'Separate screen roller blinds on each pane'),
        ('urunler/stor-perde/screen-stor-ofis-2', 'Screen stor, şehir manzarası görünür kalıyor', 'Screen blinds keeping the city view visible'),
    ]},
    'tul-katlamali': {'imgs': [
        ('urunler/katlamali-perde/tul-katlamali-cift', 'Bahçe kapısında gri tül katlamalı perdeler', 'Grey sheer Roman blinds on a garden door'),
        ('urunler/katlamali-perde/tul-katlamali-tek', 'Tek pencerede tül katlamalı perde', 'A sheer Roman blind on a single window'),
    ]},
    'bordurlu-katlamali': {'imgs': [
        ('urunler/katlamali-perde/merdiven-katlamali', 'Merdiven pencerelerinde bordürlü katlamalı perde', 'Bordered Roman blinds on stairwell windows'),
    ]},
}

# Ürün sayfalarına eklenen videolar (sesi kapalı)
PROD_VIDEO = {
    'fon-perde': ('/video/urunler/fon-metal-tutucu.mp4', 'urunler/video/fon-metal-tutucu'),
    'perde-aksesuarlari': ('/video/urunler/dekoratif-alinlik.mp4', 'urunler/video/dekoratif-alinlik'),
}

VIDEO_TXT = {'tr': 'Uygulamadan video', 'en': 'Video from the installation', 'ar': 'Video from the installation'}

# Yeni ürünler: Çatı Katı Perdeleri ve Pile Çeşitleri
NEW_PRODUCTS = {
    'cati-kati-perde': {
        'name': ('Çatı Katı Perdeleri', 'Attic Curtains'),
        'short': ('Eğimli ve üçgen çatı pencerelerine kruvaze, ölçüye özel perde.', 'Made-to-measure, crossed curtains for sloping and gable attic windows.'),
        'imgs': [
            ('urunler/cati-kati-perde/kruvaze-tul-salon', 'Üçgen çatı penceresinde kruvaze toplanmış tül', 'A crossed sheer on a gable attic window'),
            ('urunler/cati-kati-perde/egimli-tul-balkon', 'Eğimli çatı kapısında çapraz toplanan tül', 'A sheer swept across a sloping attic door'),
            ('urunler/cati-kati-perde/egimli-fon-mor', 'Eğimli pencerede kuşakla toplanan mor fon', 'A plum drape tied back on a sloping window'),
            ('urunler/cati-kati-perde/kruvaze-tul-oda', 'Çatı odasında kruvaze tül', 'A crossed sheer in an attic room'),
        ],
        'tr': {
            'lead': 'Eğimli ve üçgen çatı pencereleri için ölçüye göre kesilen, kruvaze toplanan perdeler.',
            'h2': 'Eğime göre dikilen perde',
            'intro': ('Çatı katlarında pencereler çoğu zaman düz değildir: tavanla birlikte eğilir ya da üçgen bir tepe yapar. '
                      'Hazır perdeler bu pencerelerde ya boşluk bırakır ya da kumaş yere yığılır. Biz önce pencerenin eğimini ve tepe noktasını yerinde ölçüyoruz, '
                      'rayı eğimin açısına göre kuruyoruz ve kumaşı bu açıya göre kesip dikiyoruz. Böylece perdenin üst kenarı tavan çizgisini takip eder, '
                      'etekleri yere eşit düşer.\n\n'
                      'En sık uyguladığımız model kruvaze perdedir: iki kanat tepeden ayrılır ve yanlarda tutucularla çapraz toplanır. '
                      'Bu sayede gün içinde pencerenin ortası açık kalır, ışık rahatça girer; akşam tutucular çözüldüğünde perde pencereyi tamamen kapatır. '
                      'Tül, fon ya da ikisi birlikte kullanılabilir; tek kanatlı eğimli kapılarda kumaş yana doğru çapraz toplanır.\n\n'
                      'Çatı katı işçiliğinde önemli olan ayrıntılar şunlardır: eğimli rayda pilelerin kaymaması için sık aralıklı askı, '
                      'tepe noktasında iki kanadın düzgün birleşmesi, kumaşın eğim boyunca aynı pile aralığıyla dikilmesi ve tutucuların '
                      'perdenin ağırlığını taşıyacak şekilde doğru yüksekliğe takılması. Ölçü, dikim ve montajı aynı ekip yaptığı için bu ayrıntılar baştan planlanır.'),
        },
        'en': {
            'lead': 'Curtains cut to the slope of attic and gable windows and gathered in a crossed style.',
            'h2': 'Curtains made to the slope',
            'intro': ('Attic windows are rarely square: they follow the roof or rise to a gable. Ready-made curtains leave gaps or pool on the floor. '
                      'We measure the slope and the apex on site, fit the track at the same angle and cut and sew the fabric to it, so the heading follows the ceiling line and the hem falls evenly.\n\n'
                      'Our most common style is the crossed (kruvaze) curtain: two panels part at the apex and are swept back to the sides with holdbacks, '
                      'leaving the centre open for light by day and closing completely at night. Sheers, drapes or both can be used.\n\n'
                      'The details that matter in attic work: closely spaced gliders so pleats do not slide on the sloping track, a neat meeting at the apex, '
                      'even pleat spacing along the slope and holdbacks fitted at the right height to carry the weight. The same team measures, sews and fits, so these are planned from the start.'),
        },
        'rooms': ['yatak', 'salon', 'cocuk', 'calisma'],
        'materials': (['Tül', 'Fon', 'Eğime göre kurulan ray'], ['Sheer', 'Drape', 'Track fitted to the slope']),
        'adv': (['Eğime ve tepe noktasına göre ölçü', 'Kruvaze toplama: gündüz ışık, gece tam kapanış', 'Ölçü, dikim ve montaj aynı ekipten'],
                ['Measured to the slope and apex', 'Crossed style: light by day, full cover at night', 'Measured, sewn and fitted by one team']),
        'related': ['tul-perde', 'fon-perde', 'rensolar', 'perde-aksesuarlari'],
    },
    'pile-cesitleri': {
        'name': ('Pile Çeşitleri', 'Pleat Styles'),
        'short': ('Büzgü, kutu pile, kalem pile, çift pile, halkalı ve askılı: perdenin üst kenarı nasıl dikilir.', 'Gathered, box, pencil, pinch, eyelet and tab: how a curtain heading is made.'),
        'imgs': [
            ('urunler/pile-cesitleri/tul-pileler', 'Ofisimizde tülde dokuz farklı pile örneği', 'Nine heading styles on sheers in our showroom'),
            ('urunler/pile-cesitleri/fon-pileler', 'Fon kumaşta altı farklı pile örneği', 'Six heading styles on drape fabric'),
        ],
        'tr': {
            'lead': 'Perdenin nasıl düşeceğini pile belirler. Ofisimizde örnekleri yan yana görebilirsiniz.',
            'h2': 'Aynı kumaş, farklı duruş',
            'intro': ('Pile, perdenin üst kenarının nasıl toplanıp dikildiğidir; aynı kumaş farklı pileyle bambaşka durur. '
                      'Ofisimizde tül ve fon kumaşta pile örneklerini rustik borular üzerinde sergiliyoruz: büzgülü (sık toplanan, yumuşak), '
                      'kutu pile (düz ve düzenli katlar), kalem pile (ince, sık dikey katlar), çift ve üçlü pile (tepesi toplanmış klasik katlar), '
                      'metal halkalı (boruya geçen büyük dalgalar), askılı (kumaş şeritlerle boruya asılan) ve bağcıklı modeller. '
                      'Hangi pilenin size uygun olduğunu kumaşın ağırlığına, rayın ya da rustiğin tipine ve odanın tarzına göre birlikte seçiyoruz.'),
        },
        'en': {
            'lead': 'The heading decides how a curtain falls. You can see the samples side by side in our showroom.',
            'h2': 'Same fabric, different fall',
            'intro': ('The heading is how the top of a curtain is gathered and sewn; the same fabric hangs very differently with each. '
                      'In our showroom we display sheer and drape samples on poles: gathered, box pleat, pencil pleat, double and triple pinch pleat, '
                      'eyelet, tab-top and tie-top. We choose the right one with you based on the fabric weight, the track or pole and the style of the room.'),
        },
        'rooms': ['salon', 'yatak', 'yemek', 'cocuk'],
        'materials': (['Tül', 'Fon'], ['Sheer', 'Drape']),
        'adv': (['Örnekleri ofiste görebilirsiniz', 'Kumaş ağırlığına göre pile seçimi', 'Raya ya da rustiğe uygun dikim'],
                ['See the samples in our showroom', 'Heading chosen for the fabric weight', 'Sewn to suit the track or pole']),
        'related': ['fon-perde', 'tul-perde', 'rustik-perde', 'perde-aksesuarlari'],
    },
}
