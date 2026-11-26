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


ORMANKOY = {
    'slug': 'ormankoy', 'short': 'Ormanköy',
    'hero': 'projeler/ormankoy/salon-plicell',
    'products': ['plicell-perde', 'motorlu-perde', 'stor-perde', 'jaluzi-perde', 'tul-perde', 'fon-perde', 'rustik-perde', 'rensolar'],
    'location': T2('Ormanköy, Çekmeköy, İstanbul', 'Ormanköy, Çekmeköy, Istanbul'),
    'h1': T2('Ormanköy K.T Evi', 'Ormanköy K.T House'),
    'title_tail': T2('Tavan Plicell ve Motorlu Stor', 'Roof Pleated and Motorised Blinds'),
    'lead': T2('Eğimli tavan camlarında motorlu plicell, yüksek camlarda motorlu storlar, eğimli çapraz ahşap jaluzi, mermer renso ve rustik takımları.',
               'Motorised pleated blinds on sloping roof glazing, motorised roller blinds on tall windows, an angled wooden Venetian blind, and marble holdbacks and poles.'),
    'h2': T2('Ulaşılması zor camlara çözüm', 'Answers for hard-to-reach glazing'),
    'intro': T2('Bu evin salonu çift yükseklikte; tavanın bir bölümü eğimli camlardan oluşuyor. Eğimli tavan camlarına motorlu plicell taktık; '
                'perdeler cama paralel çalışıyor ve kumandayla açılıp kapanıyor. Yüksek boyutlu camlarda motorlu storlar, eğimli bir pencerede çapraz ahşap jaluzi kullandık. '
                'Tül ve fon perdeleri mermer top başlıklı siyah rustiklere astık ve mermer rensolarla topladık. Aşağıdaki videoda sistemler çalışırken görülüyor.',
                'The living room is double height and part of the roof is sloping glass. We fitted motorised pleated blinds to the roof glazing; they run parallel to the glass and open by remote. '
                'Motorised roller blinds cover the tall windows and an angled wooden Venetian blind fits a sloping window. Sheers and drapes hang from black poles with marble ball finials and are gathered with marble rensos. The video below shows the systems running.'),
    'video': {'src': '/video/projeler/ormankoy.mp4', 'poster': 'projeler/ormankoy/video-kapak',
              'h': T2('Sistemler çalışırken', 'The systems running'),
              'p': T2('Tavan plicell, motorlu storlar ve jaluzi kumandayla çalışırken.', 'Roof pleated blinds, motorised rollers and the Venetian blind running by remote.')},
    'groups': [
        {'h': T2('Salon ve tavan camları', 'Living room and roof glazing'),
         'p': T2('Çift yükseklikteki salonda eğimli tavan camları motorlu plicellle kaplandı; alttaki camlarda tül perdeler var.',
                 'In the double-height living room the sloping roof glass carries motorised pleated blinds, with sheers on the windows below.'),
         'items': [
             ('salon-plicell', T2('Eğimli tavan camlarında motorlu plicell ve salon', 'Motorised pleated blinds on the roof glazing')),
             ('tavan-plicell', T2('Avizenin üstünde tavan plicell ve tül', 'Roof pleated blinds and sheers above the chandelier')),
             ('salon-genel', T2('Salonun genel görünümü', 'The living room')),
             ('yemek-yuksek-cam', T2('Yemek alanında yüksek camlar ve tül', 'Tall windows and sheers by the dining table')),
         ]},
        {'h': T2('Tül, fon ve mermer aksesuarlar', 'Sheers, drapes and marble accessories'),
         'p': T2('Koltuk duvarında tül ve fon; fonlar mermer top başlıklı rustiklerde ve mermer rensolarla toplanıyor.',
                 'Sheers and drapes behind the sofa, hung on marble-finial poles and gathered with marble rensos.'),
         'items': [
             ('koltuk-pencere', T2('Koltuk duvarında tül ve fon', 'Sheer and drape behind the sofa')),
             ('tul-fon-mermer', T2('Mermer rensoyla toplanmış fon', 'A drape gathered with a marble renso')),
             ('mermer-renso', T2('Mermer renso', 'Marble renso')),
             ('mermer-rustik', T2('Mermer top başlıklı rustik', 'Marble ball finial')),
             ('yatak-fon', T2('Yatak odasında koyu fon ve tül', 'Dark drape and sheer in a bedroom')),
         ]},
        {'h': T2('Montaj', 'Installation'),
         'p': T2('Montajı kendi ekibimiz yaptı; son ayarlar yerinde.', 'Our own team fitted everything, with final adjustments on site.'),
         'items': [
             ('montaj', T2('Fonun son ayarı', 'Final adjustment of a drape')),
             ('montaj-tul', T2('Yüksek camda tül montajı', 'Fitting sheers on tall glazing')),
         ]},
    ],
}

RAPSODI = {
    'slug': 'rapsodi', 'short': 'Rapsodi',
    'hero': 'projeler/rapsodi/salon-tul-fon',
    'products': ['tul-perde', 'fon-perde', 'jaluzi-perde', 'stor-perde', 'rustik-perde', 'pile-cesitleri'],
    'location': T2('Rapsodi Evleri, Çekmeköy, İstanbul', 'Rapsodi Evleri, Çekmeköy, Istanbul'),
    'h1': T2('Çekmeköy Rapsodi Evleri H.D Evi', 'Çekmeköy Rapsodi H.D House'),
    'title_tail': T2('Tül, Fon ve Ahşap Jaluzi', 'Sheers, Drapes and Wooden Blinds'),
    'lead': T2('Salonda aynı yaşam alanında iki farklı perde: tül ve fon ile ahşap jaluzi. Odalarda stor, rustik ve S pile tül.',
               'Two curtain types in one living space, sheer-and-drape and a wooden Venetian blind, plus roller blinds, poles and wave-pleat sheers in the rooms.'),
    'h2': T2('Bir salonda iki perde', 'Two curtain types in one room'),
    'intro': T2('Salonun bir yanında geniş pencerelerde tül ve fon, köşedeki dar pencerelerde ise ahşap jaluzi kullandık; '
                'iki sistem aynı renk ailesinde seçildiği için tek bir bütün gibi duruyor. Odalarda stor perde, rustik üzerinde fon ve '
                'perde aksesuarlarında S pile (dalgalı) tül uyguladık. Videoda tüm odaları görebilirsiniz.',
                'On one side of the living room the wide windows have sheers and drapes; the narrow corner windows have a wooden Venetian blind. Chosen in the same palette, they read as one. '
                'The rooms have roller blinds, drapes on poles and wave-pleat sheers. The video shows every room.'),
    'video': {'src': '/video/projeler/rapsodi.mp4', 'poster': 'projeler/rapsodi/video-kapak',
              'h': T2('Odalar', 'The rooms'), 'p': T2('Evin odalarından kısa görüntüler.', 'Short clips from the rooms.')},
    'groups': [
        {'h': T2('Salon: tül, fon ve ahşap jaluzi', 'Living room: sheer, drape and wooden blind'),
         'p': T2('Aynı yaşam alanında iki farklı perde: geniş camda tül ve fon, köşe pencerede ahşap jaluzi.', 'Two systems in one space: sheer and drape on the wide glass, a wooden blind on the corner window.'),
         'items': [
             ('salon-tul-fon', T2('Salonda tül ve fon', 'Sheer and drape in the living room')),
             ('salon-jaluzi', T2('Fonun yanında ahşap jaluzi', 'A wooden blind beside the drape')),
             ('koridor-jaluzi', T2('Koridor penceresinde ahşap jaluzi', 'A wooden blind on the hall window')),
             ('yemek-fon', T2('Yemek masası yanında fon ve tül', 'Drape and sheer by the dining table')),
         ]},
        {'h': T2('Odalar', 'Rooms'),
         'p': T2('Oturma odasında rustikte fon ve tül, mavi duvarlı odada gri fon, çalışma odasında stor.', 'A drape on a pole in the sitting room, grey drape in the blue room and roller blinds in the study.'),
         'items': [
             ('oturma-tul', T2('Oturma odasında tül ve koyu fon', 'Sheer and dark drape in the sitting room')),
             ('fon-yildiz', T2('Rustikte pileli fon', 'A pleated drape on a pole')),
             ('mavi-oda', T2('Mavi duvarlı odada fon ve tül', 'Drape and sheer in the blue room')),
             ('mavi-oda-fon', T2('Fonun dokusu', 'Drape texture')),
             ('stor-calisma', T2('Çalışma odasında stor perdeler', 'Roller blinds in the study')),
             ('stor-balkon', T2('Balkon kapısında stor', 'A roller blind on the balcony door')),
         ]},
        {'h': T2('S pile tül', 'Wave-pleat sheers'),
         'p': T2('Rustik boruda S pile (dalgalı) dikilmiş tüller; kıvrımlar boydan boya eşit.', 'Wave-pleat sheers on poles, with even folds from end to end.'),
         'items': [
             ('s-pile-tul', T2('Rustikte S pile tül', 'Wave-pleat sheer on a pole')),
             ('dokulu-tul', T2('Dokulu tülde S pile', 'Wave pleats on a textured sheer')),
         ]},
    ],
}

BIRBAHCE = {
    'slug': 'birbahce', 'short': 'Birbahçe',
    'hero': 'projeler/birbahce/salon',
    'products': ['fon-perde', 'tul-perde', 'perde-aksesuarlari', 'jaluzi-perde'],
    'location': T2('Birbahçe, İstanbul', 'Birbahçe, Istanbul'),
    'h1': T2('Birbahçe Projesi E.C Evi', 'Birbahçe E.C House'),
    'title_tail': T2('Dekoratif Alınlık ve Fon', 'Decorative Pelmets and Drapes'),
    'lead': T2('2021: dekoratif alınlık, dekoratif kapamalı fon perdeler ve banyoda ahşap jaluzi.', '2021: decorative pelmets, drapes with a decorative cover and a wooden blind in the bathroom.'),
    'h2': T2('Alınlıkla tamamlanan pencereler', 'Windows finished with a pelmet'),
    'intro': T2('2021 yılında yaptığımız bu evde rayları dekoratif alınlıkla kapattık; fon perdeler alınlığın altından tavana yakın başlıyor ve '
                'pencereyi olduğundan yüksek gösteriyor. Fonlarda dekoratif kapamalı dikim kullandık. Banyoda boydan koyu ahşap jaluzi var.',
                'In this 2021 project the tracks are hidden behind decorative pelmets; drapes start just under the pelmet near the ceiling and make the windows look taller. '
                'The drapes have a decorative cover finish. The bathroom has a tall dark wooden Venetian blind.'),
    'groups': [
        {'h': T2('Salon ve yatak odası', 'Living room and bedroom'),
         'p': T2('Dekoratif alınlığın altında kahverengi ve gri fonlar, beyaz tül.', 'Brown and grey drapes with white sheers under decorative pelmets.'),
         'items': [
             ('salon', T2('Salonda alınlık altında fon ve tül', 'Drapes and sheers under a pelmet in the living room')),
             ('yatak-odasi', T2('Yatak odasında gri fon ve tül', 'Grey drapes and sheer in the bedroom')),
             ('banyo-jaluzi', T2('Banyoda ahşap jaluzi', 'Wooden Venetian blind in the bathroom')),
         ]},
    ],
}

MDOFIS = {
    'slug': 'md-ofis', 'short': 'M.D Ofis',
    'hero': 'projeler/md-ofis/kemerler',
    'products': ['jaluzi-perde'],
    'location': T2('İstanbul', 'Istanbul'),
    'h1': T2('Ofis Projesi M.D Ofis', 'M.D Office Project'),
    'title_tail': T2('Metal Jaluzi', 'Metal Venetian Blinds'),
    'lead': T2('Kemerli ofis pencerelerinde metal jaluzi: kemerin camı açık kalıyor, alt camlar jaluziyle kontrol ediliyor.',
               'Metal Venetian blinds on arched office windows: the arch stays clear while the lower panes are controlled by the blinds.'),
    'h2': T2('Kemerli camda düzenli bir ofis', 'A tidy office with arched windows'),
    'intro': T2('Ofisin bütün pencereleri kemerli. Kemerin yarım dairesini açık bıraktık, altındaki dikdörtgen camlara metal jaluzi taktık. '
                'Böylece gün ışığı yukarıdan girmeye devam ediyor, çalışma masalarına gelen güneş ve dışarıdan görünürlük lamellerle ayarlanıyor. '
                'Tüm pencerelerde aynı renk jaluzi kullanıldığı için ofis düzenli ve sade görünüyor.',
                'Every window in the office is arched. We left the half-round arch clear and fitted metal Venetian blinds to the rectangular panes below, '
                'so daylight still comes in from above while sun on the desks and privacy are controlled by the slats. The same colour throughout keeps the office calm and tidy.'),
    'groups': [
        {'h': T2('Kemerli pencerelerde metal jaluzi', 'Metal blinds on arched windows'),
         'p': T2('Toplantı alanı, çalışma alanı, mutfak köşesi ve merdiven boşluğundaki pencerelerin hepsi aynı sistemle.', 'Meeting area, desks, kitchenette and stairwell all use the same system.'),
         'items': [
             ('kemerler', T2('Kemerli pencerelerde metal jaluzi', 'Metal blinds on arched windows')),
             ('toplanti', T2('Toplantı masasının arkasında jaluzi', 'A blind behind the meeting table')),
             ('genel', T2('Ofisin genel görünümü', 'The office')),
             ('calisma', T2('Çalışma alanı', 'Work area')),
             ('masa', T2('Toplantı masası ve jaluzi', 'Meeting table and blind')),
             ('merdiven', T2('Merdiven boşluğundaki kemerli pencere', 'The arched stairwell window')),
             ('mutfak', T2('Mutfak köşesinde jaluzi', 'A blind in the kitchenette')),
         ]},
    ],
}

MODALEMDAG = {
    'slug': 'modalemdag', 'short': 'ModAlemdağ',
    'hero': 'projeler/modalemdag/yemek',
    'products': ['fon-perde', 'tul-perde', 'perde-aksesuarlari'],
    'location': T2('ModAlemdağ, Çekmeköy, İstanbul', 'ModAlemdağ, Çekmeköy, Istanbul'),
    'h1': T2('ModAlemdağ Projesi K.H Evi', 'ModAlemdağ K.H House'),
    'title_tail': T2('Dekoratif Alınlık ve Fon', 'Decorative Pelmets and Drapes'),
    'lead': T2('Yüksek tavanlı salon ve yemek alanında beyaz dekoratif alınlık, koyu dokulu fonlar ve oturma odasında kiremit rengi fon.',
               'White decorative pelmets with dark textured drapes in the tall living and dining room, and terracotta drapes in the sitting room.'),
    'h2': T2('Alınlık ve dekoratif fon', 'Pelmet and decorative drapes'),
    'intro': T2('Tavanı yüksek salonda rayı beyaz dekoratif alınlıkla kapattık. Alınlık hem rayı gizliyor hem de pencerenin üst çizgisini düzgün bir çerçeveye dönüştürüyor. '
                'Koyu dokulu fonlar alınlığın hemen altından yere kadar iniyor, ortada beyaz tül ışığı yumuşatıyor. Oturma odasında ise kiremit rengi fon, koltuklardaki renkle uyumlu seçildi.',
                'In the tall living room the track is hidden behind a white decorative pelmet, which also frames the top of the window neatly. Dark textured drapes fall from just under it to the floor, '
                'with a white sheer softening the light between them. In the sitting room terracotta drapes pick up the colour of the sofa.'),
    'groups': [
        {'h': T2('Salon ve yemek alanı', 'Living and dining'),
         'p': T2('Beyaz dekoratif alınlık, koyu fon ve tül.', 'White decorative pelmet, dark drapes and sheer.'),
         'items': [
             ('yemek', T2('Yemek alanında alınlık, fon ve tül', 'Pelmet, drapes and sheer by the dining table')),
             ('salon', T2('Salonda alınlık altında fon', 'Drapes under the pelmet in the living room')),
             ('yemek-2', T2('Avizenin yanında yüksek pencere', 'The tall window beside the chandelier')),
         ]},
        {'h': T2('Oturma odası', 'Sitting room'),
         'p': T2('Kiremit rengi fon ve tül.', 'Terracotta drapes and sheer.'),
         'items': [
             ('oturma', T2('Kiremit rengi fon ve tül', 'Terracotta drapes and sheer')),
             ('oturma-2', T2('Oturma odasının genel görünümü', 'The sitting room')),
         ]},
    ],
}

SURAT = {
    'slug': 'surat-kargo', 'short': 'Sürat Kargo',
    'hero': 'projeler/surat-kargo/toplanti',
    'products': ['stor-perde'],
    'location': T2('Kartal, İstanbul', 'Kartal, Istanbul'),
    'h1': T2('Sürat Kargo Kartal Projesi', 'Sürat Kargo Kartal Project'),
    'title_tail': T2('Stor Perde Uygulaması', 'Roller Blinds'),
    'lead': T2('Ofis katında her cama ayrı stor perde: her çalışan kendi penceresini ayarlayabiliyor.',
               'A separate roller blind on every pane of the office floor, so each person can set their own window.'),
    'h2': T2('Her cama ayrı stor', 'A blind for every pane'),
    'intro': T2('Ofisin cepheleri geniş ve kavisli. Tek parça büyük storlar yerine her cama ayrı stor taktık; '
                'böylece güneş alan tarafta perde inerken diğer camlar açık kalabiliyor ve kavisli köşelerde bile storlar cama tam oturuyor. '
                'Toplantı odaları ve çalışma alanlarının hepsinde aynı kumaş kullanıldı.',
                'The office façades are wide and curved. Instead of a few large blinds we fitted a separate roller blind to every pane, '
                'so the sunny side can be lowered while others stay open, and even on the curved corners each blind sits neatly on its glass. All rooms use the same fabric.'),
    'groups': [
        {'h': T2('Toplantı ve çalışma alanları', 'Meeting and work areas'),
         'p': T2('Her cama ayrı stor; kavisli köşelerde bile düzgün hizalı.', 'One blind per pane, aligned even on the curves.'),
         'items': [
             ('toplanti', T2('Toplantı alanında her cama ayrı stor', 'A blind per pane in the meeting area')),
             ('calisma', T2('Çalışma alanında storlar', 'Blinds in the work area')),
             ('kose', T2('Kavisli köşede storlar', 'Blinds on the curved corner')),
             ('oval', T2('Kavisli cephede yarıya inmiş storlar', 'Half-lowered blinds on the curved façade')),
             ('oda', T2('Toplantı odasında storlar', 'Blinds in a meeting room')),
             ('kose-yakin', T2('Köşedeki storların yakından görünümü', 'Close-up of the corner blinds')),
         ]},
    ],
}

PROJECTS = [ORMANKOY, RAPSODI, YENIBOSNA, ALEMDAG, MODALEMDAG, BIRBAHCE, SUADIYE, MDOFIS, SURAT, AKCEKESE]
