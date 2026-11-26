"""Proje fotoğraflarına hafif düzeltme: soluk/karanlık olanları aydınlatır, kontrastı dengeler, netlik verir.
Kullanım: python3 tools/enhance.py <dosya.webp> [...]   (dosyanın üzerine yazar)"""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps


def enhance(path):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.float32) / 255
    lum = (a * [0.299, 0.587, 0.114]).sum(2)
    m = float(np.median(lum))
    if m < 0.46:                      # karanlık/soluk: orta tonları yukarı çek
        g = np.log(0.5) / np.log(max(m, 0.12))
        a = a ** max(0.62, min(1.0, g))
    lo, hi = np.percentile(a, 0.4), np.percentile(a, 99.7)
    a = np.clip((a - lo) / max(hi - lo, 1e-3), 0, 1)
    out = Image.fromarray((a * 255).round().astype(np.uint8))
    out = out.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=3))
    out.save(path, 'WEBP', quality=86)
    return m


for p in sys.argv[1:]:
    print(f'{p}: medyan {enhance(p):.2f}')
