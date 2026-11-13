"""Üretilen siteyi denetler: kırık iç bağlantılar ve çapalar, görsel alt metinleri, başlık hiyerarşisi,
title/description, canonical/hreflang, JSON-LD, yinelenen id'ler ve site haritası.

Kullanım: python3 tools/check.py   (hata varsa çıkış kodu 1)
"""
import json
import os
import re
import sys
from collections import defaultdict
from html.parser import HTMLParser
from urllib.parse import urlparse

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public')
SITE = 'https://www.beyperde.com'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.ids, self.imgs, self.heads, self.ld, self.meta = [], [], [], [], [], {}
        self.stack, self.errors, self.title, self._t, self._ld, self._h = [], [], '', False, None, None
        self.alts = []

    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag not in VOID:
            self.stack.append(tag)
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'a' and 'href' in a:
            self.links.append(a['href'])
        if tag == 'link' and a.get('rel') in ('alternate', 'canonical', 'stylesheet', 'preload', 'icon'):
            self.links.append(a.get('href', ''))
            if a.get('rel') == 'canonical':
                self.meta['canonical'] = a['href']
            if a.get('rel') == 'alternate':
                self.meta.setdefault('alt', []).append((a.get('hreflang'), a['href']))
        if tag in ('script', 'img', 'source') and a.get('src'):
            self.links.append(a['src'])
        if tag == 'img':
            self.imgs.append(a)
        if tag == 'meta' and a.get('name') == 'description':
            self.meta['desc'] = a.get('content', '')
        if tag == 'meta' and a.get('name') == 'robots':
            self.meta['robots'] = a.get('content', '')
        if tag == 'title':
            self._t = True
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self._ld = ''
        if re.fullmatch(r'h[1-6]', tag):
            self._h = [int(tag[1]), '']

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        elif tag in self.stack:
            while self.stack and self.stack[-1] != tag:
                self.errors.append(f'kapanmamış <{self.stack.pop()}>')
            self.stack.pop()
        else:
            self.errors.append(f'fazladan </{tag}>')
        if tag == 'title':
            self._t = False
        if tag == 'script' and self._ld is not None:
            self.ld.append(self._ld)
            self._ld = None
        if re.fullmatch(r'h[1-6]', tag) and self._h:
            self.heads.append(tuple(self._h))
            self._h = None

    def handle_data(self, d):
        if self._t:
            self.title += d
        if self._ld is not None:
            self._ld += d
        if self._h:
            self._h[1] += d


def resolve(path):
    """URL yolunu public/ içindeki dosyaya çevir (Vercel cleanUrls)."""
    path = path.split('#')[0].split('?')[0]
    if path in ('', '/'):
        return os.path.join(ROOT, 'tr', 'index.html')
    fs = os.path.join(ROOT, path.lstrip('/'))
    for c in (fs, fs + '.html', os.path.join(fs, 'index.html')):
        if os.path.isfile(c):
            return c
    return None


def main():
    pages = {}
    for d, _, fs in os.walk(ROOT):
        for f in fs:
            if f.endswith('.html'):
                p = os.path.join(d, f)
                parser = P()
                parser.feed(open(p, encoding='utf-8').read())
                pages[p] = parser
    errs, warns = [], []
    titles, descs = defaultdict(list), defaultdict(list)
    for p, x in pages.items():
        rel = os.path.relpath(p, ROOT)
        for e in x.errors:
            errs.append(f'{rel}: HTML {e}')
        dup = {i for i in x.ids if x.ids.count(i) > 1}
        if dup:
            errs.append(f'{rel}: yinelenen id {sorted(dup)}')
        for img in x.imgs:
            if 'alt' not in img:
                errs.append(f'{rel}: alt eksik {img.get("src")}')
            if 'width' not in img or 'height' not in img:
                warns.append(f'{rel}: boyutsuz görsel {img.get("src")}')
        h1 = [h for h in x.heads if h[0] == 1]
        if len(h1) != 1:
            errs.append(f'{rel}: {len(h1)} adet h1')
        prev = 0
        for lvl, txt in x.heads:
            if prev and lvl > prev + 1:
                warns.append(f'{rel}: başlık atlıyor h{prev}→h{lvl} ({txt.strip()[:40]})')
            prev = lvl
        for raw in x.ld:
            try:
                json.loads(raw)
            except Exception as ex:  # noqa: BLE001
                errs.append(f'{rel}: JSON-LD hatalı {ex}')
        if 'robots' not in x.meta:
            titles[x.title.strip()].append(rel)
            descs[x.meta.get('desc', '')].append(rel)
            if not x.meta.get('canonical'):
                errs.append(f'{rel}: canonical yok')
            if not (20 <= len(x.title) <= 75):
                warns.append(f'{rel}: title uzunluğu {len(x.title)}')
            if not (70 <= len(x.meta.get('desc', '')) <= 175):
                warns.append(f'{rel}: description uzunluğu {len(x.meta.get("desc", ""))}')
            for lang, href in x.meta.get('alt', []):
                if not resolve(urlparse(href).path):
                    errs.append(f'{rel}: hreflang hedefi yok {href}')
        for href in x.links:
            if not href or href.startswith(('http://', 'https://', 'mailto:', 'tel:', 'data:', 'javascript:')):
                if href.startswith(SITE) and not resolve(urlparse(href).path):
                    errs.append(f'{rel}: kırık mutlak bağlantı {href}')
                continue
            if href.startswith('#'):
                if href != '#' and href[1:] not in x.ids:
                    errs.append(f'{rel}: çapa yok {href}')
                continue
            if href.startswith('/api/'):
                continue
            target = resolve(href)
            if not target:
                errs.append(f'{rel}: kırık bağlantı {href}')
            elif '#' in href:
                frag = href.split('#', 1)[1]
                if frag and target in pages and frag not in pages[target].ids:
                    errs.append(f'{rel}: hedef sayfada çapa yok {href}')
    for t, ps in titles.items():
        if len(ps) > 1:
            errs.append(f'aynı title {len(ps)} sayfada: {t[:60]} {ps[:3]}')
    for t, ps in descs.items():
        if len(ps) > 1:
            warns.append(f'aynı description {len(ps)} sayfada: {ps[:3]}')
    sm = open(os.path.join(ROOT, 'sitemap.xml')).read()
    locs = re.findall(r'<loc>([^<]+)</loc>', sm)
    for u in locs:
        if not resolve(urlparse(u).path):
            errs.append(f'sitemap: sayfa yok {u}')
    print(f'{len(pages)} HTML sayfası, site haritasında {len(locs)} adres')
    for w in warns:
        print('  uyarı:', w)
    for e in errs:
        print('  HATA:', e)
    print(f'{len(errs)} hata, {len(warns)} uyarı')
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
