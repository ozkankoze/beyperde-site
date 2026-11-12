"""Blender'dan gelen giriş animasyonu karelerini siteye hazırlar.
Kullanım: python3 tools/intro_frames.py <kare_klasörü_d> <anchors_d.json> [<kare_klasörü_m> <anchors_m.json>]
Çıktı: src/static/intro/{d,m}/f_XXX.webp, src/static/intro/data.js ve statik yedek görseller (src/images/intro/).
"""
import glob, json, os, sys, time
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'static', 'intro')


def run(mode, frames_dir, anchors_path):
    meta = json.load(open(anchors_path))
    d = os.path.join(OUT, mode)
    os.makedirs(d, exist_ok=True)
    files = sorted(glob.glob(os.path.join(frames_dir, 'f_*.jpg')))
    assert len(files) == meta['n'], f'{mode}: {len(files)} kare var, {meta["n"]} bekleniyordu'
    for f in files:
        Image.open(f).save(os.path.join(d, os.path.basename(f)[:-4] + '.webp'), 'WEBP', quality=74, method=5)
    os.makedirs(os.path.join(ROOT, 'src', 'images', 'intro'), exist_ok=True)
    Image.open(files[0]).save(os.path.join(ROOT, 'src', 'images', 'intro', f'kapi-{mode}.webp'), 'WEBP', quality=86)
    return {'n': meta['n'], 'w': meta['w'], 'h': meta['h'], 'v': int(time.time()), 'anchors': meta['anchors']}


data = {}
args = sys.argv[1:]
for mode, (fd, an) in zip(('d', 'm'), (args[0:2], args[2:4])):
    if fd and an:
        data[mode] = run(mode, fd, an)
old = os.path.join(OUT, 'data.js')
if os.path.exists(old):  # önceki modu koru
    prev = json.loads(open(old).read().split('=', 1)[1].rstrip(';\n'))
    for k, v in prev.items():
        data.setdefault(k, v)
open(old, 'w').write('window.BP_INTRO=' + json.dumps(data, separators=(',', ':')) + ';\n')
print({k: v['n'] for k, v in data.items()})
