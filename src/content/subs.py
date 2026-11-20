# -*- coding: utf-8 -*-
"""Alt kategoriler (modeller). Menüde ürünün üstüne gelince açılır, ürün sayfasında "Modeller" bölümünde listelenir.
Her satır: (kimlik, ad, kısa açıklama, ayrı sayfası varsa ürün kimliği). Kimlik sayfadaki çapa (#) olarak kullanılır.
Açıklamalar ürün tipini tarif eder; fiyat, süre ya da işletmeye özgü iddia içermez."""
from .data import T

SUBS = {
    'stor-perde': [
        ('blackout-stor', T('Blackout Stor', 'Blackout Roller Blind', 'ستارة رول بلاك أوت'),
         T('Işığı geçirmeyen kumaş; yatak ve çocuk odaları için.', 'Fabric that blocks light, for bedrooms and children’s rooms.', 'قماش يحجب الضوء، لغرف النوم والأطفال.'), None),
        ('screen-stor', T('Screen Stor', 'Screen Roller Blind', 'ستارة رول سكرين'),
         T('File dokulu kumaş; dışarıyı gösterirken güneşi ve parlamayı azaltır.', 'Mesh fabric that cuts sun and glare while keeping the view.', 'قماش شبكي يخفف الشمس والوهج مع إبقاء الرؤية.'), None),
        ('motorlu-stor', T('Motorlu Stor', 'Motorised Roller Blind', 'ستارة رول كهربائية'),
         T('Kumanda ya da telefonla açılıp kapanır; motor borunun içinde gizlidir.', 'Opens and closes by remote or phone; the motor hides inside the tube.', 'تُفتح وتُغلق بجهاز التحكم أو الهاتف، والمحرك مخفي داخل الأسطوانة.'), None),
        ('zebra-stor', T('Zebra Stor', 'Zebra Blind', 'ستارة زيبرا'),
         T('Tül ve kumaş şeritler kaydırılarak ışık kademeli ayarlanır.', 'Sheer and solid bands slide past each other to set light in steps.', 'شرائط شفافة ومعتمة تتحرك لضبط الضوء بالتدريج.'), None),
        ('katlamali-stor', T('Katlamalı Stor', 'Folding Roman Blind', 'ستارة رومانية قابلة للطي'),
         T('Kumaş yukarı çekildikçe yumuşak katlar hâlinde toplanır.', 'The fabric gathers into soft folds as it rises.', 'يتجمع القماش في طيات ناعمة كلما ارتفع.'), None),
        ('keten-stor', T('Keten Stor', 'Linen Roller Blind', 'ستارة رول كتان'),
         T('Keten dokulu kumaş; doğal ve sade bir görünüm.', 'Linen-textured fabric for a natural, simple look.', 'قماش بملمس الكتان لمظهر طبيعي وبسيط.'), None),
        ('bordurlu-stor', T('Bordürlü Stor', 'Bordered Roller Blind', 'ستارة رول بحواف'),
         T('Kenarına ya da eteğine dekoratif bordür dikilen stor.', 'A roller blind finished with a decorative border.', 'ستارة رول بحافة ديكورية مخيطة.'), None),
    ],
    'tul-perde': [
        ('pileli-tul', T('Pileli Tül Perde', 'Pleated Sheer', 'تول بكسرات'),
         T('Düzenli pilelerle dikilir; dolgun ve düzgün bir düşüş verir.', 'Sewn with even pleats for a full, regular fall.', 'يُخاط بكسرات منتظمة لانسدال ممتلئ ومرتب.'), None),
        ('keten-tul', T('Keten Tül Perde', 'Linen Sheer', 'تول كتان'),
         T('Keten dokulu tül; gün ışığını yumuşak süzer.', 'Linen-textured sheer that softens daylight.', 'تول بملمس الكتان يلطف ضوء النهار.'), None),
        ('desenli-tul', T('Desenli Tül Perde', 'Patterned Sheer', 'تول منقوش'),
         T('Desenli ya da işlemeli tül; pencereye karakter katar.', 'Patterned or embroidered sheer that gives a window character.', 'تول منقوش أو مطرز يمنح النافذة طابعاً.'), None),
        ('motorlu-tul', T('Motorlu Tül Perde', 'Motorised Sheer', 'تول كهربائي'),
         T('Motorlu rayda kumandayla açılıp kapanır.', 'Runs on a motorised track, opened and closed by remote.', 'يعمل على سكة كهربائية ويُفتح ويُغلق بجهاز التحكم.'), None),
        ('bordurlu-tul', T('Bordürlü Tül Perde', 'Bordered Sheer', 'تول بحواف'),
         T('Eteğine ya da kenarına bordür eklenen tül.', 'A sheer finished with a border at the hem or edge.', 'تول بحافة مضافة عند الطرف أو الذيل.'), None),
    ],
    'fon-perde': [
        ('blackout-fon', T('Blackout Fon Perde', 'Blackout Drape', 'ستارة قماشية بلاك أوت'),
         T('Işığı geçirmeyen kalın fon; tam karartma.', 'A heavy drape that lets no light through.', 'ستارة ثقيلة لا تمرر الضوء.'), 'blackout-perde'),
        ('pileli-fon', T('Pileli Fon Perde', 'Pleated Drape', 'ستارة قماشية بكسرات'),
         T('Pileli dikim; toplandığında düzenli katlar oluşturur.', 'Pleated heading that stacks in even folds.', 'خياطة بكسرات تتجمع في طيات منتظمة.'), None),
        ('motorlu-fon', T('Motorlu Fon Perde', 'Motorised Drape', 'ستارة قماشية كهربائية'),
         T('Motorlu rayda kumandayla açılıp kapanır.', 'Runs on a motorised track, opened and closed by remote.', 'تعمل على سكة كهربائية وتُفتح وتُغلق بجهاز التحكم.'), None),
        ('desenli-fon', T('Desenli Fon Perde', 'Patterned Drape', 'ستارة قماشية منقوشة'),
         T('Desenli kumaşlarla odanın tarzını belirler.', 'Patterned fabrics that set the style of a room.', 'أقمشة منقوشة تحدد طابع الغرفة.'), None),
        ('akustik-fon', T('Akustik Fon Perde', 'Acoustic Drape', 'ستارة قماشية صوتية'),
         T('Yoğun dokulu kalın kumaş; odadaki yankıyı azaltmaya yardımcı olur.', 'Dense, heavy fabric that helps reduce echo in a room.', 'قماش كثيف وثقيل يساعد على تقليل صدى الصوت في الغرفة.'), None),
        ('bordurlu-fon', T('Bordürlü Fon Perde', 'Bordered Drape', 'ستارة قماشية بحواف'),
         T('Kenarına kontrast bordür dikilen fon.', 'A drape finished with a contrasting border.', 'ستارة بحافة متباينة مخيطة.'), None),
    ],
    'katlamali-perde': [
        ('bordurlu-katlamali', T('Bordürlü Katlamalı Perde', 'Bordered Roman Blind', 'ستارة رومانية بحواف'),
         T('Kenarları bordürle çerçevelenen katlamalı perde.', 'A Roman blind framed with a border.', 'ستارة رومانية مؤطرة بحافة.'), None),
        ('motorlu-katlamali', T('Motorlu Katlamalı Perde', 'Motorised Roman Blind', 'ستارة رومانية كهربائية'),
         T('Kumandayla toplanır ve iner.', 'Rises and lowers by remote.', 'ترتفع وتنخفض بجهاز التحكم.'), None),
        ('tul-katlamali', T('Tül Katlamalı Perde', 'Sheer Roman Blind', 'ستارة رومانية من التول'),
         T('Tül kumaştan; ışığı süzerek katlanır.', 'Made of sheer fabric, folding while it filters light.', 'من قماش التول، تُطوى وهي ترشّح الضوء.'), None),
        ('fon-katlamali', T('Fon Katlamalı Perde', 'Fabric Roman Blind', 'ستارة رومانية من القماش'),
         T('Kalın kumaştan; daha fazla gölge ve mahremiyet.', 'Made of heavier fabric for more shade and privacy.', 'من قماش أثقل لمزيد من الظل والخصوصية.'), None),
    ],
    'plicell-perde': [
        ('blackout-plise', T('Blackout Plise Perde', 'Blackout Pleated Blind', 'ستارة بليسيه بلاك أوت'),
         T('Işığı geçirmeyen plise kumaş.', 'Pleated fabric that blocks light.', 'قماش بليسيه يحجب الضوء.'), None),
        ('honeycomb-plise', T('Honeycomb Plise Perde', 'Honeycomb Pleated Blind', 'ستارة بليسيه خلية النحل'),
         T('Petek yapılı plise; hücreler ısıyı tutar.', 'Honeycomb cells that hold heat.', 'خلايا على شكل قرص العسل تحفظ الحرارة.'), None),
        ('tek-sistem-plise', T('Tek Sistem Plise Perde', 'Single Pleated Blind', 'ستارة بليسيه أحادية'),
         T('Tek kumaş; aşağı ve yukarı hareket eder.', 'One fabric that moves up and down.', 'قماش واحد يتحرك صعوداً وهبوطاً.'), None),
        ('cift-sistem-plise', T('Çift Sistem Plise Perde', 'Double Pleated Blind', 'ستارة بليسيه مزدوجة'),
         T('Aynı sistemde iki kumaş; örneğin tül ve karartma birlikte.', 'Two fabrics in one system, such as a sheer and a blackout.', 'قماشان في نظام واحد، مثل تول وقماش معتم.'), None),
        ('motorlu-plise', T('Motorlu Plise Perde', 'Motorised Pleated Blind', 'ستارة بليسيه كهربائية'),
         T('Kumandayla açılıp kapanır.', 'Opens and closes by remote.', 'تُفتح وتُغلق بجهاز التحكم.'), None),
        ('tul-plise', T('Tül Plise Perde', 'Sheer Pleated Blind', 'ستارة بليسيه من التول'),
         T('Işığı süzen tül dokulu plise.', 'A sheer pleated fabric that filters light.', 'بليسيه من التول يرشّح الضوء.'), None),
        ('guneslik-plise', T('Güneşlik Plise Perde', 'Sunshade Pleated Blind', 'ستارة بليسيه للتظليل'),
         T('Çatı ve kış bahçesi camlarında güneşi kesmek için.', 'For shading roof glazing and winter gardens.', 'لتظليل الزجاج السقفي والحدائق الشتوية.'), None),
    ],
    'dikey-perde': [
        ('kumas-dikey', T('Kumaş Dikey Perde', 'Fabric Vertical Blind', 'ستارة عمودية قماشية'),
         T('Kumaş bantlar; yumuşak ve sıcak bir görünüm.', 'Fabric vanes for a soft, warm look.', 'شرائح قماشية لمظهر ناعم ودافئ.'), None),
        ('pvc-dikey', T('PVC Dikey Perde', 'PVC Vertical Blind', 'ستارة عمودية PVC'),
         T('Silinebilir PVC bantlar; ofis ve ıslak hacimler için.', 'Wipe-clean PVC vanes for offices and damp rooms.', 'شرائح PVC قابلة للمسح للمكاتب والأماكن الرطبة.'), None),
        ('screen-dikey', T('Screen Dikey Perde', 'Screen Vertical Blind', 'ستارة عمودية سكرين'),
         T('File dokulu bantlar; dışarıyı gösterir, parlamayı azaltır.', 'Mesh vanes that keep the view and cut glare.', 'شرائح شبكية تبقي الرؤية وتخفف الوهج.'), None),
        ('motorlu-dikey', T('Motorlu Dikey Perde', 'Motorised Vertical Blind', 'ستارة عمودية كهربائية'),
         T('Bantlar kumandayla döner ve yana toplanır.', 'Vanes turn and stack to the side by remote.', 'تدور الشرائح وتتجمع جانباً بجهاز التحكم.'), None),
    ],
    'jaluzi-perde': [
        ('polywood-jaluzi', T('Polywood Jaluzi Perde', 'Polywood Venetian Blind', 'جالوزي بوليوود'),
         T('Ahşap görünümlü, neme dayanıklı kanatlar.', 'Wood-look slats that stand up to moisture.', 'شرائح بمظهر الخشب تتحمل الرطوبة.'), None),
        ('aluminyum-jaluzi', T('Alüminyum Jaluzi Perde', 'Aluminium Venetian Blind', 'جالوزي ألمنيوم'),
         T('İnce alüminyum kanatlar; hafif ve kolay temizlenir.', 'Slim aluminium slats, light and easy to clean.', 'شرائح ألمنيوم رفيعة، خفيفة وسهلة التنظيف.'), None),
        ('motorlu-aluminyum-jaluzi', T('Motorlu Alüminyum Jaluzi', 'Motorised Aluminium Venetian Blind', 'جالوزي ألمنيوم كهربائي'),
         T('Kanat açısı ve yükseklik kumandayla ayarlanır.', 'Slat angle and height set by remote.', 'زاوية الشرائح والارتفاع بجهاز التحكم.'), 'motorlu-jaluzi'),
        ('motorlu-ahsap-jaluzi', T('Motorlu Ahşap Jaluzi', 'Motorised Wooden Venetian Blind', 'جالوزي خشبي كهربائي'),
         T('Ahşap kanatlar, kumandalı motorla.', 'Wooden slats with a remote-controlled motor.', 'شرائح خشبية بمحرك يعمل بجهاز التحكم.'), 'motorlu-jaluzi'),
    ],
    'perde-aksesuarlari': [
        ('rustik-aksesuar', T('Rustik Perde Aksesuarları', 'Rustic Curtain Hardware', 'إكسسوارات الستائر الريفية'),
         T('Ahşap ya da metal boru, halka ve uç başlıkları.', 'Wooden or metal poles, rings and finials.', 'قضبان خشبية أو معدنية وحلقات ورؤوس طرفية.'), 'rustik-perde'),
        ('dekoratif-ray', T('Dekoratif Ray', 'Decorative Track', 'سكة ديكورية'),
         T('Tül ve fonu taşıyan, görünür şık ray sistemleri.', 'Visible, finished tracks that carry sheers and drapes.', 'سكك ظاهرة وأنيقة تحمل التول والستائر.'), None),
        ('dekoratif-alinlik', T('Dekoratif Alınlık', 'Decorative Pelmet', 'كورنيش ديكوري'),
         T('Perdenin üst kısmını ve rayı örten dekoratif bölüm.', 'A decorative piece that covers the top of the curtain and the track.', 'قطعة ديكورية تغطي أعلى الستارة والسكة.'), None),
    ],
    'rensolar': [
        ('ahsap-renso', T('Ahşap Renso', 'Wooden Renso', 'رينسو خشبي'),
         T('Ahşap seçenek; sıcak ve doğal bir görünüm.', 'The wooden option, warm and natural.', 'الخيار الخشبي، دافئ وطبيعي.'), None),
        ('metal-renso', T('Metal Renso', 'Metal Renso', 'رينسو معدني'),
         T('Metal seçenek; ince ve modern bir çizgi.', 'The metal option, slim and modern.', 'الخيار المعدني، رفيع وعصري.'), None),
        ('mermer-renso', T('Mermer Renso', 'Marble Renso', 'رينسو رخامي'),
         T('Mermer seçenek; ağırbaşlı ve şık bir duruş.', 'The marble option, with a solid, refined presence.', 'الخيار الرخامي، بحضور متين وأنيق.'), None),
    ],
}

# Motorlu Perde sayfası ve menüsü: diğer ürünlerdeki motorlu modellerin hepsi (ürün, model kimliği)
MOTOR = [('stor-perde', 'motorlu-stor'), ('tul-perde', 'motorlu-tul'), ('fon-perde', 'motorlu-fon'),
         ('katlamali-perde', 'motorlu-katlamali'), ('plicell-perde', 'motorlu-plise'), ('dikey-perde', 'motorlu-dikey'),
         ('jaluzi-perde', 'motorlu-aluminyum-jaluzi'), ('jaluzi-perde', 'motorlu-ahsap-jaluzi')]

# Kategori düzeyindeki modeller (duvar kağıdı ve halı): menüde düz liste, kategori sayfasında "Çeşitler" bölümü.
# Son alan: tek ürün sayfası (str) ya da alt sayfalar listesi (list) ya da None (yalnızca kategori sayfasında anlatılır).
CAT_MODELS = {
    'duvar-kagidi': [
        ('baskili-duvar-kagidi', T('Baskılı Duvar Kağıdı', 'Printed Wallpaper', 'ورق جدران مطبوع'),
         T('Dijital baskı; ahşap ve kumaş dokuları ya da özel desenler, duvarın ölçüsüne göre.', 'Digital print — wood and fabric textures or your own pattern, sized to the wall.', 'طباعة رقمية: نقش الخشب والقماش أو نقشك الخاص، على مقاس الجدار.'),
         ['ahsap-baskili', 'kumas-baskili']),
        ('vinil-duvar-kagidi', T('Vinil Duvar Kağıdı', 'Vinyl Wallpaper', 'ورق جدران فينيل'),
         T('Silinebilir yüzey; mutfak, koridor ve yoğun kullanım alanları.', 'Wipe-clean, for kitchens, corridors and hard-worn walls.', 'سطح قابل للمسح، للمطابخ والممرات والأماكن كثيرة الاستعمال.'), 'vinyl'),
        ('non-woven-duvar-kagidi', T('Non-Woven Duvar Kağıdı', 'Non-Woven Wallpaper', 'ورق جدران نون-ووفن'),
         T('Nefes alan taban; kolay uygulanır, sökerken duvarı yormaz.', 'A breathable backing that goes up easily and comes off cleanly.', 'قاعدة تتنفس، سهلة التركيب ونظيفة عند الإزالة.'), 'non-woven'),
    ],
    'hali': [
        ('sisal-hali', T('Sisal Halı', 'Sisal Rug', 'سجاد سيزال'),
         T('Doğal lif; mat, dayanıklı ve ayak altında sıcak.', 'Natural fibre: matt, hard-wearing, warm underfoot.', 'ألياف طبيعية: مطفأة اللمعة، متينة ودافئة تحت القدم.'), 'sisal'),
        ('akustik-hali', T('Akustik Halı', 'Acoustic Carpet', 'سجاد صوتي'),
         T('Sesi emen yoğun yüzey; ofis ve toplantı alanları için.', 'A dense, sound-absorbing surface for offices and meeting rooms.', 'سطح كثيف يمتص الصوت للمكاتب وقاعات الاجتماعات.'), None),
        ('karo-hali', T('Karo Halı', 'Carpet Tiles', 'سجاد بلاطات'),
         T('Parça parça döşenen modüler halı; zarar gören parça tek başına değişir.', 'Modular tiles laid piece by piece; a damaged tile is replaced on its own.', 'بلاطات تُفرش قطعة قطعة، وتُستبدل القطعة التالفة وحدها.'), None),
        ('duvardan-duvara-hali', T('Duvardan Duvara Halı', 'Wall-to-Wall Carpet', 'سجاد من الجدار إلى الجدار'),
         T('Odanın tüm zeminini kaplayan, ölçüye göre kesilen halı.', 'Carpet cut to measure to cover the whole floor.', 'سجاد يُقص على المقاس ليغطي الأرضية كلها.'), None),
        ('poliamid-hali', T('Poliamid Halı', 'Polyamide Carpet', 'سجاد بولياميد'),
         T('Dayanıklı sentetik iplik; yoğun kullanılan alanlar için.', 'Hard-wearing synthetic yarn for busy areas.', 'خيوط صناعية متينة للأماكن كثيرة الاستعمال.'), None),
        ('ofis-halisi', T('Ofis Halısı', 'Office Carpet', 'سجاد مكتبي'),
         T('Ofis zeminleri için dayanıklı ve sessiz kaplama.', 'A hard-wearing, quiet floor covering for offices.', 'تغطية متينة وهادئة لأرضيات المكاتب.'), None),
    ],
}


def find(sub_id):
    """Model kimliğinden (ürün, satır) bulur."""
    for p, rows in SUBS.items():
        for r in rows:
            if r[0] == sub_id:
                return p, r
    return None, None
