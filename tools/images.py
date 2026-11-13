"""Kaynak görsellerden (src/images) duyarlı AVIF + WebP sürümleri üretir.

Çıktı: public/img/<yol>-<genişlik>.<avif|webp> ve src/content/images.json (boyut + ortalama renk).
Yalnızca değişen dosyaları yeniden üretir.
"""
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'images')
OUT = os.path.join(ROOT, 'public', 'img')
MANIFEST = os.path.join(ROOT, 'src', 'content', 'images.json')
WIDTHS = [240, 480, 720, 960, 1600]


def process(rel):
    src = os.path.join(SRC, rel)
    base = os.path.splitext(rel)[0]
    im = Image.open(src)
    if rel.endswith('.png'):
        os.makedirs(os.path.dirname(os.path.join(OUT, rel)) or OUT, exist_ok=True)
        dst = os.path.join(OUT, base + '.png')
        if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
            im.save(dst, optimize=True)
        return rel, {'w': im.width, 'h': im.height, 'widths': [], 'png': True}
    im = im.convert('RGB')
    widths = [w for w in WIDTHS if w < im.width] + [min(im.width, WIDTHS[-1])]
    widths = sorted(set(widths))
    for w in widths:
        h = round(im.height * w / im.width)
        for fmt, q in (('webp', 76), ('avif', 52)):
            dst = os.path.join(OUT, f'{base}-{w}.{fmt}')
            if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            r = im.resize((w, h), Image.LANCZOS)
            if fmt == 'webp':
                r.save(dst, 'WEBP', quality=q, method=5)
            else:
                r.save(dst, 'AVIF', quality=q, speed=6)
    # merkez bölgenin ortalama rengi (katalog renk etiketi için)
    c = im.crop((im.width // 4, im.height // 4, im.width * 3 // 4, im.height * 3 // 4)).resize((1, 1), Image.BOX).getpixel((0, 0))
    return rel, {'w': im.width, 'h': im.height, 'widths': widths, 'avg': list(c)}


def main():
    rels = []
    for d, _, fs in os.walk(SRC):
        for f in fs:
            if f.endswith(('.webp', '.png')):
                rels.append(os.path.relpath(os.path.join(d, f), SRC))
    with ProcessPoolExecutor() as ex:
        res = dict(ex.map(process, sorted(rels)))
    json.dump(res, open(MANIFEST, 'w'), indent=0, sort_keys=True)
    print(f'{len(res)} görsel işlendi', file=sys.stderr)


if __name__ == '__main__':
    main()
