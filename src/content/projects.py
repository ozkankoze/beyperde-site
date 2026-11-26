# -*- coding: utf-8 -*-
"""Bey Perde'nin gönderdiği fotoğraflarla eklenen projeler.

Metinler yalnızca fotoğraflarda görüneni anlatır; tarih, ölçü ya da müşteri bilgisi eklenmemiştir.
"""


def T(tr, en, ar):
    return {'tr': tr, 'en': en, 'ar': ar}


AKCEKESE = {
    'slug': 'sile-akcekese',
    'hero': 'projeler/sile-akcekese/salon-yemek',
    'products': ['tul-perde', 'fon-perde', 'jaluzi-perde', 'perde-aksesuarlari', 'sisal'],
    'location': T('Akçekese, Şile, İstanbul', 'Akçekese, Şile, Istanbul', 'أكتشه كيسه، شيله، إسطنبول'),
    'h1': T('Şile Akçekese Projesi', 'Şile Akçekese Project', 'مشروع أكتشه كيسه في شيله'),
    'lead': T('Bahçeye bakan geniş pencerelerde keten dokulu tül ve fon perdeler, ahşap boncuklu tutucular, ahşap jaluzi ve evin farklı odalarında sisal halılar.',
              'Linen-textured sheers and drapes on wide garden windows, wooden bead holdbacks, a wooden Venetian blind and sisal rugs in several rooms of the house.',
              'تول وستائر بملمس الكتان على نوافذ واسعة مطلة على الحديقة، ومشابك من حبات خشبية، وجالوزي خشبي، وسجاد سيزال في عدة غرف من البيت.'),
    'h2': T('Doğal dokular, sakin tonlar', 'Natural textures, quiet tones', 'ملامس طبيعية وألوان هادئة'),
    'intro': T('Bu evde perde, halı ve aksesuarları aynı doğal doku ailesinden seçtik: keten görünümlü tüller, ince çizgili fon perdeler, ahşap tutucular ve hasır dokulu sisal halılar. Aşağıdaki fotoğraflar uygulamadan.',
               'In this house we chose the curtains, rugs and accessories from the same family of natural textures: linen-look sheers, finely striped drapes, wooden holdbacks and woven sisal rugs. The photographs below are from the installation.',
               'في هذا البيت اخترنا الستائر والسجاد والإكسسوارات من عائلة الملامس الطبيعية نفسها: تول بمظهر الكتان، وستائر بخطوط رفيعة، ومشابك خشبية، وسجاد سيزال منسوج. الصور أدناه من التنفيذ.'),
    'groups': [
        {'h': T('Tül ve fon perdeler', 'Sheers and drapes', 'التول والستائر'),
         'p': T('Salon ve yemek alanındaki geniş pencerelerde tavan rayına pileli dikilmiş fon perdeler ve yere kadar inen keten dokulu tüller.',
                'Pleated drapes on ceiling tracks and floor-length linen-textured sheers on the wide windows of the living and dining area.',
                'ستائر بطيات على سكك السقف وتول بملمس الكتان يصل إلى الأرض على النوافذ الواسعة في منطقة المعيشة والطعام.'),
         'items': [
             ('salon-yemek', T('Salon ve yemek alanı; pencerelerde tül ve fon perdeler', 'Living and dining area, with sheers and drapes on the windows', 'منطقة المعيشة والطعام، مع التول والستائر على النوافذ')),
             ('salon-tul-fon', T('Ahşap tutucuyla toplanmış fon perde ve arkasında boydan boya tül', 'A drape gathered with a wooden holdback, a full-width sheer behind it', 'ستارة مجموعة بمشبك خشبي وخلفها تول بعرض الجدار')),
             ('pile-detay', T('Tavan rayında pileli fon perde ve tülün yakından görünümü', 'Close-up of the pleated drape and sheer on the ceiling track', 'لقطة قريبة للستارة ذات الطيات والتول على سكة السقف')),
             ('keten-tul-bahce', T('Bahçeye bakan pencerede keten dokulu tül', 'Linen-textured sheer on a window facing the garden', 'تول بملمس الكتان على نافذة مطلة على الحديقة')),
             ('pencere-tul', T('Koyu renk ray üzerinde yere kadar inen tül', 'Floor-length sheer on a dark track', 'تول يصل إلى الأرض على سكة داكنة')),
         ]},
        {'h': T('Ahşap tutucular', 'Wooden holdbacks', 'المشابك الخشبية'),
         'p': T('Fon perdeleri toplamak için ahşap boncuklardan yapılmış tutucular kullandık; ince çizgili keten kumaşla aynı doğal tonda.',
                'We gathered the drapes with holdbacks made of wooden beads, in the same natural tone as the finely striped linen.',
                'استخدمنا لجمع الستائر مشابك مصنوعة من حبات خشبية، بنفس الدرجة الطبيعية للكتان ذي الخطوط الرفيعة.'),
         'items': [
             ('ahsap-tutucu', T('İnce çizgili keten fon perdede ahşap boncuklu tutucu', 'Wooden bead holdback on a finely striped linen drape', 'مشبك بحبات خشبية على ستارة كتان بخطوط رفيعة')),
             ('tutucu-detay', T('Ahşap boncuklu tutucular ve çizgili keten kumaş', 'Wooden bead holdbacks and striped linen fabric', 'مشابك بحبات خشبية وقماش كتان مخطط')),
         ]},
        {'h': T('Ahşap jaluzi', 'Wooden venetian blind', 'جالوزي خشبي'),
         'p': T('Bir pencerede, kutu içine monte edilmiş bal tonunda ahşap jaluzi.',
                'On one window, a honey-toned wooden venetian blind fitted inside a box pelmet.',
                'على إحدى النوافذ جالوزي خشبي بلون العسل مركّب داخل علبة.'),
         'items': [
             ('ahsap-jaluzi', T('Kutu içine monte edilmiş bal tonunda ahşap jaluzi', 'Honey-toned wooden venetian blind fitted inside a box pelmet', 'جالوزي خشبي بلون العسل مركّب داخل علبة')),
         ]},
        {'h': T('Sisal halılar', 'Sisal rugs', 'سجاد السيزال'),
         'p': T('Yatak odasında kenarı şeritli dikdörtgen, mutfakta yuvarlak sisal halılar.',
                'A rectangular sisal rug with a bound border in the bedroom, and round sisal rugs in the kitchen.',
                'سجادة سيزال مستطيلة بحافة مطوّقة في غرفة النوم، وسجاد سيزال دائري في المطبخ.'),
         'items': [
             ('yatak-odasi-sisal', T('Yatak odasında kenarı şeritli sisal halı', 'Sisal rug with a bound border in the bedroom', 'سجادة سيزال بحافة مطوّقة في غرفة النوم')),
             ('mutfak-yuvarlak-sisal', T('Yeşil dolaplı mutfakta yuvarlak sisal halı', 'Round sisal rug in a kitchen with green cabinets', 'سجادة سيزال دائرية في مطبخ بخزائن خضراء')),
             ('mutfak-sisal-genel', T('Mutfağın ortasında yuvarlak sisal halı', 'Round sisal rug in the middle of the kitchen', 'سجادة سيزال دائرية في وسط المطبخ')),
         ]},
    ],
}



def T2(tr, en):
    return T(tr, en, en)


SUADIYE = {
    'slug': 'suadiye',
    'short': 'Suadiye',
    'hero': 'projeler/suadiye/jaluzi-bahce',
    'products': ['jaluzi-perde', 'motorlu-jaluzi'],
    'location': T2('Suadiye, Kadıköy, İstanbul', 'Suadiye, Kadıköy, Istanbul'),
    'h1': T2('İ.U Suadiye Evi', 'İ.U Suadiye House'),
    'title_tail': T2('Motorlu Ahşap Jaluzi', 'Motorised Wooden Blinds'),
    'lead': T2('Bahçeye açılan boydan boya camlarda krem renkli, motorlu ahşap jaluziler. Tüm cephe tek kumandayla açılıp kapanıyor.',
               'Cream motorised wooden blinds across floor-to-ceiling garden windows. The whole façade opens and closes from a single remote.'),
    'h2': T2('Bahçe tarafında tek tuşla konfor', 'One-touch comfort on the garden side'),
    'intro': T2('Salonun bahçeye bakan cephesi boydan boya camlardan oluşuyor. Bu kadar geniş bir yüzeyde jaluzileri tek tek elle açıp kapatmak zahmetli olurdu; motorlu sistem sayesinde ev sahibi koltuğundan kalkmadan, tek kumandayla bütün cepheyi açıyor, kapatıyor ya da kanatların açısını ayarlıyor. Sabah bahçe ışığını içeri almak, öğleden sonra güneşi kırmak ya da akşam mahremiyeti sağlamak birkaç saniye sürüyor. Aşağıdaki videoda sistemi kumandayla çalışırken görebilirsiniz.',
                'The living room\'s garden façade is glazed from floor to ceiling. Opening and closing blinds by hand across such a wide surface would be a chore; with the motorised system the owner opens, closes or tilts the whole façade from a single remote without getting up. Letting the garden light in each morning, softening the afternoon sun or closing up for privacy in the evening takes a few seconds. The video below shows the system running from the remote.'),
    'video': {'src': '/video/projeler/suadiye-motorlu-jaluzi.mp4', 'poster': 'projeler/suadiye/video-kapak',
              'h': T2('Kumandayla çalışırken', 'Running from the remote'),
              'p': T2('Bahçe cephesindeki jaluziler tek kumandayla birlikte iniyor, kalkıyor ve kanat açısı ayarlanıyor.',
                      'The garden-side blinds lower, rise and tilt together from one remote.')},
    'groups': [
        {'h': T2('Bahçe cephesinde motorlu ahşap jaluzi', 'Motorised wooden blinds on the garden façade'),
         'p': T2('Krem tonlu geniş ahşap lameller, şerit merdivenlerle birlikte salonun klasik çizgisine uyuyor. Motor ve mekanizma üst kasanın içinde, göz önünde değil.',
                 'Wide cream wooden slats with tape ladders suit the room\'s classic lines. The motor and mechanism sit inside the head rail, out of sight.'),
         'items': [
             ('jaluzi-bahce', T2('Bahçeye bakan camlarda kanatları açık krem ahşap jaluzi', 'Cream wooden blinds with tilted slats on the garden windows')),
             ('salon-jaluzi', T2('Salon cephesi boyunca uzanan motorlu jaluziler', 'Motorised blinds running the length of the living room')),
             ('jaluzi-detay', T2('Şerit merdivenli ahşap lameller ve üst mekanizma', 'Wooden slats with tape ladders and the head rail')),
         ]},
    ],
}

YENIBOSNA = {
    'slug': 'yenibosna',
    'short': 'Yenibosna',
    'hero': 'projeler/yenibosna/salon-tul-fon',
    'products': ['tul-perde', 'fon-perde', 'rustik-perde', 'dikey-perde'],
    'location': T2('Yenibosna, Bahçelievler, İstanbul', 'Yenibosna, Bahçelievler, Istanbul'),
    'h1': T2('Yenibosna S.Ş Evi', 'Yenibosna S.Ş House'),
    'title_tail': T2('Tül, Fon, Rustik ve Duvar Kağıdı', 'Sheers, Drapes, Poles and Wallpaper'),
    'lead': T2('Salondan çocuk odasına, oturma odasından mutfağa kadar bütün ev: tavandan yere tül ve fon perdeler, mermer başlıklı rustikler, dikey perde ve üç farklı duvar kağıdı.',
               'The whole house, from the living room to the children\'s room and the kitchen: floor-to-ceiling sheers and drapes, marble-finial poles, a vertical blind and three different wallpapers.'),
    'h2': T2('Her odaya kendi karakteri', 'A character for every room'),
    'intro': T2('Bu evde her odayı kendi kullanımına göre ele aldık: salonda saten dokulu fonlarda deri biye, yatak odalarında astarlı fonlar ve mermer başlıklı rustikler, çocuk odasında yumuşak tonlar, mutfakta kolay kullanılan dikey perde. Duvarlarda kemerli nişlerin içine dokulu, çiçekli ve gezegen desenli duvar kağıtları uyguladık. Aşağıda odalara göre ayrılmış fotoğraflar ve dikiş detayları var.',
                'We treated each room according to how it is used: leather piping on satin-textured drapes in the living room, lined drapes and marble-finial poles in the bedrooms, soft tones in the children\'s room and an easy vertical blind in the kitchen. Inside arched niches we hung textured, blossom and planet wallpapers. Below are the photos by room, followed by the stitching details.'),
    'groups': [
        {'h': T2('Salon', 'Living room'),
         'p': T2('Tavana gömülü raydan yere kadar inen tül ve saten dokulu fon perdeler. Fonların ön kenarında koyu deri biye var; duvardaki kemerli nişlerde dokulu duvar kağıdı.',
                 'Sheers and satin-textured drapes falling from a recessed ceiling track to the floor. The drapes carry a dark leather piping on the leading edge; the arched niches on the wall are lined with textured wallpaper.'),
         'items': [
             ('salon-tul-fon', T2('Salonda tavandan yere tül ve saten dokulu fon perde', 'Floor-to-ceiling sheer and satin-textured drapes in the living room')),
             ('salon-fon', T2('Kapalı haliyle boydan boya fon perde', 'Full-width drapes, drawn closed')),
             ('salon-biye-ust', T2('Fonun ön kenarındaki deri biye ve arkadaki tül', 'Leather piping on the drape\'s edge, with the sheer behind')),
             ('salon-kemer-duvar-kagidi', T2('Kemerli nişlerde dokulu duvar kağıdı', 'Textured wallpaper inside arched niches')),
         ]},
        {'h': T2('Oturma odası', 'Sitting room'),
         'p': T2('Siyah rustik boruda keten görünümlü fon ve çizgili tül. Fonun alt kısmında işleme detayı var.',
                 'A linen-look drape and a striped sheer on a black pole. The lower part of the drape is embroidered.'),
         'items': [
             ('oturma-tul-fon', T2('Siyah rustik boruda keten görünümlü fon ve tül', 'Linen-look drape and sheer on a black pole')),
             ('oturma-genel', T2('Oturma odasında pencere boyunca tül ve fon', 'Sheer and drape across the sitting room window')),
             ('dokulu-tul', T2('Tavan rayında iri dokulu tül', 'A coarse-weave sheer on a ceiling track')),
         ]},
        {'h': T2('Yatak odaları', 'Bedrooms'),
         'p': T2('Mermer top başlıklı rustik borularda astarlı fon perdeler ve beyaz tül. Yatak başındaki kemerli nişlerde ışıklı, çiçekli duvar kağıdı.',
                 'Lined drapes and white sheers on poles with marble ball finials. Backlit blossom wallpaper inside the arched niches behind the bed.'),
         'items': [
             ('yatak-genel', T2('Balkon kapısında tül ve fon perde', 'Sheer and drapes at the balcony door')),
             ('yatak-cift-pencere', T2('İki pencerede aynı düzende tül ve fon', 'Matching sheers and drapes on two windows')),
             ('yatak-fon-tul', T2('Işıklı raf yanında tül ve fon perde', 'Sheer and drape beside lit shelving')),
             ('yatak-koyu-fon', T2('Tavan rayında yere kadar koyu fon perde', 'A dark floor-length drape on a ceiling track')),
             ('yatak-pencere', T2('Mermer başlıklı rustikte tül ve fon', 'Sheer and drape on a marble-finial pole')),
             ('yatak-masa', T2('Çalışma masası yanındaki pencere', 'The window beside the desk')),
             ('cicekli-kemerler', T2('Yatak başında ışıklı kemerlerde çiçekli duvar kağıdı', 'Backlit arches with blossom wallpaper behind the bed')),
             ('cicekli-detay', T2('Çiçekli duvar kağıdının yakından görünümü', 'Close-up of the blossom wallpaper')),
         ]},
        {'h': T2('Çocuk odası', 'Children\'s room'),
         'p': T2('Örgü top başlıklı rustikte gri fon ve beyaz tül. Çalışma masalarının üstündeki kemerli nişlerde gezegen desenli duvar kağıdı.',
                 'A grey drape and white sheer on a pole with a knitted ball finial. Planet wallpaper inside the arched niches above the desks.'),
         'items': [
             ('cocuk-perde', T2('Çocuk odasında gri fon ve tül', 'Grey drape and sheer in the children\'s room')),
             ('cocuk-gezegen-duvar', T2('Çalışma köşelerinde gezegen desenli duvar kağıdı', 'Planet wallpaper above the desks')),
             ('orgu-top-rustik', T2('Örgü top başlıklı rustik ve gri fon', 'Knitted ball finial and grey drape')),
         ]},
        {'h': T2('Mutfak', 'Kitchen'),
         'p': T2('Bahçeye bakan mutfak penceresinde dikey perde; lameller döndürülerek ışık ayarlanıyor.',
                 'A vertical blind on the kitchen window facing the garden; the slats turn to control the light.'),
         'items': [
             ('mutfak-dikey', T2('Mutfakta bahçeye bakan pencerede dikey perde', 'Vertical blind on the kitchen window facing the garden')),
         ]},
        {'h': T2('Dikiş detayları', 'Stitching details'),
         'p': T2('Astarlı perde dikişinde kullandığımız gizli dikiş: astar ile kumaş kenarda dikiş izi görünmeden birleşiyor. Özelleştirilmiş fon perdelerde kullandığımız deri biye detayı ise fonun ön kenarını belirginleştiriyor.',
                 'The concealed stitch we use on lined curtains: lining and face fabric meet at the edge with no visible stitching. The leather piping we use on bespoke drapes defines the leading edge.'),
         'items': [
             ('astar-gizli-dikis', T2('Astarlı perde dikişinde gizli dikiş detayı', 'Concealed stitching on a lined curtain')),
             ('astar-kenar', T2('Astar ve kumaşın kenarda birleşimi', 'Where the lining meets the face fabric')),
             ('biye-detay', T2('Özelleştirilmiş fon perdede deri biye detayı', 'Leather piping on a bespoke drape')),
             ('salon-saten-biye', T2('Deri biyeli fon ve arkasında tül', 'A leather-piped drape with the sheer behind')),
             ('mermer-top-rustik', T2('Mermer top başlıklı rustik ve astarlı fon', 'Marble ball finial and lined drape')),
             ('mermer-top-pile', T2('Rustikte düzenli pileler', 'Even pleats on the pole')),
         ]},
    ],
}

ALEMDAG = {
    'slug': 'alemdag',
    'short': 'Alemdağ',
    'hero': 'projeler/alemdag/koltuk-duvari',
    'products': ['tul-perde', 'fon-perde', 'rustik-perde', 'rensolar', 'perde-aksesuarlari'],
    'location': T2('Alemdağ, Çekmeköy, İstanbul', 'Alemdağ, Çekmeköy, Istanbul'),
    'h1': T2('M.Y Alemdağ Evi', 'M.Y Alemdağ House'),
    'title_tail': T2('Giydirme ile Planlanan Salon', 'A Living Room Planned with a Visual'),
    'lead': T2('Mavi saten fon, püsküllü asimetrik kesim, işlemeli tül ve pirinç rustikler. Uygulamadan önce müşteriye giydirme görseliyle gösterildi.',
               'Blue satin drapes with a tasselled asymmetric cut, embroidered sheers and brass poles, shown to the client as a visual before installation.'),
    'h2': T2('Önce giydirme, sonra uygulama', 'First the visual, then the installation'),
    'intro': T2('Müşterimiz salonundaki klasik mobilyalara uyacak, gösterişli ama ağır durmayan bir perde istiyordu ve kararını vermeden önce sonucu görmek istedi. İhtiyacını dinleyip kumaş, püskül ve rustik seçeneklerini giydirme görselleri üzerinde birlikte değerlendirdik. Onaylanan görsele göre diktiğimiz perdeler, uygulamada giydirmeye en yakın sonucu verdi. Aşağıda giydirme görselini ve uygulamayı yan yana görebilirsiniz.',
                'The client wanted curtains that would suit the classic furniture in the living room, rich but not heavy, and wanted to see the result before deciding. We listened, then reviewed fabric, tassel and pole options together on visuals. The curtains we made to the approved visual came out as close to it as possible. Below you can see the visual and the installation side by side.'),
    'groups': [
        {'natural': True, 'h': T2('Giydirme ve uygulama', 'The visual and the installation'),
         'p': T2('Solda müşteriyle birlikte seçtiğimiz giydirme görseli, sağda uygulamanın kendisi. Asimetrik kesim, püsküllü kenar ve pirinç tutucu görseldeki gibi uygulandı.',
                 'On the left the visual we chose together with the client, on the right the installation. The asymmetric cut, tasselled edge and brass holdback were made as in the visual.'),
         'items': [
             ('giydirme-uygulama', T2('Giydirme görseli (solda) ve uygulama (sağda)', 'The visual (left) and the installation (right)')),
             ('giydirme-secenekler', T2('Müşteriye sunulan giydirme seçenekleri ve detaylar', 'Visual options and details shown to the client')),
         ]},
        {'h': T2('Salon', 'Living room'),
         'p': T2('Koltuk duvarındaki geniş pencerede iki yanda mavi saten fon, ortada işlemeli tül. Fonlar pirinç tutucularla toplanıyor.',
                 'On the wide window behind the sofa, blue satin drapes on each side and an embroidered sheer in the middle, gathered with brass holdbacks.'),
         'items': [
             ('koltuk-duvari', T2('Koltuk duvarında mavi saten fon ve işlemeli tül', 'Blue satin drapes and embroidered sheer behind the sofa')),
             ('salon-genel', T2('Salonun genel görünümü', 'The living room')),
             ('koltuk-duvari-2', T2('Pencerenin iki yanında asimetrik fonlar', 'Asymmetric drapes on both sides of the window')),
             ('pencere-bitki', T2('Asimetrik fon ve tülün üst kısmı', 'The top of the asymmetric drape and sheer')),
         ]},
        {'h': T2('Balkon kapısı', 'Balcony door'),
         'p': T2('Balkon kapısında iki ayrı rustikte karşılıklı fonlar ve kenarı dalgalı işlemeli tül.',
                 'At the balcony door, facing drapes on two poles and an embroidered sheer with a scalloped heading.'),
         'items': [
             ('balkon-kapisi', T2('Balkon kapısında karşılıklı fonlar ve işlemeli tül', 'Facing drapes and embroidered sheer at the balcony door')),
             ('balkon-kapisi-yakin', T2('Püsküllü kenarlar ve pirinç tutucular', 'Tasselled edges and brass holdbacks')),
         ]},
        {'h': T2('Detaylar', 'Details'),
         'p': T2('Fonun eğik kesilen kenarında boncuklu püskül şerit, oluklu pirinç rustik boru ve aynı desende tutucu.',
                 'A beaded tassel trim on the drape\'s angled edge, a fluted brass pole and a matching holdback.'),
         'items': [
             ('asimetrik-fon', T2('Klima yanındaki pencerede asimetrik fon', 'Asymmetric drape beside the air conditioner')),
             ('asimetrik-sag', T2('Sağ kanatta asimetrik fon ve tutucu', 'Asymmetric drape and holdback on the right')),
             ('puskul-detay', T2('Boncuklu püskül şerit ve pirinç tutucu', 'Beaded tassel trim and brass holdback')),
             ('tutucu-detay', T2('Pirinç tutucunun yakından görünümü', 'Close-up of the brass holdback')),
             ('rustik-halka', T2('Oluklu pirinç rustik ve halkalar', 'Fluted brass pole and rings')),
         ]},
    ],
}

AKCEKESE['short'] = 'Akçekese'
PROJECTS = [YENIBOSNA, ALEMDAG, SUADIYE, AKCEKESE]
