# -*- coding: utf-8 -*-
"""Ürünler: genel bakış, kategori, ürün detay ve katalog sayfaları."""
import json
import re


def fit_desc(lead, tail, limit=155):
    """Arama sonucunda kesilmesin: ek cümle sığmıyorsa yalnızca ana cümle kalır."""
    d = f'{lead} {tail}'
    if len(d) <= limit:
        return d
    if len(lead) <= limit:
        return lead
    cut = lead[:limit - 1].rsplit(' ', 1)[0].rstrip(',;:')
    return cut + '…'


MOD_TXT = {
    'h': {'tr': 'Modeller', 'en': 'Models', 'ar': 'الموديلات'},
    'h_motor': {'tr': 'Tüm motorlu modeller', 'en': 'All motorised models', 'ar': 'جميع الموديلات الكهربائية'},
    'h_cat': {'tr': 'Çeşitler', 'en': 'Types', 'ar': 'الأنواع'},
    'k': {'tr': 'Seçenekler', 'en': 'Options', 'ar': 'الخيارات'},
    'more': {'tr': 'Ayrıntılar', 'en': 'Details', 'ar': 'التفاصيل'},
    'ask': {'tr': 'Bilgi al', 'en': 'Ask about it', 'ar': 'اسأل عنه'},
}


def models_section(G, lang, cards, heading, sid='modeller'):
    """Modeller / çeşitler bölümü. cards: (çapa, ad, açıklama, etiket, [(bağlantı adı, adres)] ya da None)."""
    e, ui, arrow = G['e'], G['ui'], G['ICON']['arrow']
    lis = ''
    for aid, name, desc, label, links in cards:
        if links:
            acts = ''.join(f'<a class="arrow-link" href="{h}"><span>{e(t)}</span>{arrow}</a>' for t, h in links)
        else:
            acts = G['btn_wa'](lang, ui('wa_product', lang, x=name), MOD_TXT['ask'][lang], 'arrow-link pp-mod-wa')
        lab = f'<p class="pp-mod-k">{e(label)}</p>' if label else ''
        lis += f'<li class="pp-mod-i" id="{aid}">{lab}<h3 class="pp-mod-t">{e(name)}</h3><p>{e(desc)}</p><div class="pp-mod-a">{acts}</div></li>'
    return f'''<section class="pp-sec pp-models" id="{sid}" aria-labelledby="{sid}-h"><div class="wrap">
  <div class="pp-sec-head"><div><p class="kicker">{MOD_TXT['k'][lang]}</p><h2 class="pp-h2" id="{sid}-h">{e(heading)}</h2></div></div>
  <ul class="pp-mod">{lis}</ul>
</div></section>'''

def render_products(G, catalog):
    D, P, e, tx, ui, url, picture, ICON = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    RAW = G['RAW']
    from pages_home import quiz_block

    for lang in D.LANGS:
        # /urunler genel bakış sayfası kaldırıldı; adres vercel.json'da kataloğa yönlenir.
        PP = P.PAGES['products']

        # ---------------- /perde-secici (görselli danışmanlık deneyimi; mantık D.QUIZ ile ortak)
        from pages_secici import render_secici
        body, cs = render_secici(G, lang)
        body += G['cta_band'](lang, ui('wa_general', lang), 'urunler/perde-kapak')
        title = {'tr': 'Perde Seçici — Odanıza Uygun Perdeyi Bulun | Bey Perde', 'en': 'Curtain Finder — Find the Right Curtain | Bey Perde', 'ar': 'دليل اختيار الستائر — لنجد الستارة الأنسب لبيتك | باي بردة'}[lang]
        desc = {'tr': 'Oda, ışık, stil ve renk: dört kısa adımda yaşam alanınıza en uygun perde seçeneklerini keşfedin; önerilerle WhatsApp üzerinden ücretsiz danışmanlık alın.', 'en': 'Room, light, style and colour: discover the curtains that suit your space in four short steps, then get free advice on WhatsApp.', 'ar': 'الغرفة والضوء والطراز واللون: اكتشف في أربع خطوات قصيرة الستائر الأنسب لمساحتك، واحصل على استشارة مجانية عبر واتساب.'}[lang]
        G['write'](lang, 'perde-secici', G['layout'](lang, 'perde-secici', title, desc, body, nav='perde-secici', schemas=[cs], scripts=('secici.js',), body_cls='page-secici', og_image=G['og_src']('urunler/fon-perde/salon')))

        # ---------------- kategori sayfaları
        for ck, c in D.CATS.items():
            cards = ''.join(G['product_card'](s, lang, '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw') for s in c['items'])
            crumbs, cs = G['breadcrumbs'](lang, [(ui('nav_catalog', lang), 'katalog'), (tx(c['name'], lang), f'urunler/{ck}')])
            extra = ''
            if ck == 'duvar-kagidi':
                gl = ''.join(f'<a class="gi" href="{G["big_src"](k)}" data-lb="cat">{picture(k, tx(a, lang), "(max-width: 640px) 50vw, 25vw")}</a>' for k, a in P.GALLERY[10:14])
                extra = f'<section class="band tight linen"><div class="wrap">{G["sec_head"](tx(c["kicker"], lang), ui("photos", lang))}<div class="gal-grid">{gl}</div></div></section>'
            if ck == 'perde':
                extra = quiz_block(G, lang)
            if ck in G['SUBS'].CAT_MODELS:
                cards = []
                for sid, n, d, link in G['SUBS'].CAT_MODELS[ck]:
                    if isinstance(link, str):
                        links = [(MOD_TXT['more'][lang], url(lang, f'urunler/{ck}/{link}'))]
                    elif link:
                        links = [(tx(D.PRODUCTS[s_][1], lang), url(lang, f'urunler/{ck}/{s_}')) for s_ in link]
                    else:
                        links = [(MOD_TXT['more'][lang], url(lang, sub_path(ck, None, sid)))]
                    cards.append((sid, tx(n, lang), tx(d, lang), '', links))
                extra = models_section(G, lang, cards, MOD_TXT['h_cat'][lang], 'cesitler') + extra
            grid = '' if ck == 'hali' else f'<section class="band tight"><div class="wrap"><h2 class="sr">{tx(c["name"], lang)}</h2><div class="pgrid pgrid-4">{cards}</div></div></section>'
            title = {'tr': f'{tx(c["name"], "tr")} — Modeller, Kumaşlar ve Montaj | Bey Perde',
                     'en': f'{tx(c["name"], "en")} — Types, Fabrics and Fitting | Bey Perde',
                     'ar': f'{tx(c["name"], "ar")} — الأنواع والأقمشة والتركيب | باي بردة'}[lang]
            body = f'''<section class="page-hero"><div class="wrap ph-grid">
  <div>{crumbs}<p class="kicker">{tx(c['kicker'], lang)}</p><h1 class="h1">{tx(c['name'], lang)}</h1><p class="lead">{tx(c['short'], lang)}</p>
    <div class="row">{G['btn_wa'](lang, ui('wa_product', lang, x=tx(c['name'], lang)))}{G['arrow_link'](url(lang, 'katalog') + f'?type={",".join(c["items"])}', ui('nav_catalog', lang))}</div></div>
  <div class="ph hero-ph">{picture(c['cover'], '', '(max-width: 900px) 100vw, 45vw', eager=True)}</div>
</div></section>
{grid}
{extra}
{G['cta_band'](lang, ui('wa_product', lang, x=tx(c['name'], lang)), c['cover'])}'''
            itemlist = {'@context': 'https://schema.org', '@type': 'ItemList', 'name': tx(c['name'], lang), 'itemListElement': [
                {'@type': 'ListItem', 'position': i + 1, 'url': G['abs_url'](lang, f'urunler/{ck}/{s}'), 'name': tx(D.PRODUCTS[s][1], lang)} for i, s in enumerate(c['items'])]}
            G['write'](lang, f'urunler/{ck}', G['layout'](lang, f'urunler/{ck}', title, fit_desc(tx(c['short'], lang), {'tr': 'Yerinde ölçü, atölyede dikim, 3 yıl garanti.', 'en': 'Measured on site, made in our workshop, 3-year guarantee.', 'ar': 'قياس في الموقع وتصنيع في ورشتنا وضمان ٣ سنوات.'}[lang]), body, nav='urunler',
                                                          schemas=[cs, itemlist], scripts=('quiz.js',) if ck == 'perde' else (), og_image=G['og_src'](c['cover'])))

        # ---------------- ürün detay
        for slug, (ck, name, short) in D.PRODUCTS.items():
            render_product(G, lang, slug, ck, catalog)

        # ---------------- alt kategori (model) sayfaları: her model kendi adresinde
        S = G['SUBS']
        for parent, rows in S.SUBS.items():
            for row in rows:
                if not row[3]:
                    render_sub(G, lang, D.PRODUCTS[parent][0], parent, row)
        for ck_, rows in S.CAT_MODELS.items():
            for row in rows:
                if row[3] is None:
                    render_sub(G, lang, ck_, None, row)

        # ---------------- katalog
        render_catalog(G, lang, catalog)


SUB_TXT = {
    'about': {'tr': '{x} hakkında', 'en': 'About {x}', 'ar': 'عن {x}'},
    'sib': {'tr': 'Diğer {x} modelleri', 'en': 'Other {x} models', 'ar': 'موديلات {x} الأخرى'},
    'sib_cat': {'tr': 'Diğer {x} çeşitleri', 'en': 'Other types of {x}', 'ar': 'أنواع {x} الأخرى'},
    'all': {'tr': 'Tüm {x} sayfası', 'en': 'All {x}', 'ar': 'كل {x}'},
    'motor': {'tr': 'Tüm motorlu perde modelleri', 'en': 'All motorised models', 'ar': 'جميع الموديلات الكهربائية'},
    'k': {'tr': 'Model', 'en': 'Model', 'ar': 'الموديل'},
}


def sub_path(ck, parent, sid):
    return f'urunler/{ck}/{parent}/{sid}' if parent else f'urunler/{ck}/{sid}'


def sub_href(G, lang, ck, parent, row):
    """Model satırının gideceği adres: ayrı ürün sayfası varsa o, yoksa modelin kendi sayfası."""
    sid, _n, _d, link = row
    if parent:
        return G['url'](lang, f'urunler/{ck}/{link}' if link else sub_path(ck, parent, sid))
    if isinstance(link, str):
        return G['url'](lang, f'urunler/{ck}/{link}')
    if link:
        return G['url'](lang, f'urunler/{ck}/{link[0]}')
    return G['url'](lang, sub_path(ck, None, sid))


def sub_h1(name, lang, parent):
    """Türkçe aramada kullanılan biçim: 'Blackout Stor' → 'Blackout Stor Perde'."""
    if lang == 'tr' and parent in ('stor-perde',) and 'Perde' not in name:
        return name + ' Perde'
    return name


def render_sub(G, lang, ck, parent, row):
    """Model (alt kategori) sayfası. İçerik yalnızca modelin tanımı ve üst ürünün doğrulanmış bilgilerinden kurulur."""
    D, P, e, tx, ui, url, picture, ICON = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    S, Q, arrow = G['SUBS'], P.PDP, ICON['arrow']
    q = lambda k: tx(Q[k], lang)  # noqa: E731
    sid, n, d, _lk = row
    name, desc = tx(n, lang), tx(d, lang)
    h1 = sub_h1(name, lang, parent)
    c = D.CATS[ck]
    path = sub_path(ck, parent, sid)
    if parent:
        pname = tx(D.PRODUCTS[parent][1], lang)
        r = G['RAW'][f'{ck}/{parent}'][lang]
        imgs = G['product_imgs'](parent)
        about_p, short = r['intro'], tx(D.PRODUCTS[parent][2], lang)
        adv = D.EXTRA[parent]['adv'][lang]
        trail = [(ui('nav_catalog', lang), 'katalog'), (tx(c['name'], lang), f'urunler/{ck}'), (pname, f'urunler/{ck}/{parent}'), (h1, path)]
        sibs = [x for x in S.SUBS[parent] if x[0] != sid]
        sib_h = SUB_TXT['sib'][lang].format(x=pname)
        alt = lambda i: G['product_alt'](parent, i, lang)  # noqa: E731
        form_slug, back = parent, (pname, url(lang, f'urunler/{ck}/{parent}'))
    else:
        pname = tx(c['name'], lang)
        imgs = [c['cover']]
        about_p, short, adv = tx(c['short'], lang), '', []
        trail = [(ui('nav_catalog', lang), 'katalog'), (pname, f'urunler/{ck}'), (h1, path)]
        sibs = [x for x in S.CAT_MODELS[ck] if x[0] != sid]
        sib_h = SUB_TXT['sib_cat'][lang].format(x=pname)
        alt = lambda i: ''  # noqa: E731
        form_slug, back = '', (pname, url(lang, f'urunler/{ck}'))
    crumbs, cs = G['breadcrumbs'](lang, trail)
    wa_text = ui('wa_product', lang, x=h1)

    hero_ph = (f'<figure class="pp-hero-ph">{picture(imgs[0], alt(imgs[0]), "(max-width: 900px) calc(100vw - 40px), 50vw", eager=True)}</figure>'
               if imgs else f'<aside class="pp-noimg"><p class="kicker">{q("no_img_k")}</p><p>{ui("no_photos", lang)}</p></aside>')
    hero = f'''<section class="pp-hero pp-{ck}"><div class="wrap pp-hero-g"><div class="pp-hero-t">
  {crumbs}
  <p class="kicker pp-k"><a href="{back[1]}">{e(back[0])}</a> <span aria-hidden="true">/</span> {e(name)}</p>
  <h1 class="pp-h1">{e(h1)}</h1>
  <p class="pp-tag">{e(desc)}</p>
  {f'<p class="lead">{e(short)}</p>' if short else ''}
  <div class="row pp-cta"><a class="btn" href="#teklif"><span>{q('quote')}</span>{arrow}</a>{G['btn_wa'](lang, wa_text, ui('whatsapp_short', lang), 'btn btn-ghost pp-wa')}</div>
</div>{hero_ph}</div></section>'''

    strip_items = [(ui('measure', lang), ui('measure_v', lang)), (ui('delivery', lang), ui('delivery_v', lang)),
                   (ui('fitting', lang), ui('fitting_v', lang)), (ui('guarantee', lang), ui('guarantee_v', lang))]
    strip = (f'<section class="pp-strip" aria-label="{q("benefits_h")}"><div class="wrap"><dl>' +
             ''.join(f'<div><dt>{e(a)}</dt><dd>{e(b)}</dd></div>' for a, b in strip_items) + '</dl></div></section>')

    story_img = imgs[1] if len(imgs) > 1 else None
    about = f'''<section class="pp-sec" aria-labelledby="sub-about"><div class="wrap pp-ed{' pp-ed-solo' if not story_img else ''}">
  {f'<figure class="pp-ed-ph" data-rv>{picture(story_img, alt(story_img), "(max-width: 900px) 100vw, 46vw")}</figure>' if story_img else ''}
  <div class="pp-ed-t" data-rv><p class="kicker">{e(name)}</p><h2 class="pp-h2" id="sub-about">{e(SUB_TXT['about'][lang].format(x=pname))}</h2><p class="pp-intro">{e(about_p)}</p>
    {f'<ul class="pp-adv">{"".join(f"<li>{e(a)}</li>" for a in adv)}</ul>' if adv else ''}
    <p>{G['arrow_link'](back[1], SUB_TXT['all'][lang].format(x=back[0]))}</p></div>
</div></section>'''

    chips = ''.join(f'<li><a href="{sub_href(G, lang, ck, parent, x)}">{e(tx(x[1], lang))}</a></li>' for x in sibs)
    if 'motorlu' in sid:
        chips += f'<li><a href="{url(lang, "urunler/perde/motorlu-perde")}">{SUB_TXT["motor"][lang]}</a></li>'
    sib = (f'<section class="pp-sec pp-sec-tight" aria-labelledby="sub-sib"><div class="wrap"><h2 class="pp-h3" id="sub-sib">{e(sib_h)}</h2>'
           f'<ul class="chips">{chips}</ul></div></section>') if chips else ''

    quote = f'''<section class="band quote-band" id="teklif" aria-labelledby="h-teklif"><div class="wrap quote-grid">
  <div class="quote-intro"><p class="kicker">{e(h1)}</p><h2 class="h2" id="h-teklif">{ui('quote_this', lang)}</h2><p class="lead">{tx(P.FORM['p'], lang)}</p>{G['btn_wa'](lang, wa_text)}</div>
  {G['quote_forms'](lang, form_slug, 'pq', ck)}
</div></section>'''

    body = f'<div class="pp pp-{ck} pp-subpage">' + hero + strip + about + sib + quote + '</div>'
    if ck == 'perde':
        opts = {'tr': ['Ölçüye Özel Dikim ve Montaj', 'Özel Dikim ve Montaj', 'Özel Ölçü'], 'en': ['Made to Measure and Fitted', 'Made to Measure'], 'ar': ['تفصيل حسب المقاس وتركيب', 'حسب المقاس']}[lang]
    else:
        opts = {'tr': ['Uygulama ve Montaj', 'Uygulama'], 'en': ['Supplied and Fitted', 'Fitted'], 'ar': ['التوريد والتركيب', 'التركيب']}[lang]
    brand = {'tr': 'Bey Perde', 'en': 'Bey Perde', 'ar': 'باي بردة'}[lang]
    cands = [f'{h1} — {o} | {brand}' for o in opts] + [f'{h1} | {brand}']
    title = next((t_ for t_ in cands if len(t_) <= 60), cands[-1])
    tail = ({'tr': 'Yerinde ölçü, atölyede dikim, 3 yıl garanti.', 'en': 'Measured on site, made in our workshop, 3-year guarantee.', 'ar': 'قياس في الموقع وتصنيع في ورشتنا وضمان ٣ سنوات.'}
            if ck == 'perde' else {'tr': 'Yerinde ölçü, 3 yıl garanti.', 'en': 'Measured on site, 3-year guarantee.', 'ar': 'قياس في الموقع وضمان ٣ سنوات.'})[lang]
    mdesc = fit_desc(f'{h1}: {desc}', tail)
    service = {'@context': 'https://schema.org', '@type': 'Service', 'name': h1, 'serviceType': h1, 'description': desc,
               'category': pname, 'provider': {'@id': D.SITE + '/#isletme'},
               'areaServed': [{'@type': 'Place', 'name': x} for x in ['Çekmeköy', 'Şile', 'Ağva', 'Riva', 'Beykoz', 'İstanbul']],
               'url': G['abs_url'](lang, path)}
    if imgs:
        service['image'] = [G['og_src'](i) for i in imgs[:2]]
    G['write'](lang, path, G['layout'](lang, path, title, mdesc, body, nav='urunler', schemas=[cs, service], scripts=('forms.js', 'about.js'),
                                       body_cls='page-product', og_image=G['og_src'](imgs[0]) if imgs else G['og_src'](c['cover']), wa_text=wa_text))


def render_product(G, lang, slug, ck, catalog):
    """Ortak premium ürün sayfası. Bölümler veriye göre açılır/kapanır; ürün ailesine (ck) göre vurgu değişir:
    perde → ışık ve kumaş, duvar-kagidi → doku ve yüzey, hali → malzeme ve ölçü."""
    D, P, e, tx, ui, url, picture, ICON = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    Q = P.PDP
    q = lambda k: tx(Q[k], lang)  # noqa: E731
    r = G['RAW'][f'{ck}/{slug}'][lang]
    c = D.CATS[ck]
    name = tx(D.PRODUCTS[slug][1], lang)
    path = f'urunler/{ck}/{slug}'
    X = D.EXTRA[slug]
    imgs = G['product_imgs'](slug)
    items = [it for it in catalog if it['slug'] == slug]
    alt = lambda i: G['product_alt'](slug, i, lang)  # noqa: E731
    wa_text = ui('wa_product', lang, x=name)
    arrow = ICON['arrow']
    crumbs, cs = G['breadcrumbs'](lang, [(ui('nav_catalog', lang), 'katalog'), (tx(c['name'], lang), f'urunler/{ck}'), (name, path)])
    F = Q['fam'][ck]
    sections = list(r['sections'])
    # halıda ölçü bölümü "Malzeme ve ölçü" alanında anlatılır; teknik bilgilerde tekrar edilmez
    size_i = next((i for i, (h, _b) in enumerate(sections) if ck == 'hali' and re.search(r'Ölçü|Size|Measur|مقاس', h)), None)
    size_sec = tuple(sections.pop(size_i)) if size_i is not None else None

    # fotoğrafı henüz olmayan ürünlerde h2 alanı bir yer tutucu ("Görseller hazırlanıyor."); slogan olarak intro kullanılır
    tagline, story_h, story_p = r['h2'], r['h2'], r['intro']
    if not imgs and len(r['intro']) < 80:
        tagline = story_h = r['intro']
        if sections:
            story_p = sections.pop(0)[1]
    # ---- 1. hero
    has_gal = len(imgs) > (3 if ck == 'perde' else 2)
    second = (f'<a class="arrow-link" href="#galeri"><span>{q("explore")}</span>{arrow}</a>' if has_gal
              else (f'<a class="arrow-link" href="{url(lang, "katalog")}?type={slug}"><span>{q("explore")}</span>{arrow}</a>' if items else ''))
    info = f'''<div class="pp-hero-t">
  {crumbs}
  <p class="kicker pp-k"><a href="{url(lang, f'urunler/{ck}')}">{tx(c['name'], lang)}</a> <span aria-hidden="true">/</span> {e(name)}</p>
  <h1 class="pp-h1">{e(r['h1'])}</h1>
  <p class="pp-tag">{e(tagline)}</p>
  <p class="lead">{e(r['lead'])}</p>
  <div class="row pp-cta"><a class="btn" href="#teklif"><span>{q('quote')}</span>{arrow}</a>{G['btn_wa'](lang, wa_text, ui('whatsapp_short', lang), 'btn btn-ghost pp-wa')}{second}</div>
</div>'''
    if imgs:
        hero_ph = f'<figure class="pp-hero-ph"><a href="{G["big_src"](imgs[0])}" data-lb="p" data-cap="{e(alt(imgs[0]))}" aria-label="{ui("open_photo", lang)}">{picture(imgs[0], alt(imgs[0]), "(max-width: 900px) calc(100vw - 40px), 50vw", eager=True)}</a></figure>'
    else:
        hero_ph = f'<aside class="pp-noimg"><p class="kicker">{q("no_img_k")}</p><p>{ui("no_photos", lang)}</p></aside>'
    hero = f'<section class="pp-hero pp-{ck}"><div class="wrap pp-hero-g">{info}{hero_ph}</div></section>'

    # ---- 2. hizmet şeridi (yalnızca doğrulanmış genel bilgiler ya da ürünün kendi teknik verisi)
    if r.get('specs'):
        strip_items = [(a, b) for a, b in r['specs']]
    else:
        strip_items = [(ui('measure', lang), ui('measure_v', lang)), (ui('delivery', lang), ui('delivery_v', lang)),
                       (ui('fitting', lang), ui('fitting_v', lang)), (ui('guarantee', lang), ui('guarantee_v', lang))]
    strip = (f'<section class="pp-strip" aria-label="{q("benefits_h")}"><div class="wrap"><dl>' +
             ''.join(f'<div><dt>{e(a)}</dt><dd>{e(b)}</dd></div>' for a, b in strip_items) + '</dl></div></section>')

    # ---- 3. hikâye (editoryal; görsel varsa yanında)
    story_img = imgs[1] if len(imgs) > 1 else None
    story = f'''<section class="pp-sec" aria-labelledby="pp-story"><div class="wrap pp-ed{' pp-ed-solo' if not story_img else ''}">
  {f'<figure class="pp-ed-ph" data-rv>{picture(story_img, alt(story_img), "(max-width: 900px) 100vw, 46vw")}</figure>' if story_img else ''}
  <div class="pp-ed-t" data-rv><p class="kicker">{q('story_k')}</p><h2 class="pp-h2" id="pp-story">{e(story_h)}</h2><p class="pp-intro">{e(story_p)}</p>
    <ul class="pp-adv">{''.join(f'<li>{e(a)}</li>' for a in X['adv'][lang])}</ul></div>
</div></section>'''

    # ---- 4. aile vurgusu
    mats = ''.join(f'<li>{e(m)}</li>' for m in X['materials'][lang])
    colors = []
    for it in items:
        for col in it['color']:
            if col not in colors:
                colors.append(col)
    sw = (f'<div class="pp-colors"><h3 class="pp-h4">{q("colors_h")}</h3><ul class="pp-sw">' +
          ''.join(f'<li><span class="pp-sw-c" style="--c:{D.COLORS[col][1]}" aria-hidden="true"></span>{tx(D.COLORS[col][0], lang)}</li>' for col in colors) +
          f'</ul><p class="pp-note">{q("colors_note")}</p></div>') if colors else ''
    fam = ''
    if ck == 'perde':
        lights = {l for it in items for l in it['light']}
        scale = ''
        if lights:
            scale = (f'<div class="pp-light"><h3 class="pp-h4">{q("light_scale")}</h3><ol class="pp-scale">' +
                     ''.join(f'<li{" class=\"on\"" if k in lights else ""}><span class="pp-scale-b pp-l-{k}" aria-hidden="true"></span><span>{tx(D.LIGHT[k], lang)}</span>{"<span class=\"sr\"> ✓</span>" if k in lights else ""}</li>' for k in Q['light_order']) +
                     '</ol></div>')
        fam_img = imgs[2] if len(imgs) > 2 else None
        fam = f'''<section class="pp-sec pp-fam pp-fam-perde" aria-labelledby="pp-fam"><div class="wrap pp-fam-g{' pp-fam-noimg' if not fam_img else ''}">
  <div class="pp-fam-t" data-rv><p class="kicker">{tx(F['k'], lang)}</p><h2 class="pp-h2" id="pp-fam">{tx(F['h'], lang)}</h2>{scale}
    <div><h3 class="pp-h4">{tx(F['mats'], lang)}</h3><ul class="pp-mats">{mats}</ul></div>{sw}</div>
  {f'<figure class="pp-fam-ph" data-rv>{picture(fam_img, alt(fam_img), "(max-width: 900px) 100vw, 40vw")}</figure>' if fam_img else ''}
</div></section>'''
    elif ck == 'duvar-kagidi':
        tiles = ''
        coded = [it for it in items if re.search(r'\d', it['code']) and '/' not in it['code']]
        if coded:   # desen kodu olan koleksiyon görselleri: kartela gibi
            tiles = (f'<div class="pp-patterns"><h3 class="pp-h4">{q("patterns_h")}</h3><ul class="pp-pat">' +
                     ''.join(f'<li><a href="{G["big_src"](it["key"])}" data-lb="pat" data-cap="{e(it["code"])}"><span class="pp-pat-ph">{picture(it["key"], it["code"], "(max-width: 640px) 30vw, 140px")}</span><span class="pp-pat-c">{e(it["code"])}</span></a></li>' for it in coded[:12]) +
                     '</ul></div>')
        elif imgs:   # yakın plan doku: aynı fotoğrafların büyütülmüş kesitleri
            tiles = (f'<div class="pp-patterns"><h3 class="pp-h4">{q("texture_h")}</h3><ul class="pp-tex">' +
                     ''.join(f'<li><span class="pp-tex-ph">{picture(k, alt(k), "(max-width: 640px) 45vw, 260px")}</span></li>' for k in imgs[:3]) + '</ul></div>')
        fam = f'''<section class="pp-sec pp-fam pp-fam-duvar" aria-labelledby="pp-fam"><div class="wrap">
  <div class="pp-fam-head" data-rv><p class="kicker">{tx(F['k'], lang)}</p><h2 class="pp-h2" id="pp-fam">{tx(F['h'], lang)}</h2></div>
  <div class="pp-fam-cols" data-rv><div><h3 class="pp-h4">{tx(F['mats'], lang)}</h3><ul class="pp-mats pp-mats-tex">{mats}</ul>{sw}</div>{tiles}</div>
</div></section>'''
    elif ck == 'hali':
        size_html = ''
        if size_sec:
            size_html = f'''<div class="pp-size"><h3 class="pp-h4">{q('size_h')}</h3>
      <svg class="pp-size-svg" viewBox="0 0 320 220" role="img" aria-label="{q('size_w')} × {q('size_l')}">
        <rect x="10" y="10" width="300" height="200" rx="4" fill="none" stroke="currentColor" stroke-opacity=".25"/>
        <rect x="70" y="55" width="180" height="110" rx="3" fill="currentColor" fill-opacity=".08" stroke="currentColor" stroke-opacity=".55"/>
        <line x1="70" y1="185" x2="250" y2="185" stroke="currentColor" stroke-opacity=".6"/><line x1="70" y1="180" x2="70" y2="190" stroke="currentColor"/><line x1="250" y1="180" x2="250" y2="190" stroke="currentColor"/>
        <line x1="270" y1="55" x2="270" y2="165" stroke="currentColor" stroke-opacity=".6"/><line x1="265" y1="55" x2="275" y2="55" stroke="currentColor"/><line x1="265" y1="165" x2="275" y2="165" stroke="currentColor"/>
        <text x="160" y="205" text-anchor="middle" font-size="13" fill="currentColor">{q('size_w')}</text>
        <text x="292" y="114" text-anchor="middle" font-size="13" fill="currentColor">{q('size_l')}</text>
      </svg>
      <h4 class="pp-h5">{e(size_sec[0])}</h4><p>{e(size_sec[1])}</p></div>'''
        mat_img = imgs[1] if len(imgs) > 1 else None   # hero fotoğrafı burada tekrar edilmez
        fam = f'''<section class="pp-sec pp-fam pp-fam-hali" aria-labelledby="pp-fam"><div class="wrap">
  <div class="pp-fam-head" data-rv><p class="kicker">{tx(F['k'], lang)}</p><h2 class="pp-h2" id="pp-fam">{tx(F['h'], lang)}</h2></div>
  <div class="pp-fam-cols" data-rv><div class="pp-mat-card">{f'<span class="pp-mat-ph">{picture(mat_img, alt(mat_img), "(max-width: 900px) 100vw, 40vw")}</span>' if mat_img else ''}
    <h3 class="pp-h4">{tx(F['mats'], lang)}</h3><ul class="pp-mats">{mats}</ul>{sw}</div>{size_html}</div>
</div></section>'''

    # ---- 5. galeri (görsel sayısına göre)
    gallery = ''
    used = {imgs[0]} if imgs else set()
    if story_img:
        used.add(story_img)
    if ck == 'duvar-kagidi':   # kartela gibi gösterilen desenler galeride tekrar etmez
        used |= set([it['key'] for it in items if re.search(r'\d', it['code']) and '/' not in it['code']][:12])
    if ck == 'hali' and len(imgs) > 1:
        used.add(imgs[1])
    gal_imgs = [im for im in imgs if im not in used]   # hikâye ve vurgu bölümündeki fotoğraflar galeride tekrar etmez
    if gal_imgs:
        n = len(imgs)
        shown = gal_imgs if n <= 8 else gal_imgs[:7]
        mode = 'g-few' if len(shown) <= 3 else 'g-ed'
        figs = ''.join(f'<figure class="pp-gf"><a href="{G["big_src"](im)}" data-lb="p" data-cap="{e(alt(im))}">{picture(im, alt(im), "(max-width: 640px) calc(100vw - 40px), (max-width: 1100px) 50vw, 33vw")}</a></figure>' for im in shown)
        more = (f'<a class="btn btn-ghost" href="{url(lang, "katalog")}?type={slug}"><span>{q("see_all")} ({len(items) or n})</span>{arrow}</a>' if n > 8 else '')
        gallery = f'''<section class="pp-sec pp-gal-s" id="galeri" aria-labelledby="pp-gal"><div class="wrap">
  <div class="pp-sec-head"><h2 class="pp-h2" id="pp-gal">{q('gallery_h')}</h2>{more}</div>
  <div class="pp-gal {mode}">{figs}</div>
</div></section>'''

    # ---- 6. kullanım alanları (fotoğraf yalnızca o oda için gerçek uygulama fotoğrafı varsa)
    room_cards = []
    for k in X['rooms']:
        it = next((it for it in items if k in it['room']), None)
        label = tx(D.ROOMS[k], lang)
        if it:
            room_cards.append(f'<li class="pp-room has-ph"><a href="{url(lang, "katalog")}?type={slug}&amp;room={k}"><span class="pp-room-ph">{picture(it["key"], "", "(max-width: 640px) 45vw, 240px")}</span><span class="pp-room-l">{label}</span></a></li>')
        else:
            room_cards.append(f'<li class="pp-room"><span class="pp-room-l">{label}</span></li>')
    rooms = (f'<section class="pp-sec pp-sec-tight" aria-labelledby="pp-rooms"><div class="wrap"><h2 class="pp-h3" id="pp-rooms">{q("rooms_h")}</h2>'
             f'<ul class="pp-rooms">{"".join(room_cards)}</ul></div></section>') if room_cards else ''

    # ---- 7. teknik bilgiler + SSS (akordeon; içerik HTML'de, arama motorları okur)
    acc = ''.join(f'<details class="pp-acc"><summary><span>{e(h)}</span><span class="pp-acc-i" aria-hidden="true"></span></summary><div class="pp-acc-b"><p>{e(b)}</p></div></details>' for h, b in sections)
    faq_items = [(qq, a) for qq, a in r['faq']]
    fq = lambda qq, a: f'<details class="pp-acc pp-faq"><summary><span>{e(qq)}</span><span class="pp-acc-i" aria-hidden="true"></span></summary><div class="pp-acc-b"><p>{e(a)}</p></div></details>'  # noqa: E731
    faq = ''.join(fq(qq, a) for qq, a in faq_items[:3])
    if len(faq_items) > 3:   # kalan sorular tek satırda toplanır; içerik HTML'de kalır
        more = {'tr': 'Diğer sorular', 'en': 'More questions', 'ar': 'أسئلة أخرى'}[lang]
        faq += (f'<details class="pp-acc pp-more"><summary><span>{more} ({len(faq_items) - 3})</span><span class="pp-acc-i" aria-hidden="true"></span></summary>'
                f'<div class="pp-more-b">{"".join(fq(qq, a) for qq, a in faq_items[3:])}</div></details>')
    tech_h = {'tr': 'Teknik bilgiler', 'en': 'Details', 'ar': 'التفاصيل'}[lang]
    info_sec = f'''<section class="pp-sec pp-info-s" aria-label="{q('info_h')}"><div class="wrap pp-info">
  <div><h2 class="pp-h4 pp-info-h">{tech_h}</h2><div class="pp-accs">{acc}</div></div>
  {f'<div><h2 class="pp-h4 pp-info-h">{ui("faq", lang)}</h2><div class="pp-accs">{faq}</div></div>' if faq else ''}
</div></section>'''

    # ---- 8. teklif (ürün ailesine göre alanlar)
    quote = f'''<section class="band quote-band" id="teklif" aria-labelledby="h-teklif"><div class="wrap quote-grid">
  <div class="quote-intro"><p class="kicker">{e(name)}</p><h2 class="h2" id="h-teklif">{ui('quote_this', lang)}</h2><p class="lead">{tx(P.FORM['p'], lang)}</p>{G['btn_wa'](lang, wa_text)}</div>
  {G['quote_forms'](lang, slug, 'pq', ck)}
</div></section>'''

    # ---- 9. ilgili ürünler (en fazla 3, D.RELATED sırası: kategori ve kullanım benzerliği)
    related = ''.join(G['product_card'](s_, lang, '(max-width: 640px) calc(100vw - 40px), (max-width: 1100px) 33vw, 400px') for s_ in D.RELATED[slug][:3] if s_ != slug)
    rel = f'<section class="pp-sec" aria-labelledby="pp-rel"><div class="wrap"><h2 class="pp-h2 pp-rel-h" id="pp-rel">{q("related_h")}</h2><div class="pgrid pgrid-3">{related}</div></div></section>' if related else ''

    # ---- 10. kapanış
    end_img = imgs[-1] if len(imgs) > 2 else 'ana-sayfa'   # az fotoğraflı üründe hero fotoğrafı tekrar edilmez
    end = f'''<section class="pp-end" aria-labelledby="pp-end">
  {picture(end_img, '', '100vw', 'pp-end-bg')}
  <div class="wrap pp-end-in"><p class="kicker">{q('end_k')}</p><h2 class="pp-h2" id="pp-end">{q('end_h')}</h2><p>{q('end_p')}</p>
    <div class="row"><a class="btn btn-light" href="#teklif"><span>{q('quote')}</span>{arrow}</a>{G['btn_wa'](lang, wa_text, q('end_wa'), 'btn btn-wa')}</div></div>
</section>'''

    S = G['SUBS']
    models = ''
    if slug == 'motorlu-perde':
        cards = []
        for p_, sid in S.MOTOR:
            _pp, row = S.find(sid)
            cards.append((sid, tx(row[1], lang), tx(row[2], lang), tx(D.PRODUCTS[p_][1], lang),
                          [(MOD_TXT['more'][lang], sub_href(G, lang, ck, p_, row))]))
        models = models_section(G, lang, cards, MOD_TXT['h_motor'][lang])
    elif S.SUBS.get(slug):
        cards = [(rw[0], tx(rw[1], lang), tx(rw[2], lang), '', [(MOD_TXT['more'][lang], sub_href(G, lang, ck, slug, rw))])
                 for rw in S.SUBS[slug]]
        models = models_section(G, lang, cards, MOD_TXT['h'][lang])
    if ck == 'perde':   # "Işığı nasıl karşılıyor?" bölümü sadelik için kaldırıldı
        fam = ''
    body = f'<div class="pp pp-{ck}">' + hero + strip + story + models + fam + gallery + rooms + info_sec + quote + '</div>'
    if ck == 'perde':
        opts = {'tr': ['Ölçüye Özel Dikim ve Montaj', 'Özel Dikim ve Montaj', 'Özel Ölçü'], 'en': ['Made to Measure and Fitted', 'Made to Measure'], 'ar': ['تفصيل حسب المقاس وتركيب', 'حسب المقاس']}[lang]
    else:
        opts = {'tr': ['Uygulama ve Montaj', 'Uygulama'], 'en': ['Supplied and Fitted', 'Fitted'], 'ar': ['التوريد والتركيب', 'التركيب']}[lang]
    brand = {'tr': 'Bey Perde', 'en': 'Bey Perde', 'ar': 'باي بردة'}[lang]
    cands = [f'{name} — {o} | {brand}' for o in opts] + [f'{name} | {brand}']
    title = next((t_ for t_ in cands if len(t_) <= 60), cands[-1])
    sents = [x for x in re.split(r'(?<=[.!؟?])\s+', r['lead']) if not re.search(r'Aşağıdaki|below|أدناه|التالية|الصور', x)]
    lead_s = ''
    for x in sents:
        if len(lead_s) + len(x) > 125 and lead_s:
            break
        lead_s = (lead_s + ' ' + x).strip()
    short_d = tx(D.PRODUCTS[slug][2], lang)
    if len(lead_s) > 140:
        lead_s = short_d
    elif len(lead_s) < 70 and short_d not in lead_s:
        lead_s = (lead_s + ' ' + short_d) if len(lead_s + short_d) < 140 else lead_s
    desc = fit_desc(lead_s, {'tr': 'Yerinde ölçü, 3 yıl garanti.', 'en': 'Measured on site, 3-year guarantee.', 'ar': 'قياس في الموقع وضمان ٣ سنوات.'}[lang])
    if len(desc) < 110:   # kısa kalan açıklamayı ürünün kendi tanıtım cümlesiyle tamamla (yeni bilgi eklenmez)
        pool = re.split(r'(?<=[.!؟?])\s+', r['intro']) + [re.split(r'(?<=[.!؟?])\s+', b_)[0] for _h, b_ in r['sections']]
        for x in [y.strip() for y in pool if re.search(r'[.!؟?]$', y.strip())]:
            cand = fit_desc(lead_s + ' ' + x, {'tr': 'Yerinde ölçü, 3 yıl garanti.', 'en': 'Measured on site, 3-year guarantee.', 'ar': 'قياس في الموقع وضمان ٣ سنوات.'}[lang])
            if len(cand) <= 158 and not cand.endswith('…') and len(x) > 20 and x not in lead_s:
                desc = cand
                break
    service = {'@context': 'https://schema.org', '@type': 'Service', 'name': name, 'serviceType': name, 'description': r['intro'],
               'category': tx(c['name'], lang),
               'provider': {'@id': D.SITE + '/#isletme'}, 'areaServed': [{'@type': 'Place', 'name': n} for n in ['Çekmeköy', 'Şile', 'Ağva', 'Riva', 'Beykoz', 'İstanbul']],
               'url': G['abs_url'](lang, path)}
    if imgs:
        service['image'] = [G['og_src'](i) for i in imgs[:4]]
    schemas = [cs, service] + ([G['faq_schema'](faq_items)] if faq_items else [])
    G['write'](lang, path, G['layout'](lang, path, title, desc, body, nav='urunler', schemas=schemas, scripts=('forms.js', 'about.js'),
                                       body_cls='page-product', og_image=G['og_src'](imgs[0]) if imgs else G['og_src'](c['cover']), wa_text=wa_text))


def render_catalog(G, lang, catalog):
    D, P, e, tx, ui, url, picture, ICON = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    CP = P.PAGES['catalog']
    # Sade katalog: yalnızca fotoğraflar; dokununca büyür (lightbox)
    cards = []
    for it in catalog:
        name = tx(D.PRODUCTS[it['slug']][1], lang)
        desc = it['alt'][lang] or tx(D.PRODUCTS[it['slug']][2], lang)
        cards.append(f'''<li class="ccard">
  <a class="ph" href="{G['big_src'](it['key'])}" data-lb="cat" data-cap="{e(name + ' — ' + desc)}">{picture(it['key'], desc, '(max-width: 640px) calc(50vw - 26px), (max-width: 1100px) 33vw, 25vw')}</a>
</li>''')
    crumbs, cs = G['breadcrumbs'](lang, [(tx(CP['h1'], lang), 'katalog')])
    # Kategoriler: kaldırılan "Ürünler" sayfasının yerine katalogun başında kısa yol kartları
    ccards = ''.join(f'''<a class="catcard" href="{url(lang, f"urunler/{ck}")}">
  <span class="ph">{picture(c['cover'], '', '(max-width: 640px) calc(100vw - 40px), 33vw')}</span>
  <span class="catcard-b"><span class="catcard-h">{tx(c['name'], lang)}</span><span class="catcard-n">{len(c['items'])} {tx(CP['types'], lang)}</span></span>
</a>''' for ck, c in D.CATS.items())
    body = f'''<section class="page-hero"><div class="wrap">{crumbs}<h1 class="h1">{tx(CP['h1'], lang)}</h1><p class="lead">{tx(CP['lead'], lang)}</p>
  <nav class="catcards" aria-label="{tx(CP['cats'], lang)}">{ccards}</nav></div></section>
<section class="band tight quiz-band"><div class="wrap"><a class="quiz-cta" href="{url(lang, 'perde-secici')}">
  <span class="quiz-cta-t"><span class="h4">{ui('quiz_cta_h', lang)}</span><span>{ui('quiz_cta_p', lang)}</span></span>
  <span class="btn">{ui('quiz_cta_btn', lang)}</span>
</a></div></section>
<section class="band tight catalog">
  <div class="wrap"><ul class="cgrid">{''.join(cards)}</ul></div>
</section>
{G['cta_band'](lang, ui('wa_general', lang), 'urunler/fon-perde/zeytin-doku')}'''
    coll = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': tx(CP['h1'], lang), 'url': G['abs_url'](lang, 'katalog'),
            'description': tx(CP['desc'], lang), 'isPartOf': {'@type': 'WebSite', 'url': G['abs_url'](lang)}}
    G['write'](lang, 'katalog', G['layout'](lang, 'katalog', tx(CP['title'], lang), tx(CP['desc'], lang), body, nav='katalog',
                                            schemas=[cs, coll], og_image=G['og_src']('urunler/fon-perde/zeytin-doku')))
