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

PROJECTS = [AKCEKESE]
