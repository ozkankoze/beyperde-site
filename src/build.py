# -*- coding: utf-8 -*-
"""Bey Perde statik site üreticisi.

Kullanım:  python3 src/build.py         (public/ klasörünü üretir)
Görseller için önce:  python3 tools/images.py
"""
import html
import json
import os
import re
import shutil
import sys
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'src'))
from content import data as D          # noqa: E402
from content import pages as P         # noqa: E402
from content import projects as PJ     # noqa: E402
from content import local as LOC       # noqa: E402
from content.catalog import build_catalog  # noqa: E402

PUB = os.path.join(ROOT, 'public')
IMG = json.load(open(os.path.join(ROOT, 'src', 'content', 'images.json')))
RAW = json.load(open(os.path.join(ROOT, 'src', 'content', 'products.raw.json')))
PRAW = json.load(open(os.path.join(ROOT, 'src', 'content', 'pages.raw.json')))
COMPARE = json.load(open(os.path.join(ROOT, 'src', 'content', 'compare.json')))
def _asset_version():
    # içerik özeti: dosyalar her değiştiğinde adres değişir, tarayıcı önbelleği eski sürümü kullanamaz
    import hashlib
    h = hashlib.sha1()
    for f in sorted(os.listdir(os.path.join(ROOT, 'src', 'assets'))):
        h.update(open(os.path.join(ROOT, 'src', 'assets', f), 'rb').read())
    return h.hexdigest()[:10]


VERSION = _asset_version()
SITE_CSS = open(os.path.join(ROOT, 'src', 'assets', 'site.css')).read().strip()
_iv = os.path.join(ROOT, 'src', 'static', 'intro', 'giris.mp4')
_ih = os.path.join(ROOT, 'src', 'static', 'intro', 'giris-2k.mp4')
INTRO_HD = os.path.exists(_ih)
_h = __import__('hashlib').sha1()
for _f in (_iv, _ih):
    if os.path.exists(_f):
        _h.update(open(_f, 'rb').read())
INTRO_V = _h.hexdigest()[:10]

e = html.escape
LANGS = D.LANGS
ALL = set(LANGS)
TR_ONLY = {'tr'}
PAGES_OUT = []        # (path, langs) for sitemap


def tx(v, lang):
    """Çok dilli değer (dict) ya da düz metin."""
    if isinstance(v, dict):
        return v[lang]
    return v


def ui(key, lang, **kw):
    s = D.UI[key][lang]
    return s.format(**kw) if kw else s


def url(lang, path=''):
    return f'/{lang}' + (f'/{path}' if path else '')


def abs_url(lang, path=''):
    return D.SITE + url(lang, path)


def wa_link(text):
    return f'https://wa.me/{D.WA_NUMBER}?text={quote(text)}'


def ltr(s):
    return f'<bdi dir="ltr">{e(s)}</bdi>'


# ---------------------------------------------------------------- görseller
def img_key(rel):
    rel = rel.lstrip('/')
    rel = re.sub(r'\.(jpe?g|png|webp)$', '', rel)
    return rel


def has_img(rel):
    return (img_key(rel) + '.webp') in IMG


def picture(rel, alt, sizes='(max-width: 820px) 100vw, 50vw', cls='', eager=False, attrs=''):
    k = img_key(rel)
    m = IMG[k + '.webp']
    ws = m['widths']
    src = f'/img/{k}-{ws[min(1, len(ws) - 1)]}.webp'
    avif = ', '.join(f'/img/{k}-{w}.avif {w}w' for w in ws)
    webp = ', '.join(f'/img/{k}-{w}.webp {w}w' for w in ws)
    load = 'fetchpriority="high" loading="eager"' if eager else 'loading="lazy"'
    c = f' class="{cls}"' if cls else ''
    return (f'<picture><source type="image/avif" srcset="{avif}" sizes="{sizes}">'
            f'<source type="image/webp" srcset="{webp}" sizes="{sizes}">'
            f'<img{c} src="{src}" width="{m["w"]}" height="{m["h"]}" alt="{e(alt)}" {load} decoding="async"{attrs}></picture>')


def big_src(rel):
    k = img_key(rel)
    return f'/img/{k}-{IMG[k + ".webp"]["widths"][-1]}.webp'


def og_src(rel):
    k = img_key(rel)
    ws = IMG[k + '.webp']['widths']
    w = 1600 if 1600 in ws else ws[-1]
    return f'{D.SITE}/img/{k}-{w}.webp'


# ---------------------------------------------------------------- ortak parçalar
ICON = {
    'wa': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-2-1.2-.7-.6-1.2-1.4-1.3-1.7-.1-.2 0-.4.1-.5l.4-.4.3-.4v-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 2.2.9 2.6.7 3.1.7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.2-.3-.3-.5-.4Z"/></svg>',
    'arrow': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'check': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'phone': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 3.5h2.6l1.5 4-2 1.3a12 12 0 0 0 6.5 6.5l1.3-2 4 1.5v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    'close': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'filter': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'insta': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></svg>',
}


def arrow_link(href, label, cls='arrow-link', attrs=''):
    return f'<a class="{cls}" href="{href}"{attrs}><span>{label}</span>{ICON["arrow"]}</a>'


def btn_wa(lang, text, label=None, cls='btn btn-wa'):
    label = label or ui('whatsapp', lang)
    return f'<a class="{cls}" href="{e(wa_link(text))}" target="_blank" rel="noopener" data-wa>{ICON["wa"]}<span>{label}</span></a>'


def header(lang, path, avail, nav=''):
    items = [('urunler', 'nav_products'), ('katalog', 'nav_catalog'), ('projeler', 'nav_projects'),
             ('hakkimizda', 'nav_about'), ('iletisim', 'nav_contact')]
    links = ''.join(f'<li><a href="{url(lang, p)}"{" aria-current=\"page\"" if nav == p else ""}>{ui(k, lang)}</a></li>' for p, k in items)
    # Masaüstü menüde "Ürünler" altında açılan kategori paneli
    def mcol(cat):
        c = D.CATS[cat]
        lis = ''.join(f'<li><a href="{url(lang, f"urunler/{cat}/{s}")}">{tx(D.PRODUCTS[s][1], lang)}</a></li>' for s in c['items'])
        return f'<div class="mega-col"><a class="mega-h" href="{url(lang, f"urunler/{cat}")}">{tx(c["name"], lang)}</a><ul>{lis}</ul></div>'
    mega = f'<div class="mega" id="mega-urunler"><div class="mega-in">{mcol("perde")}<div class="mega-stack">{mcol("duvar-kagidi")}{mcol("hali")}</div><div class="mega-col mega-more"><a class="mega-h" href="{url(lang, "katalog")}">{ui("nav_catalog", lang)}</a></div></div></div>'
    dlinks = ''.join(
        (f'<li class="has-mega"><a href="{url(lang, 'katalog')}"{" aria-current=\"page\"" if nav == p else ""} aria-haspopup="true">{ui(k, lang)}<svg class="caret" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></a>{mega}</li>' if p == 'urunler'
         else f'<li><a href="{url(lang, p)}"{" aria-current=\"page\"" if nav == p else ""}>{ui(k, lang)}</a></li>') for p, k in items)
    mcats = ''.join(f'<li><a href="{url(lang, f"urunler/{c}")}">{tx(D.CATS[c]["name"], lang)}</a></li>' for c in ('perde', 'duvar-kagidi', 'hali'))
    mlinks = ''.join(
        (f'<li><a href="{url(lang, 'katalog')}"{" aria-current=\"page\"" if nav == p else ""}>{ui(k, lang)}</a><ul class="mmenu-sub">{mcats}</ul></li>' if p == 'urunler'
         else f'<li><a href="{url(lang, p)}"{" aria-current=\"page\"" if nav == p else ""}>{ui(k, lang)}</a></li>') for p, k in items)
    langs = ''.join(
        f'<li><a href="{url(l, path)}" hreflang="{l}" lang="{l}"{" aria-current=\"true\"" if l == lang else ""}>{l.upper()}</a></li>'
        for l in LANGS if l in avail)
    lang_block = f'<ul class="lang" aria-label="{ui("language", lang)}">{langs}</ul>' if len(avail) > 1 else ''
    mlangs = ''.join(f'<li><a href="{url(l, path)}" hreflang="{l}" lang="{l}"{" aria-current=\"true\"" if l == lang else ""}>{D.UI["lang_name"][l]}</a></li>' for l in LANGS if l in avail)
    return f'''<header class="site-header" data-header>
  <div class="hdr">
    <a class="logo" href="{url(lang)}" aria-label="{ui('brand', lang)} — {ui('nav_home', lang)}">
      <img class="logo-l" src="/brand/logo-cream-96.webp" srcset="/brand/logo-cream-96.webp 1x, /brand/logo-cream-192.webp 2x" width="96" height="95" alt="">
      <img class="logo-d" src="/brand/logo-brown-96.webp" srcset="/brand/logo-brown-96.webp 1x, /brand/logo-brown-192.webp 2x" width="96" height="95" alt="">
    </a>
    <nav class="nav" aria-label="{ui('nav_main', lang)}"><ul>{dlinks}</ul></nav>
    <div class="hdr-end">
      {lang_block}
      <a class="hdr-tel" href="tel:{D.TEL}">{ltr(D.PHONE_DISPLAY)}</a>
      <a class="btn btn-sm hdr-cta" href="{url(lang, 'iletisim')}#teklif">{ui('get_quote', lang)}</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mmenu" data-menu-open><span class="menu-lines" aria-hidden="true"></span><span class="sr">{ui('menu', lang)}</span></button>
    </div>
  </div>
</header>
<div class="mmenu" id="mmenu" role="dialog" aria-modal="true" aria-label="{ui('menu', lang)}" hidden>
  <div class="mmenu-top"><img src="/brand/logo-cream-96.webp" srcset="/brand/logo-cream-96.webp 1x, /brand/logo-cream-192.webp 2x" width="96" height="95" alt="" class="mmenu-logo" loading="lazy"><button class="icon-btn" type="button" data-menu-close>{ICON['close']}<span class="sr">{ui('close', lang)}</span></button></div>
  <nav aria-label="{ui('nav_main', lang)}"><ul class="mmenu-links"><li><a href="{url(lang)}">{ui('nav_home', lang)}</a></li>{mlinks}<li><a href="{url(lang, 'galeri')}">{ui('nav_gallery', lang)}</a></li></ul></nav>
  <div class="mmenu-foot">
    {f'<ul class="mmenu-lang" aria-label="{ui("language", lang)}">{mlangs}</ul>' if len(avail) > 1 else ''}
    <div class="mmenu-actions"><a class="btn btn-light" href="tel:{D.TEL}">{ICON['phone']}<span>{ltr(D.PHONE_DISPLAY)}</span></a>{btn_wa(lang, ui('wa_general', lang), ui('whatsapp_short', lang), 'btn btn-wa')}</div>
  </div>
</div>'''


def footer(lang, avail):
    def col(cat):
        c = D.CATS[cat]
        lis = ''.join(f'<li><a href="{url(lang, f"urunler/{cat}/{s}")}">{tx(D.PRODUCTS[s][1], lang)}</a></li>' for s in c['items'])
        return f'<nav aria-label="{tx(c["name"], lang)}"><h2><a href="{url(lang, f"urunler/{cat}")}">{tx(c["name"], lang)}</a></h2><ul>{lis}</ul></nav>'
    areas = ''.join(f'<li><a href="/tr/hizmet-bolgeleri/{k}"{"" if lang == "tr" else " hreflang=\"tr\" lang=\"tr\""}>{tx(P.AREA_NAMES[k], lang)}</a></li>' for k, _ in P.AREAS)
    legal = ''.join(f'<li><a href="/tr/{p}"{"" if lang == "tr" else " hreflang=\"tr\""}>{ui(k, lang)}</a></li>' for p, k in [('kvkk', 'kvkk'), ('gizlilik-politikasi', 'privacy'), ('cerez-politikasi', 'cookies')])
    company = ''.join(f'<li><a href="{url(lang, p)}">{ui(k, lang)}</a></li>' for p, k in [('hakkimizda', 'nav_about'), ('projeler', 'nav_projects'), ('katalog', 'nav_catalog'), ('galeri', 'nav_gallery'), ('iletisim', 'nav_contact')])
    return f'''<footer class="site-footer">
  <div class="wrap">
    <div class="ft-top">
      <div class="ft-brand">
        <img src="/brand/logo-cream-192.webp" width="192" height="190" alt="{ui('brand', lang)}" loading="lazy">
        <p>{ui('footer_about', lang)}</p>
        <div class="ft-social"><a href="{D.INSTAGRAM}" target="_blank" rel="noopener" aria-label="Instagram @beyperdee">{ICON['insta']}<span>@beyperdee</span></a></div>
      </div>
      <div class="ft-cols">
        {col('perde')}
        <div>{col('duvar-kagidi')}{col('hali')}</div>
        <nav aria-label="{ui('footer_company', lang)}"><h2>{ui('footer_company', lang)}</h2><ul>{company}</ul>
          <h2 class="mt">{ui('areas', lang)}</h2><ul>{areas}</ul></nav>
        <div><h2>{ui('footer_contact', lang)}</h2>
          <address class="ft-nap"><strong>{ui('brand', lang)}</strong><br><span lang="tr">{e(D.ADDRESS_LINE)}</span><br><br>
            <a href="tel:{D.TEL}">{ltr(D.PHONE)}</a><br><a href="mailto:{D.EMAIL}">{D.EMAIL}</a><br>{ui('hours', lang)}</address>
          <p class="ft-dir">{arrow_link(D.MAPS_DIR, ui('directions', lang), attrs=' target="_blank" rel="noopener"')}</p>
        </div>
      </div>
    </div>
    <div class="ft-bottom"><span>© 2026 {ui('brand', lang)}. {ui('rights', lang)}</span><ul class="ft-legal">{legal}</ul></div>
  </div>
</footer>'''


def breadcrumbs(lang, items):
    """items: [(label, path or None)] — Anasayfa otomatik eklenir."""
    full = [(ui('nav_home', lang), '')] + items
    lis = []
    for i, (label, p) in enumerate(full):
        if i == len(full) - 1:
            lis.append(f'<li aria-current="page">{e(label)}</li>')
        else:
            lis.append(f'<li><a href="{url(lang, p)}">{e(label)}</a></li>')
    schema = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': label, 'item': abs_url(lang, p if p is not None else '')}
        for i, (label, p) in enumerate(full)]}
    # son öğe için mevcut sayfa
    return f'<nav class="crumbs" aria-label="{ui("breadcrumb", lang)}"><ol>{"".join(lis)}</ol></nav>', schema


LOCALBIZ = {
    '@context': 'https://schema.org', '@type': 'HomeGoodsStore', '@id': D.SITE + '/#isletme',
    'name': 'Bey Perde', 'url': D.SITE + '/tr', 'logo': D.SITE + '/img/logo-brown.png',
    'image': D.SITE + '/img/ana-sayfa-1600.webp',
    'description': 'Perde, duvar kağıdı ve halı. Ölçüden üretime, montajdan bakıma; ev, villa ve proje işleri tek elden.',
    'telephone': D.PHONE, 'email': D.EMAIL, 'foundingDate': '2017', 'priceRange': '₺₺',
    'address': {'@type': 'PostalAddress', 'streetAddress': D.ADDRESS['street'], 'addressLocality': D.ADDRESS['city'],
                'addressRegion': D.ADDRESS['region'], 'postalCode': D.ADDRESS['postal'], 'addressCountry': D.ADDRESS['country']},
    'hasMap': D.MAPS,
    'openingHoursSpecification': [{'@type': 'OpeningHoursSpecification', 'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], 'opens': '09:00', 'closes': '18:00'}],
    'areaServed': [{'@type': 'Place', 'name': n} for n in ['Çekmeköy', 'Şile', 'Ağva', 'Riva', 'Beykoz']],
    'knowsLanguage': ['tr', 'en', 'ar'],
    'sameAs': [D.INSTAGRAM],
}


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False).replace('</', '<\\/') + '</script>'


def layout(lang, path, title, desc, body, avail=ALL, nav='', schemas=(), scripts=(), og_image=None,
           body_cls='', wa_text=None, head_extra='', noindex=False):
    dir_ = 'rtl' if lang == 'ar' else 'ltr'
    alts = ''.join(f'<link rel="alternate" hreflang="{l}" href="{abs_url(l, path)}">' for l in LANGS if l in avail)
    if 'tr' in avail:
        alts += f'<link rel="alternate" hreflang="x-default" href="{abs_url("tr", path)}">'
    og = og_image or og_src('ana-sayfa')
    locale = {'tr': 'tr_TR', 'en': 'en_GB', 'ar': 'ar_AR'}[lang]
    wa = wa_text or ui('wa_general', lang)
    font_pre = ('<link rel="preload" href="/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2" as="font" type="font/woff2" crossorigin>' if lang == 'ar'
                else '<link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>')
    def _src(s):
        if s == 'intro-data':
            v = int(os.path.getmtime(os.path.join(ROOT, 'src', 'static', 'intro', 'data.js'))) if os.path.exists(os.path.join(ROOT, 'src', 'static', 'intro', 'data.js')) else 0
            return f'/intro/data.js?v={v}'
        return f'/assets/{s}?v={VERSION}'
    js = ''.join(f'<script src="{_src(s)}" defer></script>' for s in ('site.js',) + tuple(scripts) if s != 'intro-data' or os.path.exists(os.path.join(ROOT, 'src', 'static', 'intro', 'data.js')))
    # LCP görseli için ön yükleme (ilk fetchpriority="high" görselin AVIF kaynağı)
    m = re.search(r'<picture><source type="image/avif" srcset="([^"]+)" sizes="([^"]+)">(?:(?!</picture>).)*fetchpriority="high"', body, re.S)
    if m and 'data-intro' not in body:
        head_extra += f'<link rel="preload" as="image" type="image/avif" imagesrcset="{m.group(1)}" imagesizes="{m.group(2)}" fetchpriority="high">'
    cfg = json.dumps({'lang': lang, 'wa': D.WA_NUMBER, 'consent': {'analytics': False}}, ensure_ascii=False)
    PAGES_OUT.append((path, sorted(avail, key=LANGS.index), lang))
    return f'''<!doctype html>
<html lang="{lang}" dir="{dir_}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
{'<meta name="robots" content="noindex">' if noindex else f'<link rel="canonical" href="{abs_url(lang, path)}">' + alts}
<meta name="theme-color" content="#2a2019">
<meta property="og:type" content="website"><meta property="og:site_name" content="Bey Perde"><meta property="og:locale" content="{locale}">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}">{'' if noindex else f'<meta property="og:url" content="{abs_url(lang, path)}">'}
<meta property="og:image" content="{og}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.png" type="image/png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
{font_pre}
<style>{SITE_CSS}</style>
<script>window.BP={cfg};document.documentElement.classList.add('js')</script>
{head_extra}
{''.join(ld(s) for s in (LOCALBIZ,) + tuple(schemas))}
</head>
<body class="{body_cls}">
<a class="skip" href="#icerik">{ui('skip', lang)}</a>
{header(lang, path, avail, nav)}
<main id="icerik">
{body}
</main>
{footer(lang, avail)}
<a class="wa-float" href="{e(wa_link(wa))}" target="_blank" rel="noopener" aria-label="{ui('wa_float', lang)}" data-wa-float>{ICON['wa']}<span class="wa-float-l">{ui('whatsapp_short', lang)}</span></a>
<div class="cookie" data-cookie hidden role="region" aria-label="{ui('cookies', lang)}"><p>{ui('cookie_note', lang)} <a href="/tr/cerez-politikasi"{'' if lang == 'tr' else ' hreflang="tr"'}>{ui('cookie_more', lang)}</a></p><button class="btn btn-sm" type="button" data-cookie-ok>{ui('cookie_ok', lang)}</button></div>
{js}
</body>
</html>'''


def write(lang, path, content):
    rel = (f'{lang}/index.html' if not path else f'{lang}/{path}.html') if lang else path
    out = os.path.join(PUB, rel)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w').write(content)


def sec_head(kicker, h, p='', hid='', level=2, extra=''):
    idattr = f' id="{hid}"' if hid else ''
    return f'''<div class="sec-head"><div><p class="kicker">{kicker}</p><h{level} class="h2"{idattr}>{h}</h{level}></div>{f'<div class="sec-head-p"><p class="lead">{p}</p>{extra}</div>' if p or extra else ''}</div>'''


def faq_block(items, lang):
    return '<div class="faq">' + ''.join(
        f'<details><summary><h3>{e(q)}</h3><span class="faq-i" aria-hidden="true"></span></summary><div class="faq-a"><p>{e(a)}</p></div></details>'
        for q, a in items) + '</div>'


def faq_schema(items):
    return {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in items]}


def product_imgs(slug):
    cat = D.PRODUCTS[slug][0]
    return [i for i in RAW[f'{cat}/{slug}']['tr']['imgs'] if has_img(i)]


def product_alt(slug, rel, lang):
    cat = D.PRODUCTS[slug][0]
    r = RAW[f'{cat}/{slug}'][lang]
    return r['alts'].get(rel) or tx(D.PRODUCTS[slug][1], lang)


def product_card(slug, lang, sizes='(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 20vw', heading='h3'):
    cat, name, short = D.PRODUCTS[slug]
    imgs = product_imgs(slug)
    href = url(lang, f'urunler/{cat}/{slug}')
    if imgs:
        media = f'<div class="ph">{picture(imgs[0], "", sizes)}</div>'
    else:
        media = f'<div class="ph ph-swatch" aria-hidden="true"><span>{tx(name, lang)}</span></div>'
    return f'''<article class="pcard"><a href="{href}">{media}<{heading} class="pcard-t">{tx(name, lang)}</{heading}><p>{tx(short, lang)}</p><span class="pcard-more">{ui('details', lang)}{ICON['arrow']}</span></a></article>'''


def cta_band(lang, wa_text, img='ana-sayfa', title=None, text=None):
    return f'''<section class="cta-band" aria-labelledby="cta-h">
  {picture(img, '', '100vw', 'cta-bg')}
  <div class="wrap cta-in">
    <h2 class="h2" id="cta-h">{title or ui('cta_h', lang)}</h2>
    <p>{text or ui('cta_p', lang)}</p>
    <div class="row">{btn_wa(lang, wa_text)}<a class="btn btn-ghost-light" href="{url(lang, 'iletisim')}#teklif">{ui('get_quote', lang)}</a></div>
  </div>
</section>'''


# ---------------------------------------------------------------- formlar
def product_options(lang, selected=''):
    out = [f'<option value="">{tx(P.FORM["product_any"], lang)}</option>']
    for cat, c in D.CATS.items():
        opts = ''.join(f'<option value="{s}"{" selected" if s == selected else ""}>{tx(D.PRODUCTS[s][1], lang)}</option>' for s in c['items'])
        out.append(f'<optgroup label="{tx(c["name"], lang)}">{opts}</optgroup>')
    return ''.join(out)


def quote_forms(lang, selected='', idp='q'):
    F = P.FORM
    f = lambda k: tx(F[k], lang)  # noqa: E731
    kvkk = f'<a href="/tr/kvkk" target="_blank"{"" if lang == "tr" else " hreflang=\"tr\""}>{f("consent_link")}</a>'
    consent = f('consent').format(link=kvkk)
    spaces = ''.join(f'<option>{tx(s, lang)}</option>' for s in F['spaces'])
    req = f'<span class="req" aria-hidden="true">*</span>'
    return f'''<div class="qf" data-quote>
  <div class="qf-tabs" role="tablist" aria-label="{f('k')}">
    <button type="button" role="tab" id="{idp}-tab-h" aria-controls="{idp}-hizli" aria-selected="true" data-tab>{f('tab_quick')}</button>
    <button type="button" role="tab" id="{idp}-tab-d" aria-controls="{idp}-detayli" aria-selected="false" tabindex="-1" data-tab>{f('tab_detail')}</button>
  </div>
  <div id="{idp}-hizli" role="tabpanel" aria-labelledby="{idp}-tab-h"><form class="qform" data-form="quick" novalidate>
    <div class="f2">
      <div class="field"><label for="{idp}-h-ad">{f('name')}{req}</label><input id="{idp}-h-ad" name="ad" autocomplete="name" required minlength="3" maxlength="80" data-err="{e(f('err_name'))}"><p class="ferr" id="{idp}-h-ad-e" hidden></p></div>
      <div class="field"><label for="{idp}-h-tel">{f('phone')}{req}</label><input id="{idp}-h-tel" name="tel" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20" dir="ltr" data-err="{e(f('err_phone'))}" data-phone><p class="ferr" id="{idp}-h-tel-e" hidden></p></div>
    </div>
    <div class="field"><label for="{idp}-h-urun">{f('product')}</label><select id="{idp}-h-urun" name="urun">{product_options(lang, selected)}</select></div>
    <p class="fnote">{f('quick_note')}</p>
    <div class="factions"><button class="btn btn-wa" type="submit">{ICON['wa']}<span>{f('send_quick')}</span></button></div>
    <p class="fstatus" role="status" aria-live="polite"></p>
  </form></div>
  <div id="{idp}-detayli" role="tabpanel" aria-labelledby="{idp}-tab-d" hidden><form class="qform" data-form="detail" action="/api/teklif" method="post" novalidate>
    <div class="hp" aria-hidden="true"><label for="{idp}-web">Web sitesi</label><input id="{idp}-web" name="website" tabindex="-1" autocomplete="off"></div>
    <input type="hidden" name="lang" value="{lang}"><input type="hidden" name="t" value="">
    <div class="f2">
      <div class="field"><label for="{idp}-d-ad">{f('name')}{req}</label><input id="{idp}-d-ad" name="ad" autocomplete="name" required minlength="3" maxlength="80" data-err="{e(f('err_name'))}"><p class="ferr" hidden></p></div>
      <div class="field"><label for="{idp}-d-tel">{f('phone')}{req}</label><input id="{idp}-d-tel" name="tel" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20" dir="ltr" data-err="{e(f('err_phone'))}" data-phone><p class="ferr" hidden></p></div>
    </div>
    <div class="f2">
      <div class="field"><label for="{idp}-d-mail">{f('email')} <span class="opt">({f('optional')})</span></label><input id="{idp}-d-mail" name="eposta" type="email" autocomplete="email" maxlength="120" dir="ltr" data-err="{e(f('err_email'))}"><p class="ferr" hidden></p></div>
      <div class="field"><label for="{idp}-d-mekan">{f('space')}</label><select id="{idp}-d-mekan" name="mekan">{spaces}</select></div>
    </div>
    <div class="f2">
      <div class="field"><label for="{idp}-d-urun">{f('product')}</label><select id="{idp}-d-urun" name="urun">{product_options(lang, selected)}</select></div>
      <div class="field"><label for="{idp}-d-pen">{f('windows')}</label><input id="{idp}-d-pen" name="pencere" type="number" inputmode="numeric" min="1" max="200"></div>
    </div>
    <div class="field"><label for="{idp}-d-olcu">{f('sizes')}</label><input id="{idp}-d-olcu" name="olcu" maxlength="300" placeholder="{e(f('sizes_ph'))}"></div>
    <div class="field"><label for="{idp}-d-foto">{f('photos')}</label><input id="{idp}-d-foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple data-max="4" data-err="{e(f('err_photos'))}" data-err-type="{e(f('err_photo_type'))}" aria-describedby="{idp}-d-foto-h"><p class="fhint" id="{idp}-d-foto-h">{f('photos_hint')}</p><ul class="thumbs-prev" aria-live="polite"></ul><p class="ferr" hidden></p></div>
    <div class="field"><label for="{idp}-d-not">{f('message')}</label><textarea id="{idp}-d-not" name="not" rows="4" maxlength="2000" placeholder="{e(f('message_ph'))}"></textarea></div>
    <div class="field check"><input id="{idp}-d-kvkk" name="kvkk" type="checkbox" required data-err="{e(f('err_consent'))}"><label for="{idp}-d-kvkk">{consent}</label><p class="ferr" hidden></p></div>
    <p class="fsummary" role="alert" hidden data-summary="{e(f('err_summary'))}"></p>
    <div class="factions"><button class="btn" type="submit" data-sending="{e(f('sending'))}">{f('send_detail')}</button></div>
    <div class="fstatus" role="status" aria-live="polite"></div>
  </form></div>
  <template data-msgs>{e(json.dumps({k: tx(F[k], lang) for k in ['ok_detail', 'err_unconfigured', 'err_server', 'err_network', 'to_whatsapp', 'wa_intro', 'name', 'phone', 'email', 'space', 'product', 'windows', 'sizes', 'message']}, ensure_ascii=False))}</template>
</div>'''


# ---------------------------------------------------------------- sayfalar
from pages_home import render_home          # noqa: E402
from pages_products import render_products  # noqa: E402
from pages_misc import render_misc          # noqa: E402


def copy_static():
    for sub in ('assets', 'fonts', 'js', 'intro', 'brand'):
        d = os.path.join(PUB, sub)
        if os.path.exists(d):
            shutil.rmtree(d)
    shutil.copytree(os.path.join(ROOT, 'src', 'assets'), os.path.join(PUB, 'assets'))
    shutil.copytree(os.path.join(ROOT, 'src', 'static', 'fonts'), os.path.join(PUB, 'fonts'))
    shutil.copytree(os.path.join(ROOT, 'src', 'static', 'js'), os.path.join(PUB, 'js'))
    shutil.copytree(os.path.join(ROOT, 'src', 'static', 'brand'), os.path.join(PUB, 'brand'))
    if os.path.exists(os.path.join(PUB, 'intro')):
        shutil.rmtree(os.path.join(PUB, 'intro'))
    if os.path.exists(os.path.join(ROOT, 'src', 'static', 'intro')):
        shutil.copytree(os.path.join(ROOT, 'src', 'static', 'intro'), os.path.join(PUB, 'intro'))
    for f in os.listdir(os.path.join(ROOT, 'src', 'static')):
        p = os.path.join(ROOT, 'src', 'static', f)
        if os.path.isfile(p):
            shutil.copy(p, PUB)


def sitemap():
    seen = {}
    for path, avail, lang in PAGES_OUT:
        seen[(path, lang)] = avail
    rows = []
    for (path, lang), avail in sorted(seen.items()):
        alts = ''.join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{abs_url(l, path)}"/>' for l in avail)
        if 'tr' in avail:
            alts += f'<xhtml:link rel="alternate" hreflang="x-default" href="{abs_url("tr", path)}"/>'
        rows.append(f'<url><loc>{abs_url(lang, path)}</loc>{alts}</url>')
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
           'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + '\n'.join(rows) + '\n</urlset>\n')
    open(os.path.join(PUB, 'sitemap.xml'), 'w').write(xml)
    open(os.path.join(PUB, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: {D.SITE}/sitemap.xml\n')


def main():
    # eski html'leri temizle (görseller kalır)
    for l in LANGS:
        p = os.path.join(PUB, l)
        if os.path.exists(p):
            shutil.rmtree(p)
    copy_static()
    catalog = build_catalog(IMG, RAW, PRAW)
    G = globals()
    render_home(G, catalog)
    render_products(G, catalog)
    render_misc(G, catalog)
    sitemap()
    print(f'{len(PAGES_OUT)} sayfa üretildi')


if __name__ == '__main__':
    main()
