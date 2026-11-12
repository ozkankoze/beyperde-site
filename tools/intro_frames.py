"""Blender'dan gelen giriş animasyonu karelerini siteye hazırlar.
Kullanım: python3 tools/intro_frames.py <kare_d> <anchors_d.json> [anchors_x_d.json] -- <kare_m> <anchors_m.json> [anchors_x_m.json]
Çıktı: src/static/intro/{d,m}/f_XXX.webp, src/static/intro/data.js ve statik yedek görseller (src/images/intro/).
"""
import glob, json, os, sys, time
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'static', 'intro')


def run(mode, frames_dir, anchors_path, extra_path=None):
    """Ana kareler f_XXX.jpg (p = i/(n-1)); isteğe bağlı ara kareler x_KKK_J.jpg ve anchors_x_<mod>.json
    (hızlı kamera hareketinde sıklaştırma). Hepsi p'ye göre sıralanıp f_000.. olarak yeniden numaralanır."""
    meta = json.load(open(anchors_path))
    n0 = meta['n']
    files = sorted(glob.glob(os.path.join(frames_dir, 'f_*.jpg')))
    assert len(files) == n0, f'{mode}: {len(files)} kare var, {n0} bekleniyordu'
    items = [(i / (n0 - 1), f, meta['anchors'][i]) for i, f in enumerate(files)]
    if extra_path and os.path.exists(extra_path):
        xa = json.load(open(extra_path))
        for name, row in xa.items():
            f = os.path.join(frames_dir, name + '.jpg')
            if os.path.exists(f):
                _, k, j = name.split('_')
                plan = [q for q in xa if q.startswith(f'x_{k}_')]
                items.append(((int(k) + int(j) / (len(plan) + 1)) / (n0 - 1), f, row))
    items.sort(key=lambda t: t[0])
    d = os.path.join(OUT, mode)
    if os.path.isdir(d):
        for old in glob.glob(os.path.join(d, 'f_*.webp')):
            os.remove(old)
    os.makedirs(d, exist_ok=True)
    for i, (_, f, _) in enumerate(items):
        Image.open(f).save(os.path.join(d, f'f_{i:03d}.webp'), 'WEBP', quality=72, method=5)
    os.makedirs(os.path.join(ROOT, 'src', 'images', 'intro'), exist_ok=True)
    Image.open(files[0]).save(os.path.join(ROOT, 'src', 'images', 'intro', f'kapi-{mode}.webp'), 'WEBP', quality=86)
    out = {'n': len(items), 'w': meta['w'], 'h': meta['h'], 'v': int(time.time()), 'anchors': [t[2] for t in items]}
    if len(items) != n0:
        out['ps'] = [round(t[0], 5) for t in items]
    return out


data = {}
args = sys.argv[1:]
# her mod için: <kare_klasörü> <anchors.json> [<anchors_x.json>] ; modlar '--' ile ayrılır
groups = [g.split() for g in ' '.join(args).split(' -- ')]
for mode, g in zip(('d', 'm'), groups):
    if len(g) >= 2:
        data[mode] = run(mode, *g[:3])
old = os.path.join(OUT, 'data.js')
if os.path.exists(old):  # önceki modu koru
    prev = json.loads(open(old).read().split('=', 1)[1].rstrip(';\n'))
    for k, v in prev.items():
        data.setdefault(k, v)
open(old, 'w').write('window.BP_INTRO=' + json.dumps(data, separators=(',', ':')) + ';\n')
print({k: v['n'] for k, v in data.items()})
