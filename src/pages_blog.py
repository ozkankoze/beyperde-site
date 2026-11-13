# -*- coding: utf-8 -*-
"""Bey Perde Journal (/<dil>/blog): src/content/blog/*.md dosyalarından liste ve yazı sayfaları.

Yazı dosyası (ayrıntı: docs/BLOG.md):

    ---
    baslik: Tül perde seçerken dikkat edilmesi gereken 6 şey
    seo_baslik: Tül Perde Nasıl Seçilir? 6 Öneri          # isteğe bağlı; yoksa başlık kullanılır
    aciklama: Arama sonucunda görünecek özet (en fazla 155 karakter).
    kategori: perde-rehberi                               # P.JOURNAL['cats'] anahtarlarından biri
    tarih: 2026-11-13
    guncelleme: 2026-12-01                                # isteğe bağlı
    yazar: Bey Perde                                      # isteğe bağlı; gerçek kişi ya da işletme
    kapak: urunler/tul-perde-1                            # src/images içindeki görsel (uzantısız)
    urunler: tul-perde, fon-perde                         # D.PRODUCTS anahtarları, en fazla 3
    etiketler: Tül perde, Perde seçimi
    dil: tr                                               # tr | en | ar (varsayılan tr)
    ceviri: tul-perde-secimi                              # aynı yazının dil sürümlerini bağlayan ortak anahtar (isteğe bağlı)
    adres: tul-perde-secerken                             # isteğe bağlı; yoksa dosya adı
    one_cikan: evet                                       # isteğe bağlı; öne çıkan yazıyı elle seçer
    taslak: hayır                                         # "evet" ise yayınlanmaz
    ---
    Markdown metni...

Tarihi bugünden ileri olan yazılar o güne kadar yayınlanmaz. Bir yazı yalnızca yazıldığı dilde yayınlanır.
"""
import datetime
import os
import re

import markdown

BLOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'content', 'blog')
MONTHS = {
    'tr': ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    'en': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    'ar': ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
}
YES = ('evet', 'true', '1', 'yes')


def _slugify(s, sep='-'):
    tr = str.maketrans('çğıöşüÇĞİÖŞÜâîû', 'cgiosuCGIOSUaiu')
    s = s.translate(tr).lower()
    s = re.sub(r'[^\w]+', sep, s, flags=re.U)
    return s.strip(sep) or 'b'


def fmt_date(d, lang):
    if lang == 'en':
        return f'{d.day} {MONTHS["en"][d.month - 1]} {d.year}'
    if lang == 'ar':
        return f'{d.day} {MONTHS["ar"][d.month - 1]} {d.year}'
    return f'{d.day} {MONTHS["tr"][d.month - 1]} {d.year}'


def load_posts(today=None):
    """Yayında olan bütün yazılar (tüm diller), yeniden eskiye."""
    today = today or datetime.date.today()
    posts = []
    if not os.path.isdir(BLOG_DIR):
        return posts
    seen = set()
    for fn in sorted(os.listdir(BLOG_DIR)):
        if not fn.endswith('.md') or fn.startswith('_'):
            continue
        raw = open(os.path.join(BLOG_DIR, fn), encoding='utf-8').read()
        m = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', raw, re.S)
        if not m:
            raise ValueError(f'blog/{fn}: başta --- ile ayrılmış bilgi bölümü yok')
        meta = {}
        for line in m.group(1).splitlines():
            line = re.split(r'\s+#\s', line, maxsplit=1)[0].rstrip()
            if ':' in line:
                k, v = line.split(':', 1)
                meta[k.strip().lower()] = v.strip()
        for k in ('baslik', 'tarih', 'aciklama'):
            if not meta.get(k):
                raise ValueError(f'blog/{fn}: "{k}" alanı boş')
        if meta.get('taslak', '').lower() in YES:
            continue
        d = datetime.date.fromisoformat(meta['tarih'])
        if d > today:
            continue
        lang = (meta.get('dil') or 'tr').lower()
        if lang not in ('tr', 'en', 'ar'):
            raise ValueError(f'blog/{fn}: dil "{lang}" desteklenmiyor')
        slug = meta.get('adres') or _slugify(os.path.splitext(fn)[0])
        if (lang, slug) in seen:
            raise ValueError(f'blog/{fn}: "{slug}" adresi bu dilde zaten kullanılıyor')
        seen.add((lang, slug))
        posts.append({
            'slug': slug, 'lang': lang, 'title': meta['baslik'], 'seo_title': meta.get('seo_baslik') or meta['baslik'],
            'date': d, 'updated': datetime.date.fromisoformat(meta['guncelleme']) if meta.get('guncelleme') else None,
            'desc': meta['aciklama'], 'cover': meta.get('kapak') or None, 'cat': meta.get('kategori') or None,
            'author': meta.get('yazar') or 'Bey Perde', 'group': meta.get('ceviri') or None,
            'featured': meta.get('one_cikan', '').lower() in YES,
            'products': [s.strip() for s in meta.get('urunler', '').split(',') if s.strip()][:3],
            'tags': [t.strip() for t in meta.get('etiketler', '').split(',') if t.strip()],
            'md': m.group(2).strip(), 'file': fn,
        })
    posts.sort(key=lambda p: p['date'], reverse=True)
    return posts


def _minutes(p):
    return max(1, round(len(re.findall(r'\w+', p['md'], re.U)) / 200))


def render_md(G, text, title, lang):
    """Markdown -> HTML. Başlıklar kimlik ve bağlantı alır; yerel görseller duyarlı <picture> olur."""
    picture, e = G['picture'], G['e']
    J = G['P'].JOURNAL
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
        cap = (re.search(r'title="([^"]*)"', tag) or [None, ''])[1]
        return f'<figure class="jfig">{picture(key, alt, "(max-width: 900px) 100vw, 900px")}{f"<figcaption>{cap}</figcaption>" if cap else ""}</figure>'
    out = re.sub(r'<img\b[^>]*>', img, out)
    out = re.sub(r'<p>\s*(<figure class="jfig">.*?</figure>)\s*</p>', r'\1', out, flags=re.S)
    out = re.sub(r'<(/?)h1>', r'<\1h2>', out)          # sayfada tek H1 kalsın
    toc, used = [], set()

    def head(m):
        lvl, inner = m.group(1), m.group(2)
        text_ = re.sub(r'<[^>]+>', '', inner)
        hid = _slugify(text_)
        while hid in used:
            hid += '-2'
        used.add(hid)
        if lvl == '2':
            toc.append((hid, text_))
        return (f'<h{lvl} id="{hid}" class="jh{lvl}">{inner}'
                f'<a class="janchor" href="#{hid}" aria-label="{e(G["tx"](J["anchor"], lang))}: {e(text_)}">#</a></h{lvl}>')
    out = re.sub(r'<h([23])>(.*?)</h\1>', head, out, flags=re.S)
    out = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener nofollow"', out)
    return out, toc


def render_blog(G):
    D, P, e, tx, ui, url, ICON = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url'], G['ICON']
    J = P.JOURNAL
    posts_all = G.get('BLOG_POSTS') or load_posts()
    if not posts_all:
        return
    arrow = ICON['arrow']
    has = lambda key: bool(key) and G['has_img'](key)

    def cover(p, sizes, eager=False):
        if has(p['cover']):
            return G['picture'](p['cover'], p['title'], sizes, eager=eager)
        return '<span class="ph-swatch" aria-hidden="true"></span>'

    def meta_line(p, lang):
        return (f'<time datetime="{p["date"].isoformat()}">{fmt_date(p["date"], lang)}</time>'
                f'<span aria-hidden="true">·</span><span>{tx(J["min"], lang).format(n=_minutes(p))}</span>')

    def cat_name(p, lang):
        return tx(J['cats'][p['cat']], lang) if p['cat'] in J['cats'] else ''

    def post_url(p):
        return url(p['lang'], f"blog/{p['slug']}")

    def card(p, lang, hidden=False):
        cn = cat_name(p, lang)
        return f'''<li class="jcard{' is-feat' if hidden else ''}" data-cat="{p['cat'] or ''}"{' hidden' if hidden else ''}><article><a href="{post_url(p)}">
  <span class="jcard-ph">{cover(p, "(max-width: 640px) calc(100vw - 40px), (max-width: 1100px) 50vw, 400px")}</span>
  {f'<span class="jcat">{e(cn)}</span>' if cn else ''}
  <h3 class="jcard-t">{e(p['title'])}</h3><p class="jcard-d">{e(p['desc'])}</p>
  <span class="jmeta">{meta_line(p, lang)}</span>
  <span class="jread">{tx(J['read'], lang)}{arrow}</span></a></article></li>'''

    def end_band(lang):
        return f'''<section class="jend" aria-labelledby="j-end"><div class="wrap jend-in">
  <p class="kicker">{tx(J['end_k'], lang)}</p><h2 class="jh-xl" id="j-end">{tx(J['end_h'], lang)}</h2><p>{tx(J['end_p'], lang)}</p>
  <div class="row"><a class="btn" href="{url(lang, 'katalog')}"><span>{tx(J['end_b1'], lang)}</span>{arrow}</a><a class="btn btn-ghost" href="{url(lang, 'iletisim')}"><span>{tx(J['end_b2'], lang)}</span>{arrow}</a></div>
</div></section>'''

    langs_with = {p['lang'] for p in posts_all}
    list_avail = langs_with if langs_with else {'tr'}

    # ------------------------------------------------ liste sayfaları (her dil)
    for lang in G['LANGS']:
        posts = [p for p in posts_all if p['lang'] == lang]
        crumbs, cs = G['breadcrumbs'](lang, [(tx(J['crumb'], lang), 'blog')])
        head_ = f'''<section class="jhero"><div class="wrap">{crumbs}
  <p class="kicker jrise">{tx(J['kicker'], lang)}</p><h1 class="jh1 jrise">{tx(J['h1'], lang)}</h1><p class="lead jrise">{tx(J['lead'], lang)}</p></div></section>'''
        if not posts:
            tr_n = len([p for p in posts_all if p['lang'] == 'tr'])
            body = head_ + f'''<section class="jempty"><div class="wrap"><h2 class="h3">{tx(J['empty_h'], lang)}</h2><p>{tx(J['empty_p'], lang)}</p>
  {f'<a class="arrow-link" href="/tr/blog" hreflang="tr"><span>{tx(J["empty_link"], lang)} ({tr_n})</span>{arrow}</a>' if tr_n else ''}</div></section>''' + end_band(lang)
            G['write'](lang, 'blog', G['layout'](lang, 'blog', tx(J['title'], lang), tx(J['desc'], lang), body,
                                                 avail=list_avail | {lang}, nav='blog', schemas=[cs], noindex=True, body_cls='page-journal'))
            continue
        feat = next((p for p in posts if p['featured']), posts[0])
        fcn = cat_name(feat, lang)
        featured = f'''<section class="jfeat-s" aria-label="{tx(J['featured'], lang)}"><div class="wrap"><article class="jfeat"><a href="{post_url(feat)}">
  <span class="jfeat-ph">{cover(feat, "(max-width: 900px) calc(100vw - 40px), 760px", True)}</span>
  <span class="jfeat-b"><span class="jcat">{tx(J['featured'], lang)}{f' · {e(fcn)}' if fcn else ''}</span>
    <h2 class="jfeat-t">{e(feat['title'])}</h2><p class="jfeat-d">{e(feat['desc'])}</p>
    <span class="jmeta">{meta_line(feat, lang)}</span><span class="jread jread-lg">{tx(J['discover'], lang)}{arrow}</span></span></a></article></div></section>'''
        rest = [p for p in posts if p is not feat]
        cats = [c for c in J['cats'] if any(p['cat'] == c for p in posts)]
        filters = ''
        if len(posts) > 1 and cats:
            btn = lambda key, label, on: f'<li><a class="jchip" href="?kategori={key}" data-cat-btn="{key}"{" aria-current=\"true\"" if on else ""}>{label}</a></li>'
            filters = (f'<nav class="jfilter" aria-label="{tx(J["filter"], lang)}"><ul>' +
                       f'<li><a class="jchip" href="{url(lang, "blog")}" data-cat-btn="" aria-current="true">{tx(J["all"], lang)}</a></li>' +
                       ''.join(btn(c, tx(J['cats'][c], lang), False) for c in cats) + '</ul></nav>')
        grid = ''
        if rest or filters:
            grid = (f'<section class="jlist" aria-label="{tx(J["crumb"], lang)}"><div class="wrap">{filters}'
                    f'<ul class="jgrid" data-jgrid>{card(feat, lang, hidden=True)}{"".join(card(p, lang) for p in rest)}</ul></div></section>')
        more = ''
        if len(rest) < 3:   # az yazı varken sayfa boş görünmesin: sitenin gerçek bölümlerine yönlendir
            more = ('<section class="jmore-s" aria-labelledby="j-more"><div class="wrap">'
                    f'<h2 class="kicker" id="j-more">{tx(J["more_h"], lang)}</h2><ul class="jmore">' +
                    ''.join(f'<li><a href="{url(lang, p_)}"><span class="jmore-t">{tx(n, lang)}</span><span class="jmore-d">{tx(d, lang)}</span>{arrow}</a></li>' for p_, n, d in J['more']) +
                    '</ul></div></section>')
        body = head_ + featured + grid + more + end_band(lang)
        blog_ld = {'@context': 'https://schema.org', '@type': 'Blog', 'name': 'Bey Perde Journal', 'url': G['abs_url'](lang, 'blog'), 'inLanguage': lang,
                   'publisher': {'@id': D.SITE + '/#isletme'},
                   'blogPost': [{'@type': 'BlogPosting', 'headline': p['title'], 'url': G['abs_url'](lang, f"blog/{p['slug']}"),
                                 'datePublished': p['date'].isoformat(), 'dateModified': (p['updated'] or p['date']).isoformat()} for p in posts]}
        og = G['og_src'](feat['cover']) if has(feat['cover']) else None
        G['write'](lang, 'blog', G['layout'](lang, 'blog', tx(J['title'], lang), tx(J['desc'], lang), body, avail=list_avail, nav='blog',
                                             schemas=[cs, blog_ld], og_image=og, scripts=('journal.js',), body_cls='page-journal'))

    # ------------------------------------------------ yazı sayfaları
    for p in posts_all:
        lang, path = p['lang'], f"blog/{p['slug']}"
        # aynı yazının diğer dillerdeki sürümleri (yalnızca gerçekten çevrilmiş olanlar)
        sib = {o['lang']: o for o in posts_all if p['group'] and o['group'] == p['group']} or {lang: p}
        if len({o['slug'] for o in sib.values()}) > 1:
            raise ValueError(f'blog/{p["file"]}: aynı "ceviri" grubundaki yazılar aynı "adres"i kullanmalı (dil değiştirince aynı yazıya geçilsin)')
        html_body, toc = render_md(G, p['md'], p['title'], lang)
        crumbs, cs = G['breadcrumbs'](lang, [(tx(J['crumb'], lang), 'blog'), (p['title'], path)])
        cn = cat_name(p, lang)
        upd = (f'<span aria-hidden="true">·</span><span>{tx(J["updated"], lang)}: <time datetime="{p["updated"].isoformat()}">{fmt_date(p["updated"], lang)}</time></span>'
               if p['updated'] else '')
        abs_ = G['abs_url'](lang, path)
        from urllib.parse import quote
        share = (f'<div class="jshare" aria-label="{tx(J["share"], lang)}"><span class="jshare-l">{tx(J["share"], lang)}</span>'
                 f'<a class="jshare-b" href="https://wa.me/?text={quote(p["title"] + " " + abs_)}" target="_blank" rel="noopener nofollow">{ICON["wa"]}<span>{tx(J["share_wa"], lang)}</span></a>'
                 f'<button type="button" class="jshare-b" data-copy="{abs_}" data-done="{tx(J["copied"], lang)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span>{tx(J["copy"], lang)}</span></button>'
                 f'<span class="sr" role="status" data-copy-status></span></div>')
        toc_html = ''
        if len(toc) >= 4:   # yalnızca yeterince uzun yazılarda
            toc_html = (f'<nav class="jtoc" aria-labelledby="jtoc-h"><p class="kicker" id="jtoc-h">{tx(J["toc"], lang)}</p><ol>' +
                        ''.join(f'<li><a href="#{h}">{t_}</a></li>' for h, t_ in toc) + '</ol></nav>')
        hero_img = f'<figure class="jcover">{cover(p, "(max-width: 1320px) calc(100vw - 40px), 1280px", True)}</figure>' if has(p['cover']) else ''
        # ilgili ürünler: yalnızca yazıda belirtilenler
        prods = ''.join(G['product_card'](s, lang, '(max-width: 640px) calc(100vw - 40px), (max-width: 1100px) 33vw, 300px') for s in p['products'] if s in D.PRODUCTS)
        prod_sec = (f'<section class="jprod" aria-labelledby="j-prod"><div class="wrap"><h2 class="jh-l" id="j-prod">{tx(J["products_h"], lang)}</h2>'
                    f'<div class="pgrid pgrid-3">{prods}</div></div></section>') if prods else ''
        # ilgili yazılar: aynı dil; önce aynı kategori, sonra ortak etiket
        def score(o):
            return (2 if p['cat'] and o['cat'] == p['cat'] else 0) + len(set(o['tags']) & set(p['tags']))
        rel = sorted([o for o in posts_all if o['lang'] == lang and o is not p and score(o) > 0], key=lambda o: (-score(o), -o['date'].toordinal()))[:3]
        rel_sec = (f'<section class="jrel" aria-labelledby="j-rel"><div class="wrap"><h2 class="jh-l" id="j-rel">{tx(J["related_h"], lang)}</h2>'
                   f'<ul class="jgrid">{"".join(card(o, lang) for o in rel)}</ul></div></section>') if rel else ''
        body = f'''<div class="jprog" aria-hidden="true"><span data-prog></span></div>
<article class="jpost">
<header class="jpost-h"><div class="wrap jnarrow-w">{crumbs}
  {f'<p class="jcat"><a href="{url(lang, "blog")}?kategori={p["cat"]}">{e(cn)}</a></p>' if cn else ''}
  <h1 class="jh1 jh1-post">{e(p['title'])}</h1><p class="lead">{e(p['desc'])}</p>
  <p class="jmeta jmeta-post"><span>{tx(J['by'], lang)}: <strong>{e(p['author'])}</strong></span><span aria-hidden="true">·</span>{meta_line(p, lang)}{upd}</p>
</div></header>
{f'<div class="wrap">{hero_img}</div>' if hero_img else ''}
<div class="wrap jbody">
  <aside class="jside">{toc_html}{share}</aside>
  <div class="jprose">{html_body}
    <div class="jpost-end">{share.replace('class="jshare"', 'class="jshare jshare-end"').replace('data-copy-status', 'data-copy-status-2')}<a class="arrow-link" href="{url(lang, 'blog')}"><span>{tx(J['all_posts'], lang)}</span>{arrow}</a></div>
  </div>
</div>
</article>
{prod_sec}{rel_sec}{end_band(lang)}'''
        img_abs = G['og_src'](p['cover']) if has(p['cover']) else G['og_src']('ana-sayfa')
        ld = {'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': p['title'], 'description': p['desc'],
              'datePublished': p['date'].isoformat(), 'dateModified': (p['updated'] or p['date']).isoformat(),
              'inLanguage': lang, 'image': img_abs, 'mainEntityOfPage': abs_, 'wordCount': len(re.findall(r'\w+', p['md'], re.U)),
              'author': ({'@type': 'Organization', 'name': 'Bey Perde', 'url': G['abs_url'](lang, '')} if p['author'] == 'Bey Perde'
                         else {'@type': 'Person', 'name': p['author']}),
              'publisher': {'@id': D.SITE + '/#isletme'}}
        if cn:
            ld['articleSection'] = cn
        if p['tags']:
            ld['keywords'] = ', '.join(p['tags'])
        if p['products']:
            ld['mentions'] = [{'@type': 'Service', 'name': tx(D.PRODUCTS[s][1], lang), 'url': G['abs_url'](lang, f"urunler/{D.PRODUCTS[s][0]}/{s}")} for s in p['products'] if s in D.PRODUCTS]
        G['write'](lang, path, G['layout'](lang, path, next((t_ for t_ in (f"{p['seo_title']} | Bey Perde Journal", f"{p['seo_title']} | Bey Perde") if len(t_) <= 62), p['seo_title']), p['desc'], body, avail=set(sib), nav='blog',
                                           schemas=[cs, ld], og_image=img_abs if img_abs.endswith('.jpg') else None, scripts=('journal.js',), body_cls='page-journal'))
