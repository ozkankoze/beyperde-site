# -*- coding: utf-8 -*-
"""Blog (/tr/blog): src/content/blog/*.md dosyalarından liste ve yazı sayfaları üretir.

Yazı dosyası biçimi (ayrıntı: docs/BLOG.md):

    ---
    baslik: Tül perde nasıl seçilir?
    tarih: 2026-11-13
    aciklama: Arama sonucunda görünecek kısa özet (en fazla 155 karakter).
    kapak: urunler/tul-perde-1          # src/images içindeki görselin yolu (uzantısız)
    etiketler: Tül, Perde seçimi
    taslak: hayır                       # "evet" ise yayınlanmaz
    ---
    Markdown metni...

Tarihi bugünden ileri olan yazılar o güne kadar yayınlanmaz.
"""
import datetime
import os
import re

import markdown

BLOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'content', 'blog')
AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']


def _slugify(s):
    tr = str.maketrans('çğıöşüÇĞİÖŞÜâîû', 'cgiosuCGIOSUaiu')
    s = s.translate(tr).lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def tr_date(d):
    return f'{d.day} {AYLAR[d.month - 1]} {d.year}'


def load_posts(today=None):
    today = today or datetime.date.today()
    posts = []
    if not os.path.isdir(BLOG_DIR):
        return posts
    for fn in sorted(os.listdir(BLOG_DIR)):
        if not fn.endswith('.md') or fn.startswith('_'):
            continue
        raw = open(os.path.join(BLOG_DIR, fn), encoding='utf-8').read()
        m = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', raw, re.S)
        if not m:
            raise ValueError(f'blog/{fn}: başta --- ile ayrılmış bilgi bölümü yok')
        meta = {}
        for line in m.group(1).splitlines():
            line = line.split(' #')[0].rstrip()
            if ':' in line:
                k, v = line.split(':', 1)
                meta[k.strip().lower()] = v.strip()
        for k in ('baslik', 'tarih', 'aciklama'):
            if not meta.get(k):
                raise ValueError(f'blog/{fn}: "{k}" alanı boş')
        if meta.get('taslak', '').lower() in ('evet', 'true', '1', 'yes'):
            continue
        d = datetime.date.fromisoformat(meta['tarih'])
        if d > today:
            continue
        guncel = datetime.date.fromisoformat(meta['guncelleme']) if meta.get('guncelleme') else None
        posts.append({
            'slug': meta.get('adres') or _slugify(os.path.splitext(fn)[0]),
            'title': meta['baslik'], 'date': d, 'updated': guncel, 'desc': meta['aciklama'],
            'cover': meta.get('kapak') or None,
            'tags': [t.strip() for t in meta.get('etiketler', '').split(',') if t.strip()],
            'md': m.group(2).strip(), 'file': fn,
        })
    posts.sort(key=lambda p: p['date'], reverse=True)
    return posts


def render_md(G, text, title):
    """Markdown -> HTML. Yerel görseller (![açıklama](blog/yazi/foto)) duyarlı <picture> olarak basılır."""
    picture, e = G['picture'], G['e']
    out = markdown.markdown(text, extensions=['extra', 'sane_lists', 'smarty'], output_format='html')

    def img(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag).group(1)
        alt = (re.search(r'alt="([^"]*)"', tag) or [None, ''])[1] or title
        if re.match(r'https?://', src):
            return f'<img src="{src}" alt="{alt}" loading="lazy" decoding="async">'
        key = G['img_key'](src)
        if not G['has_img'](key):
            raise ValueError(f'blog görseli bulunamadı: {src} (önce src/images içine koyup tools/images.py çalıştırın)')
        return f'<figure class="bfig">{picture(key, alt, "(max-width: 900px) 100vw, 820px")}</figure>'
    out = re.sub(r'<img\b[^>]*>', img, out)
    # tek başına paragraf içindeki figür → doğrudan figür
    out = re.sub(r'<p>\s*(<figure class="bfig">.*?</figure>)\s*</p>', r'\1', out, flags=re.S)
    # başlık düzeyleri: yazıdaki # → h2 (sayfada tek h1 kalsın)
    out = re.sub(r'<(/?)h1>', r'<\1h2>', out)
    out = re.sub(r'<h([23])>', lambda m: f'<h{m.group(1)} class="h3">', out)
    # dış bağlantılar yeni sekmede
    out = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener nofollow"', out)
    return out


def render_blog(G):
    D, e, ui, url, ICON = G['D'], G['e'], G['ui'], G['url'], G['ICON']
    lang = 'tr'
    posts = load_posts()
    G['BLOG_POSTS'] = posts
    if not posts:
        return
    B = {'title': 'Blog — Perde, Duvar Kağıdı ve Dekorasyon Rehberi | Bey Perde',
         'desc': 'Perde seçimi, ölçü, bakım ve dekorasyon üzerine Bey Perde atölyesinden yazılar ve öneriler.',
         'h1': 'Blog', 'lead': 'Perde, duvar kağıdı ve halı seçerken işinize yarayacak notlar; atölyemizden ve uygulamalarımızdan.'}

    def cover(p, sizes, eager=False):
        if p['cover'] and G['has_img'](p['cover']):
            return G['picture'](p['cover'], p['title'], sizes, eager=eager)
        return '<span class="ph-swatch" aria-hidden="true"></span>'

    def minutes(p):
        return max(1, round(len(re.findall(r'\w+', p['md'])) / 200))

    # liste
    cards = ''.join(f'''<li><article class="bcard"><a href="{url(lang, f"blog/{p['slug']}")}">
  <span class="ph">{cover(p, "(max-width: 640px) calc(100vw - 40px), (max-width: 1100px) 50vw, 33vw", i == 0)}</span>
  <span class="bcard-m"><time datetime="{p['date'].isoformat()}">{tr_date(p['date'])}</time> · {minutes(p)} dk okuma</span>
  <h2 class="h3 bcard-t">{e(p['title'])}</h2><p>{e(p['desc'])}</p><span class="pcard-more">Yazıyı oku{ICON['arrow']}</span></a></article></li>''' for i, p in enumerate(posts))
    crumbs, cs = G['breadcrumbs'](lang, [(B['h1'], 'blog')])
    body = f'''<section class="page-hero"><div class="wrap">{crumbs}<h1 class="h1">{B['h1']}</h1><p class="lead">{B['lead']}</p></div></section>
<section class="band tight"><div class="wrap"><ul class="bgrid">{cards}</ul></div></section>
{G['cta_band'](lang, ui('wa_general', lang))}'''
    blog_ld = {'@context': 'https://schema.org', '@type': 'Blog', 'name': 'Bey Perde Blog', 'url': G['abs_url'](lang, 'blog'), 'inLanguage': 'tr',
               'publisher': {'@id': D.SITE + '/#isletme'},
               'blogPost': [{'@type': 'BlogPosting', 'headline': p['title'], 'url': G['abs_url'](lang, f"blog/{p['slug']}"), 'datePublished': p['date'].isoformat()} for p in posts]}
    og = G['og_src'](posts[0]['cover']) if posts[0]['cover'] and G['has_img'](posts[0]['cover']) else None
    G['write'](lang, 'blog', G['layout'](lang, 'blog', B['title'], B['desc'], body, avail={'tr'}, nav='blog', schemas=[cs, blog_ld], og_image=og))

    # yazılar
    for i, p in enumerate(posts):
        path = f"blog/{p['slug']}"
        html_body = render_md(G, p['md'], p['title'])
        crumbs, cs = G['breadcrumbs'](lang, [(B['h1'], 'blog'), (p['title'], path)])
        tags = ''.join(f'<li><span>{e(t)}</span></li>' for t in p['tags'])
        others = [o for o in posts if o is not p][:3]
        more = ''.join(f'<li><a href="{url(lang, f"blog/{o['slug']}")}"><span class="bcard-m">{tr_date(o["date"])}</span><span class="h3">{e(o["title"])}</span></a></li>' for o in others)
        hero_img = f'<div class="bhero-ph">{cover(p, "(max-width: 900px) 100vw, 900px", True)}</div>' if p['cover'] and G['has_img'](p['cover']) else ''
        upd = f' · Güncellendi: <time datetime="{p["updated"].isoformat()}">{tr_date(p["updated"])}</time>' if p['updated'] else ''
        body = f'''<section class="page-hero bhero"><div class="wrap bwrap">{crumbs}
  <p class="bcard-m"><time datetime="{p['date'].isoformat()}">{tr_date(p['date'])}</time> · {minutes(p)} dk okuma{upd}</p>
  <h1 class="h1 bh1">{e(p['title'])}</h1><p class="lead">{e(p['desc'])}</p>{f'<ul class="chips">{tags}</ul>' if tags else ''}</div></section>
{f'<div class="wrap bwrap">{hero_img}</div>' if hero_img else ''}
<section class="band tight"><div class="wrap bwrap"><article class="prose bprose">{html_body}</article>
  <div class="bnext"><a class="arrow-link" href="{url(lang, 'blog')}"><span>Tüm yazılar</span>{ICON['arrow']}</a></div></div></section>
{f'<section class="band linen tight" aria-labelledby="h-more"><div class="wrap"><h2 class="h2" id="h-more">Diğer yazılar</h2><ul class="bmore">{more}</ul></div></section>' if more else ''}
{G['cta_band'](lang, ui('wa_general', lang))}'''
        img_abs = G['og_src'](p['cover']) if p['cover'] and G['has_img'](p['cover']) else G['og_src']('ana-sayfa')
        ld = {'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': p['title'], 'description': p['desc'],
              'datePublished': p['date'].isoformat(), 'dateModified': (p['updated'] or p['date']).isoformat(),
              'inLanguage': 'tr', 'image': img_abs, 'mainEntityOfPage': G['abs_url'](lang, path),
              'author': {'@type': 'Organization', 'name': 'Bey Perde', 'url': G['abs_url'](lang, '')},
              'publisher': {'@id': D.SITE + '/#isletme'}}
        if p['tags']:
            ld['keywords'] = ', '.join(p['tags'])
        G['write'](lang, path, G['layout'](lang, path, f"{p['title']} | Bey Perde Blog", p['desc'], body, avail={'tr'}, nav='blog',
                                           schemas=[cs, ld], og_image=img_abs if img_abs.endswith('.jpg') else None))
