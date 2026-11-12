# -*- coding: utf-8 -*-
"""Katalog öğeleri: beyperde.com'daki her ürün fotoğrafı, açıklamasından çıkarılan etiketlerle.

Etiketler fotoğraf açıklamalarındaki (alt metin) kelimelerden ve ürün türünün bilinen
özelliklerinden türetilir. Açıklamada renk geçmeyen vinil desenlerinde renk, fotoğrafın
merkezindeki ortalama tondan hesaplanır.
"""
import colorsys
import re

from .data import PRODUCTS

TYPE_DEFAULTS = {
    #               malzeme            stil          ışık
    'tul-perde': (['tul'], [], ['gecirir']),
    'fon-perde': ([], [], ['keser']),
    'stor-perde': ([], ['modern'], []),
    'jaluzi-perde': ([], [], ['ayarlanir']),
    'motorlu-jaluzi': ([], ['modern'], ['ayarlanir']),
    'blackout-perde': ([], [], ['keser']),
    'dikey-perde': ([], ['modern'], ['ayarlanir']),
    'katlamali-perde': ([], [], ['ayarlanir']),
    'plicell-perde': ([], ['modern'], ['ayarlanir']),
    'motorlu-perde': ([], ['modern'], []),
    'rustik-perde': ([], ['klasik'], []),
    'perde-aksesuarlari': ([], [], []),
    'tekstil': (['tekstil'], ['dogal'], []),
    'vinyl': (['vinil'], [], []),
    'sisal': (['dogal'], ['dogal'], []),
}

COLOR_WORDS = [
    ('beyaz', r'\bbeyaz'), ('krem', r'krem|bej|keten rengi|kum '), ('gri', r'\bgri'), ('kahve', r'kahve|toprak|tarçın|vizon|ceviz|bal ton'),
    ('koyu', r'siyah|koyu'), ('yesil', r'yeşil|zeytin'), ('renkli', r'turuncu|ahududu|kırmızı|bordo'), ('metal', r'altın|bronz'),
]
ROOM_WORDS = [
    ('salon', r'salon|kanepe|berjer|chester'), ('yatak', r'yatak odas'), ('cocuk', r'çocuk'), ('mutfak', r'mutfak|tezgâh'),
    ('yemek', r'yemek'), ('calisma', r'çalışma odas'), ('ofis', r'ofis|toplantı'), ('genis', r'sürgülü|kış bahçe|geniş pencere|balkon kapı|bahçeye açılan|havuz'),
    ('villa', r'çift yükseklik|villa'), ('koridor', r'koridor'),
]
MAT_WORDS = [('keten', r'keten'), ('dokulu', r'dokulu|doku\b'), ('desenli', r'desenli|çizgili|işlemeli|oyma'), ('ahsap', r'ahşap|ceviz|bal ton'),
             ('metal', r'metal'), ('tul', r'\btül')]
STYLE_WORDS = [('klasik', r'kristal|chester|kartonpiyer|işlemeli|saçak|altın|yaprak|klasik|berjer'),
               ('modern', r'tavandaki|tavanın|ray|siyah metal|alınlık|toplantı|ofis'),
               ('dogal', r'keten|ahşap|hasır|sisal|bal ton|ceviz')]


def color_from_rgb(rgb):
    r, g, b = [x / 255 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    h *= 360
    if l > 0.82:
        return 'beyaz'
    if l < 0.22:
        return 'koyu'
    if s < 0.12:
        return 'gri' if l < 0.7 else 'krem'
    if 20 <= h < 55:
        return 'krem' if l > 0.6 else 'kahve'
    if 55 <= h < 160:
        return 'yesil'
    if h < 20 or h >= 330:
        return 'renkli' if s > 0.35 else 'kahve'
    return 'gri'


def build_catalog(IMG, RAW, PRAW=None):
    items = []
    sources = []
    for slug, (cat, name, short) in PRODUCTS.items():
        r = RAW[f'{cat}/{slug}']
        for src in r['tr']['imgs']:
            sources.append((slug, cat, src, {l: r[l]['alts'].get(src, '') for l in ('tr', 'en', 'ar')}, None))
    if PRAW:  # proje fotoğrafları (gerçek uygulamalar)
        for gi, g in enumerate(PRAW['tr']['groups']):
            for ii, it in enumerate(g['items']):
                alts = {l: PRAW[l]['groups'][gi]['items'][ii]['alt'] for l in ('tr', 'en', 'ar')}
                slug = 'jaluzi-perde' if 'jaluzi' in it['alt'].lower() else 'tul-perde'
                sources.append((slug, 'perde', it['src'], alts, 'Erenköy H.K Evi'))
    for slug, cat, src, alts, project in sources:
        if True:
            key = re.sub(r'\.(jpe?g|png|webp)$', '', src.lstrip('/'))
            if key + '.webp' not in IMG:
                continue
            alt_tr = alts['tr']
            low = alt_tr.lower()
            mats, styles, light = [list(x) for x in TYPE_DEFAULTS.get(slug, ([], [], []))]
            colors = [c for c, rx in COLOR_WORDS if re.search(rx, low)]
            if not colors and slug == 'vinyl':
                colors = [color_from_rgb(IMG[key + '.webp']['avg'])]
            rooms = [k for k, rx in ROOM_WORDS if re.search(rx, low)]
            mats += [k for k, rx in MAT_WORDS if re.search(rx, low) and k not in mats]
            styles += [k for k, rx in STYLE_WORDS if re.search(rx, low) and k not in styles]
            if slug == 'stor-perde':
                if re.search(r'ışık geçiren|gün ışığıyla', low):
                    light.append('gecirir')
            if slug == 'katlamali-perde' and 'tül' in low:
                light = ['gecirir']
            if slug == 'perde-aksesuarlari':
                light = []
            m = re.search(r'AdaWall (\w+) koleksiyonundan ([\d\-]+)', alt_tr)
            code = f'AdaWall {m.group(1)} {m.group(2)}' if m else (f'{project} · ' + key.rsplit('/', 1)[1]) if project else key.split('/', 1)[1] if '/' in key else key
            items.append({
                'key': key, 'slug': slug, 'cat': cat, 'src': src, 'code': code,
                'alt': alts, 'project': project,
                'color': sorted(set(colors)), 'material': sorted(set(mats)), 'room': sorted(set(rooms)),
                'style': sorted(set(styles)), 'light': sorted(set(light)),
            })
    return items
