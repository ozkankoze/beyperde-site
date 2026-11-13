# -*- coding: utf-8 -*-
"""Ürünler: genel bakış, kategori, ürün detay ve katalog sayfaları."""
import json



def fit_desc(lead, tail, limit=155):
    """Arama sonucunda kesilmesin: ek cümle sığmıyorsa yalnızca ana cümle kalır."""
    d = f'{lead} {tail}'
    if len(d) <= limit:
        return d
    if len(lead) <= limit:
        return lead
    cut = lead[:limit - 1].rsplit(' ', 1)[0].rstrip(',;:')
    return cut + '…'

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
        title = {'tr': 'Perde Seçici — Evinize En Yakışan Perdeyi Birlikte Bulalım | Bey Perde', 'en': 'Curtain Finder — Find the Curtain That Suits Your Home | Bey Perde', 'ar': 'دليل اختيار الستائر — لنجد الستارة الأنسب لبيتك | باي بردة'}[lang]
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
            title = {'tr': f'{tx(c["name"], "tr")} — Modeller, Kumaşlar ve Montaj | Bey Perde',
                     'en': f'{tx(c["name"], "en")} — Types, Fabrics and Fitting | Bey Perde',
                     'ar': f'{tx(c["name"], "ar")} — الأنواع والأقمشة والتركيب | باي بردة'}[lang]
            body = f'''<section class="page-hero"><div class="wrap ph-grid">
  <div>{crumbs}<p class="kicker">{tx(c['kicker'], lang)}</p><h1 class="h1">{tx(c['name'], lang)}</h1><p class="lead">{tx(c['short'], lang)}</p>
    <div class="row">{G['btn_wa'](lang, ui('wa_product', lang, x=tx(c['name'], lang)))}{G['arrow_link'](url(lang, 'katalog') + f'?type={",".join(c["items"])}', ui('nav_catalog', lang))}</div></div>
  <div class="ph hero-ph">{picture(c['cover'], '', '(max-width: 900px) 100vw, 45vw', eager=True)}</div>
</div></section>
<section class="band tight"><div class="wrap"><h2 class="sr">{tx(c['name'], lang)}</h2><div class="pgrid pgrid-4">{cards}</div></div></section>
{extra}
{G['cta_band'](lang, ui('wa_product', lang, x=tx(c['name'], lang)), c['cover'])}'''
            itemlist = {'@context': 'https://schema.org', '@type': 'ItemList', 'name': tx(c['name'], lang), 'itemListElement': [
                {'@type': 'ListItem', 'position': i + 1, 'url': G['abs_url'](lang, f'urunler/{ck}/{s}'), 'name': tx(D.PRODUCTS[s][1], lang)} for i, s in enumerate(c['items'])]}
            G['write'](lang, f'urunler/{ck}', G['layout'](lang, f'urunler/{ck}', title, fit_desc(tx(c['short'], lang), {'tr': 'Yerinde ölçü, atölyede dikim, 3 yıl garanti.', 'en': 'Measured on site, made in our workshop, 3-year guarantee.', 'ar': 'قياس في الموقع وتصنيع في ورشتنا وضمان ٣ سنوات.'}[lang]), body, nav='urunler',
                                                          schemas=[cs, itemlist], scripts=('quiz.js',) if ck == 'perde' else (), og_image=G['og_src'](c['cover'])))

        # ---------------- ürün detay
        for slug, (ck, name, short) in D.PRODUCTS.items():
            render_product(G, lang, slug, ck, catalog)

        # ---------------- katalog
        render_catalog(G, lang, catalog)


def render_product(G, lang, slug, ck, catalog):
    D, P, e, tx, ui, url, picture, ICON = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    r = G['RAW'][f'{ck}/{slug}'][lang]
    c = D.CATS[ck]
    name = tx(D.PRODUCTS[slug][1], lang)
    path = f'urunler/{ck}/{slug}'
    X = D.EXTRA[slug]
    imgs = G['product_imgs'](slug)
    alt = lambda i: G['product_alt'](slug, i, lang)  # noqa: E731
    wa_text = ui('wa_product', lang, x=name)
    crumbs, cs = G['breadcrumbs'](lang, [(ui('nav_catalog', lang), 'katalog'), (tx(c['name'], lang), f'urunler/{ck}'), (name, path)])

    if r.get('specs'):
        facts = '<dl class="facts facts-sm">' + ''.join(f'<div><dt>{e(a)}</dt><dd>{e(b)}</dd></div>' for a, b in r['specs']) + '</dl>'
    else:
        facts = None
    facts = facts or f'''<dl class="facts facts-sm">
  <div><dt>{ui('measure', lang)}</dt><dd>{ui('measure_v', lang)}</dd></div>
  <div><dt>{ui('delivery', lang)}</dt><dd>{ui('delivery_v', lang)}</dd></div>
  <div><dt>{ui('fitting', lang)}</dt><dd>{ui('fitting_v', lang)}</dd></div>
  <div><dt>{ui('guarantee', lang)}</dt><dd>{ui('guarantee_v', lang)}</dd></div>
</dl>'''
    info = f'''<div class="p-info">
  {crumbs}
  <p class="kicker"><a href="{url(lang, f'urunler/{ck}')}">{tx(c['name'], lang)}</a></p>
  <h1 class="h1">{e(r['h1'])}</h1>
  <p class="lead">{e(r['lead'])}</p>
  {facts}
  <div class="row">{G['btn_wa'](lang, wa_text)}<a class="btn btn-ghost" href="#teklif">{ui('quote_this', lang)}</a></div>
</div>'''
    if imgs:
        thumbs = ''.join(
            f'<button type="button" class="th" aria-pressed="{"true" if i == 0 else "false"}" data-swap-src="{G["big_src"](im)}" data-swap-alt="{e(alt(im))}" aria-label="{ui("photos", lang)} {i + 1}">{picture(im, "", "80px")}</button>'
            for i, im in enumerate(imgs)) if len(imgs) > 1 else ''
        viewer = f'''<div class="viewer" data-swap>
  <a class="ph viewer-main" href="{G['big_src'](imgs[0])}" data-lb-proxy aria-label="{ui('open_photo', lang)}">{picture(imgs[0], alt(imgs[0]), '(max-width: 960px) 100vw, 55vw', cls='swap-img', eager=True)}</a>
  {f'<div class="thumbs" role="group" aria-label="{ui("photos", lang)}">{thumbs}</div>' if thumbs else ''}
</div>'''
        hero = f'<section class="p-hero"><div class="wrap p-grid">{info}{viewer}</div></section>'
    else:
        hero = f'<section class="p-hero p-hero-solo"><div class="wrap p-grid-solo">{info}<aside class="noimg"><p>{ui("no_photos", lang)}</p></aside></div></section>'

    rooms = ''.join(f'<li><a href="{url(lang, "katalog")}?type={slug}&amp;room={k}">{tx(D.ROOMS[k], lang)}</a></li>' if any(it['slug'] == slug and k in it['room'] for it in catalog)
                    else f'<li><span>{tx(D.ROOMS[k], lang)}</span></li>' for k in X['rooms'])
    mats = ''.join(f'<li>{e(m)}</li>' for m in X['materials'][lang])
    advs = ''.join(f'<li>{ICON["check"]}<span>{e(a)}</span></li>' for a in X['adv'][lang])
    glance = f'''<section class="band tight glance" aria-labelledby="h-glance">
  <div class="wrap">
    <h2 class="kicker" id="h-glance">{ui('at_a_glance', lang)}</h2>
    <div class="glance-grid">
      <div><h3 class="h4">{ui('uses', lang)}</h3><ul class="chips">{rooms}</ul></div>
      <div><h3 class="h4">{ui('materials', lang)}</h3><ul class="dash">{mats}</ul></div>
      <div><h3 class="h4">{ui('advantages', lang)}</h3><ul class="ticks">{advs}</ul></div>
    </div>
  </div>
</section>'''

    secs = ''.join(f'<section><h3 class="h3">{e(h)}</h3><p>{e(p)}</p></section>' for h, p in r['sections'])
    toc = ''.join(f'<li><a href="#s{i}">{e(h)}</a></li>' for i, (h, _) in enumerate(r['sections']))
    secs = ''.join(f'<section id="s{i}"><h3 class="h3">{e(h)}</h3><p>{e(p)}</p></section>' for i, (h, p) in enumerate(r['sections']))
    article = f'''<section class="band linen" aria-labelledby="h-art">
  <div class="wrap art">
    <nav class="toc" aria-labelledby="h-art"><ul>{toc}</ul></nav>
    <article class="prose">
      <h2 class="h2" id="h-art">{e(r['h2'])}</h2>
      <p class="lead-ink">{e(r['intro'])}</p>
      {secs}
    </article>
  </div>
</section>'''

    gallery = ''
    if len(imgs) > 1:
        figs = ''.join(f'<figure class="gf"><a class="ph" href="{G["big_src"](im)}" data-lb="p" data-cap="{e(alt(im))}">{picture(im, alt(im), "(max-width: 640px) calc(100vw - 40px), (max-width: 1100px) 50vw, 33vw")}</a>{f"<figcaption>{e(alt(im))}</figcaption>" if r["alts"].get(im) else ""}</figure>' for im in imgs)
        gallery = f'''<section class="band tight" aria-labelledby="h-foto"><div class="wrap">{G['sec_head'](name, ui('photos', lang), '', 'h-foto', extra=G['arrow_link'](url(lang, 'katalog') + f'?type={slug}', ui('nav_catalog', lang)))}<div class="gal3">{figs}</div></div></section>'''

    faq_items = [(q, a) for q, a in r['faq']]
    faq = f'''<section class="band linen" aria-labelledby="h-sss"><div class="wrap faq-grid">
  <div><p class="kicker">{name}</p><h2 class="h2" id="h-sss">{ui('faq', lang)}</h2>
    <div class="side-links"><p class="kicker">{tx(c['name'], lang)}</p><ul class="chips">{''.join(f'<li><a href="{url(lang, f"urunler/{ck}/{s}")}"{" aria-current=\"page\"" if s == slug else ""}>{tx(D.PRODUCTS[s][1], lang)}</a></li>' for s in c['items'])}</ul></div></div>
  {G['faq_block'](faq_items, lang)}
</div></section>''' if faq_items else ''

    related = ''.join(G['product_card'](s, lang, '(max-width: 640px) 50vw, 25vw') for s in D.RELATED[slug])
    rel = f'<section class="band tight" aria-labelledby="h-rel"><div class="wrap">{G["sec_head"](ui("related", lang), ui("related_h", lang), "", "h-rel")}<div class="pgrid pgrid-4">{related}</div></div></section>'

    quote = f'''<section class="band quote-band" id="teklif" aria-labelledby="h-teklif"><div class="wrap quote-grid">
  <div class="quote-intro"><p class="kicker">{name}</p><h2 class="h2" id="h-teklif">{ui('quote_this', lang)}</h2><p class="lead">{tx(P.FORM['p'], lang)}</p>{G['btn_wa'](lang, wa_text)}</div>
  {G['quote_forms'](lang, slug, 'pq')}
</div></section>'''

    body = hero + glance + article + gallery + faq + rel + quote
    title = {'tr': f'{name} — Ölçüye Özel Dikim ve Montaj | Bey Perde',
             'en': f'{name} — Made to Measure and Fitted | Bey Perde',
             'ar': f'{name} — تفصيل حسب المقاس وتركيب | باي بردة'}[lang]
    if ck != 'perde':
        title = {'tr': f'{name} — Uygulama ve Montaj | Bey Perde', 'en': f'{name} — Supplied and Fitted | Bey Perde', 'ar': f'{name} — التوريد والتركيب | باي بردة'}[lang]
    import re as _re
    sents = [x for x in _re.split(r'(?<=[.!؟?])\s+', r['lead']) if not _re.search(r'Aşağıdaki|below|أدناه|التالية|الصور', x)]
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
    service = {'@context': 'https://schema.org', '@type': 'Service', 'name': name, 'serviceType': name, 'description': r['intro'],
               'provider': {'@id': D.SITE + '/#isletme'}, 'areaServed': [{'@type': 'Place', 'name': n} for n in ['Çekmeköy', 'Şile', 'Ağva', 'Riva', 'Beykoz', 'İstanbul']],
               'url': G['abs_url'](lang, path)}
    if imgs:
        service['image'] = [G['og_src'](i) for i in imgs[:4]]
    schemas = [cs, service] + ([G['faq_schema'](faq_items)] if faq_items else [])
    G['write'](lang, path, G['layout'](lang, path, title, desc, body, nav='urunler', schemas=schemas, scripts=('forms.js',),
                                       og_image=G['og_src'](imgs[0]) if imgs else G['og_src'](c['cover']), wa_text=wa_text))


def render_catalog(G, lang, catalog):
    D, P, e, tx, ui, url, picture, ICON = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    CP = P.PAGES['catalog']
    groups = [
        ('type', D.FILTER_LABELS['type'], [(s, D.PRODUCTS[s][1]) for s in D.PRODUCTS if any(i['slug'] == s for i in catalog)]),
        ('color', D.FILTER_LABELS['color'], [(k, v[0]) for k, v in D.COLORS.items()]),
        ('material', D.FILTER_LABELS['material'], list(D.MATERIALS.items())),
        ('room', D.FILTER_LABELS['room'], [(k, v) for k, v in D.ROOMS.items() if any(k in i['room'] for i in catalog)]),
        ('style', D.FILTER_LABELS['style'], list(D.STYLES.items())),
        ('light', D.FILTER_LABELS['light'], list(D.LIGHT.items())),
    ]
    fields = attrs_map = {'type': 'slug', 'color': 'color', 'material': 'material', 'room': 'room', 'style': 'style', 'light': 'light'}
    fs = []
    # Ürün türü: Perde Sistemleri / Duvar Kağıtları / Halılar başlıkları altında
    tparts = []
    for ck, c in D.CATS.items():
        chips = []
        for s in c['items']:
            n = sum(1 for i in catalog if i['slug'] == s)
            if n:
                chips.append(f'<label class="fchip"><input type="checkbox" name="type" value="{s}"><span>{tx(D.PRODUCTS[s][1], lang)}</span><small data-n>{n}</small></label>')
        if chips:
            tparts.append(f'<div class="fsub"><p class="fsub-h">{tx(c["name"], lang)}</p><div class="fchips">{"".join(chips)}</div></div>')
    fs.append(f'<fieldset class="fgroup"><legend>{tx(D.FILTER_LABELS["type"], lang)}</legend>{"".join(tparts)}</fieldset>')
    groups = [gr for gr in groups if gr[0] != 'type']
    for g, label, opts in groups:
        boxes = []
        for v, lbl in opts:
            n = sum(1 for i in catalog if (i['slug'] == v if g == 'type' else v in i[attrs_map[g]]))
            if not n:
                continue
            sw = f'<span class="sw" style="--sw:{D.COLORS[v][1]}"></span>' if g == 'color' else ''
            boxes.append(f'<label class="fchip"><input type="checkbox" name="{g}" value="{v}">{sw}<span>{tx(lbl, lang)}</span><small data-n>{n}</small></label>')
        fs.append(f'<fieldset class="fgroup"><legend>{tx(label, lang)}</legend><div class="fchips">{"".join(boxes)}</div></fieldset>')

    cards = []
    for it in catalog:
        name = tx(D.PRODUCTS[it['slug']][1], lang)
        desc = it['alt'][lang] or tx(D.PRODUCTS[it['slug']][2], lang)
        purl = url(lang, f'urunler/{it["cat"]}/{it["slug"]}')
        wa = ui('wa_catalog', lang, x=name, c=it['code'])
        data = ' '.join(f'data-{k}="{" ".join(it[f]) if isinstance(it[f], list) else it[f]}"' for k, f in attrs_map.items())
        cards.append(f'''<li class="ccard" {data}>
  <a class="ph" href="{G['big_src'](it['key'])}" data-lb="cat" data-cap="{e(name + ' — ' + desc)}">{picture(it['key'], desc, '(max-width: 640px) calc(50vw - 26px), (max-width: 1100px) 33vw, 22vw')}</a>
  <div class="ccard-b"><p class="kicker">{name}</p><p class="ccard-d">{e(desc)}</p><p class="ccard-code">{tx(CP['code'], lang)}: <bdi>{e(it['code'])}</bdi></p>
  <div class="ccard-a"><a class="link-sm" href="{purl}">{ui('details', lang)}</a><a class="link-sm link-wa" href="{e(G['wa_link'](wa))}" target="_blank" rel="noopener nofollow" data-wa>{ICON['wa']}<span>{tx(CP['ask'], lang)}</span></a></div></div>
</li>''')
    crumbs, cs = G['breadcrumbs'](lang, [(tx(CP['h1'], lang), 'katalog')])
    # Kategoriler: kaldırılan "Ürünler" sayfasının yerine katalogun başında kısa yol kartları
    ccards = ''.join(f'''<a class="catcard" href="{url(lang, f"urunler/{ck}")}">
  <span class="ph">{picture(c['cover'], '', '(max-width: 640px) calc(100vw - 40px), 33vw')}</span>
  <span class="catcard-b"><span class="catcard-h">{tx(c['name'], lang)}</span><span class="catcard-n">{len(c['items'])} {tx(CP['types'], lang)}</span></span>
</a>''' for ck, c in D.CATS.items())
    body = f'''<section class="page-hero"><div class="wrap">{crumbs}<h1 class="h1">{tx(CP['h1'], lang)}</h1><p class="lead">{tx(CP['lead'], lang)}</p>
  <nav class="catcards" aria-label="{tx(CP['cats'], lang)}">{ccards}</nav></div></section>
<section class="band tight"><div class="wrap"><a class="quiz-cta" href="{url(lang, 'perde-secici')}">
  <span class="quiz-cta-t"><span class="h4">{ui('quiz_cta_h', lang)}</span><span>{ui('quiz_cta_p', lang)}</span></span>
  <span class="btn">{ui('quiz_cta_btn', lang)}</span>
</a></div></section>
<section class="band tight catalog" data-catalog>
  <div class="wrap cat-layout">
    <button class="btn btn-ghost btn-sm filters-open" type="button" aria-expanded="false" aria-controls="filters" data-filters-open>{ICON['filter']}<span>{tx(CP['filters'], lang)}</span><span class="fcount" data-active-n hidden></span></button>
    <form class="filters" id="filters" aria-label="{tx(CP['filters'], lang)}" data-filters>
      <div class="filters-top"><h2 class="h4">{tx(CP['filters'], lang)}</h2><button type="button" class="icon-btn filters-close" data-filters-close>{ICON['close']}<span class="sr">{ui('close', lang)}</span></button></div>
      {''.join(fs)}
      <div class="filters-foot"><button type="reset" class="btn btn-ghost btn-sm">{tx(CP['reset'], lang)}</button><button type="button" class="btn btn-sm filters-apply" data-filters-close>{tx(CP['show'], lang)}</button></div>
    </form>
    <div class="cat-results">
      <p class="cat-count" role="status" aria-live="polite" data-count data-tpl="{e(tx(CP['count'], lang))}">{tx(CP['count'], lang).format(n=len(catalog))}</p>
      <ul class="cgrid">{''.join(cards)}</ul>
      <p class="cat-empty" hidden data-empty>{tx(CP['empty'], lang)}</p>
    </div>
  </div>
</section>
{G['cta_band'](lang, ui('wa_general', lang), 'urunler/fon-perde/zeytin-doku')}'''
    coll = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': tx(CP['h1'], lang), 'url': G['abs_url'](lang, 'katalog'),
            'description': tx(CP['desc'], lang), 'isPartOf': {'@type': 'WebSite', 'url': G['abs_url'](lang)}}
    G['write'](lang, 'katalog', G['layout'](lang, 'katalog', tx(CP['title'], lang), tx(CP['desc'], lang), body, nav='katalog',
                                            schemas=[cs, coll], scripts=('catalog.js',), og_image=G['og_src']('urunler/fon-perde/zeytin-doku')))
