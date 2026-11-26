"""Google Haritalar'daki gerçek müşteri yorumlarından seçki.

Metinler müşterilerin yazdığı gibi, düzeltme yapılmadan alınmıştır.
İsimler gizlilik için ad + soyadının baş harfi olarak gösterilir.
Kaynak: Google Haritalar, Bey Perde Çekmeköy (26 Kasım 2026'da alındı).
Not: Google'ın kuralları gereği bu yorumlar için Review/AggregateRating
yapılandırılmış verisi eklenmez (kendi sitesindeki üçüncü taraf yorumları).
"""

SUMMARY = {'rating': '5,0', 'count': 82, 'asof': '2026-11'}

REVIEWS = [
    ('Emre T.', 'İşçilik, ölçü ve kumaş kalitesi mükemmel. Salona inanılmaz ferah ve modern bir hava kattı. Zamanında teslimat ve özenli montaj için çok teşekkür ederim, gönül rahatlığıyla tavsiye ederim!'),
    ('Anıl S.', 'Bir İç mimar olarak Bulgurlu, Ormanköy, Ömerli, Reşadiye projelerimizde çalıştığımız memnun kaldığımız render neyse onu çıkartan bir firma Ali Berkcan Beyin başarılarının devamını dilerim'),
    ('Asude Y.', 'Perdenin dokusu ve duruşu tam da istediğim gibi, gerçekten çok güzel oldu. İlgi ve alakası için Berkcan Bey’e çok teşekkür ederim. Gönül rahatlığıyla tercih edebilirsiniz, kesinlikle tavsiye ederim.'),
    ('Tuğba C.', 'Evimi tadilatla yeniledikten sonra perde seçimi için kendileri ile tanışmış olduk Kafamızda ki her şeyi anlayıp, ona göre bizi yönlendirerek çok kusursuz bir iş çıkardılar Seçimler güzel oldu ama önemli olan işçilikti ve bunu gerçekten çok çok iyi yapıyorlar Elinize, emeğinize sağlık'),
    ('Mesude Ö.', 'Bey perdeden almış olduğum perdem sadeliği ve şıklığıyla salonumda şahane durdu. Kaliteli ve samimi hizmetlerinden de çok memnun kaldım. Çok teşekkür ederim. Güvenle tavsiye ederim ☺️'),
    ('Umut K.', 'Komşumun tavsiyesi ile Ormanköy, Çınarköy projelerinde yaptığı işleri araştırıp buldum. Müşteri hizmetleri gibi açık olan telefonu ve ulaşılabilirliği ile müşterinin önceliği ile ilgilenen bir işletme :) gayet titiz ve kaliteli işçilik, teşekkür ederiz ve yorumu okuyan herkese abartılmadan tavsiye edebileceğim yazılmış düşüncemdir.'),
    ('Banu T.', 'İşini severek yapan ve yaparken emeğinin hakkını veren genç kardeşlerimize teşekkür ederim. Salonum elleri değdikten sonra dahada güzelleşti. Çok güzel işçilik çıkarmışlar. Bu vesileyle tekrardan teşekkürler Bey Perde'),
    ('Aysunur E.', 'salonuma perde yaptırdım çok memnun kaldım güler yüzlü ve işini gercekten hakettigi gibi yapan yer özellikle berkcan beyin yönlendirmeleri sayesinde hayalimden daha güzel oldu herkese tavsiye ederim :)'),
    ('Gülsen E.', 'Sevgili Ali berkcancim reşadiye köyünde bulunan mustakil evimizde yapılan hizmet ve ürünlerden memnun kaldım bildirmek isterim Ellerine emeğine sağlık'),
    ('Pınar G.', 'Sadece perde degil odalariniza ruh katan tasarimlar hazirliyorlar..bastan sona estetik ve kalite..Ali bey ve ailesine tesekkurler'),
    ('Sevildjan S.', 'Evimin stor perdelerini değiştirdim Çok ilgili işinde çok temiz ve güvenilir ürünler çok kaliteli Evimin perdelerinde değişim yapıcam ve tekrar kendileri ile çalışmak isterim...İlgilerinden ve güler yüzlğ olmalarınada ayrıca Teşekkür ederim'),
    ('Fuat Y.', 'Çok ilgili işinde çok temiz ve güvenilir ürünler çok kaliteli evimize çok yakıştı emekleri için teşekkür ederiz.'),
]

TEXT = {
    'k': {'tr': 'Müşteri yorumları', 'en': 'Customer reviews'},
    'h': {'tr': 'Google’da 82 yorum, ortalama 5,0', 'en': '82 reviews on Google, 5.0 average'},
    'p': {'tr': 'Perdesini bize diktiren müşterilerimizin Google Haritalar’a yazdığı yorumlardan bir seçki. Yorumlar yazıldığı gibi aktarılmıştır.',
          'en': 'A selection of reviews our customers left on Google Maps, shown in the original Turkish as written.'},
    'all': {'tr': 'Tüm yorumları Google’da okuyun', 'en': 'Read all reviews on Google'},
    'src': {'tr': 'Google yorumu', 'en': 'Google review'},
    'stars': {'tr': '5 üzerinden 5 yıldız', 'en': '5 out of 5 stars'},
}
