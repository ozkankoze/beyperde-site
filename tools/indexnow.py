"""IndexNow: site haritasındaki adresleri Bing/Yandex'e bildirir.

Kullanım (yayın Vercel'de tamamlandıktan sonra):
    python3 tools/indexnow.py            # site haritasındaki tüm adresler
    python3 tools/indexnow.py /tr/blog/x # yalnızca verilen adresler
Anahtar dosyası src/static/<anahtar>.txt olarak sitenin kökünde yayınlanır.
"""
import glob, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'src', 'content'))
import data as D  # noqa: E402

keys = [p for p in glob.glob(os.path.join(ROOT, 'src', 'static', '*.txt')) if re.fullmatch(r'[0-9a-f]{32}\.txt', os.path.basename(p))]
if len(keys) != 1:
    sys.exit('Tek bir IndexNow anahtar dosyası bulunamadı')
key = os.path.basename(keys[0])[:-4]
host = D.SITE.split('://', 1)[1]

if sys.argv[1:]:
    urls = [u if u.startswith('http') else D.SITE + u for u in sys.argv[1:]]
else:
    urls = re.findall(r'<loc>(.*?)</loc>', open(os.path.join(ROOT, 'public', 'sitemap.xml'), encoding='utf-8').read())
    urls = [u for u in urls if u.startswith(D.SITE + '/') and '/img/' not in u]

body = json.dumps({'host': host, 'key': key, 'keyLocation': f'{D.SITE}/{key}.txt', 'urlList': urls}).encode()
req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body,
                             headers={'Content-Type': 'application/json; charset=utf-8'})
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f'IndexNow: {len(urls)} adres gönderildi, yanıt {r.status}')
except urllib.error.HTTPError as e:
    sys.exit(f'IndexNow hata {e.code}: {e.read()[:300]!r}')
