# -*- coding: utf-8 -*-
"""Projeler, galeri, hakkımızda, iletişim, hizmet bölgeleri, yasal sayfalar ve 404."""

PROJECT_PRODUCTS = {'erenkoy-hk-evi': ['tul-perde', 'fon-perde', 'jaluzi-perde']}


def render_misc(G, catalog):
    D, P, L, e, tx, ui, url, picture, ICON = G['D'], G['P'], G['LOC'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    PR = G['PRAW']
    from pages_home import compare_block

    for lang in D.LANGS:
        ep = PR[lang]
        PP = P.PAGES['projects']
        # ---------------- /projeler  (yalnızca fotoğrafı olan projeler gösterilir)
        prods = ''.join(f'<li><a href="{url(lang, f"urunler/{D.PRODUCTS[s][0]}/{s}")}">{tx(D.PRODUCTS[s][1], lang)}</a></li>' for s in PROJECT_PRODUCTS['erenkoy-hk-evi'])
        loc = next((b for a, b in ep['meta'] if b and ('Kadık' in b or 'Kadık' in b or 'قاضي' in b or 'Erenk' in b)), ep['meta'][0][1])
        card = f'''<article class="pj-card">
  <a class="ph" href="{url(lang, 'projeler/erenkoy-hk-evi')}" tabindex="-1" aria-hidden="true">{picture('projeler/erenkoy-hk-evi/pencere', '', '(max-width: 900px) 100vw, 50vw', eager=True)}</a>
  <div class="pj-card-b">
    <dl class="meta"><div><dt>{tx(PP['location'], lang)}</dt><dd>{e(loc)}</dd></div><div><dt>{tx(PP['year'], lang)}</dt><dd>{e(ep['meta'][1][1])}</dd></div></dl>
    <h2 class="h2"><a href="{url(lang, 'projeler/erenkoy-hk-evi')}">{e(ep['h1'])}</a></h2>
    <p>{e(ep['lead'])}</p>
    <p class="kicker">{tx(PP['work'], lang)}</p><ul class="chips">{prods}</ul>
    {G['arrow_link'](url(lang, 'projeler/erenkoy-hk-evi'), tx(P.HOME['project_cta'], lang))}
  </div>
</article>'''
        crumbs, cs = G['breadcrumbs'](lang, [(tx(PP['h1'], lang), 'projeler')])
        body = f'''<section class="page-hero"><div class="wrap">{crumbs}<h1 class="h1">{tx(PP['h1'], lang)}</h1><p class="lead">{tx(PP['lead'], lang)}</p></div></section>
<section class="band tight"><div class="wrap">{card}{compare_block(G, lang, G['COMPARE'])}<p class="note">{tx(PP['more'], lang)}</p></div></section>
{G['cta_band'](lang, ui('wa_general', lang), 'projeler/erenkoy-hk-evi/doku')}'''
        G['write'](lang, 'projeler', G['layout'](lang, 'projeler', tx(PP['title'], lang), tx(PP['lead'], lang), body, nav='projeler', schemas=[cs],
                                                 scripts=('compare.js',) if G['COMPARE'] else (), og_image=G['og_src']('projeler/erenkoy-hk-evi/pencere')))

        # ---------------- proje detay
        path = 'projeler/erenkoy-hk-evi'
        crumbs, cs = G['breadcrumbs'](lang, [(tx(PP['h1'], lang), 'projeler'), (ep['h1'], path)])
        groups = []
        for gi, g in enumerate(ep['groups']):
            figs = ''.join(f'<figure class="pf pf{i % 4}"><a class="ph" href="{G["big_src"](it["src"])}" data-lb="pj" data-cap="{e(it.get("cap", ""))}">{picture(it["src"], it["alt"], "(max-width: 900px) 100vw, 50vw")}</a><figcaption>{e(it.get("cap", ""))}</figcaption></figure>' for i, it in enumerate(g['items']))
            sec = ep['sections'][gi] if gi < len(ep['sections']) else None
            groups.append(f'''<section class="band {'linen' if gi % 2 == 0 else ''}" aria-labelledby="pg{gi}">
  <div class="wrap">
    <div class="two"><div><p class="kicker">0{gi + 1}</p><h2 class="h2" id="pg{gi}">{e(g['h'])}</h2></div><div class="prose"><p>{e(sec[1]) if sec else ''}</p></div></div>
    <div class="pgal">{figs}</div>
  </div>
</section>''')
        detail = ep['sections'][-1]
        wa_text = ui('wa_project', lang, x=ep['h1'])
        body = f'''<section class="pj-hero">
  {picture('projeler/erenkoy-hk-evi/pencere', ep['hero_alt'], '100vw', eager=True)}
  <div class="wrap pj-hero-in">
    {crumbs}
    <h1 class="h1">{e(ep['h1'])}</h1>
    <p class="lead">{e(ep['lead'])}</p>
    <dl class="meta meta-light"><div><dt>{tx(PP['location'], lang)}</dt><dd>{e(loc)}</dd></div><div><dt>{tx(PP['year'], lang)}</dt><dd>{e(ep['meta'][1][1])}</dd></div><div><dt>{tx(PP['work'], lang)}</dt><dd><ul class="chips chips-light">{prods}</ul></dd></div></dl>
  </div>
</section>
<section class="band"><div class="wrap two">
  <div><h2 class="h2">{e(ep['h2'])}</h2>
    <div class="palette" role="img" aria-label="{tx(PP['palette'], lang)}: {e(ep['h2'])}"><span style="background:#d9cfbf"></span><span style="background:#8a6a50"></span><span style="background:#3e2c20"></span></div></div>
  <div class="prose"><p class="lead-ink">{e(ep['intro'])}</p></div>
</div></section>
{''.join(groups)}
<section class="band dark tight"><div class="wrap two"><div><h2 class="h2">{e(detail[0])}</h2></div><div><p class="lead">{e(detail[1])}</p><div class="row">{G['btn_wa'](lang, wa_text)}<a class="btn btn-ghost-light" href="{url(lang, 'iletisim')}#teklif">{ui('get_quote', lang)}</a></div></div></div></section>
{compare_block(G, lang, [c for c in G['COMPARE'] if c.get('project') == 'erenkoy-hk-evi'])}'''
        cw = {'@context': 'https://schema.org', '@type': 'CreativeWork', 'name': ep['h1'], 'description': ep['lead'], 'creator': {'@id': D.SITE + '/#isletme'},
              'dateCreated': '2026', 'locationCreated': {'@type': 'Place', 'name': 'Erenköy, Kadıköy, İstanbul'},
              'image': [G['og_src'](it['src']) for g in ep['groups'] for it in g['items']][:6]}
        G['write'](lang, path, G['layout'](lang, path, {'tr': f'{ep["h1"]} — Tül, Fon ve Jaluzi Uygulaması | Bey Perde', 'en': f'{ep["h1"]} — Sheers, Drapes and Venetian Blinds | Bey Perde', 'ar': f'{ep["h1"]} — تول وستائر وجالوزي | باي بردة'}[lang],
                                           {'tr': ep['lead'], 'en': 'A house in Erenköy, Kadıköy: floor-to-ceiling linen-textured sheers, earth-toned drapes and wooden Venetian blinds.', 'ar': ep['lead']}[lang], body, nav='projeler', schemas=[cs, cw], wa_text=wa_text, body_cls='has-hero',
                                           og_image=G['og_src']('projeler/erenkoy-hk-evi/pencere')))

        # ---------------- galeri
        GP = P.PAGES['gallery']
        gal = ''.join(f'<a class="gi" href="{G["big_src"](k)}" data-lb="g" data-cap="{e(tx(a, lang))}">{picture(k, tx(a, lang), "(max-width: 640px) 50vw, 25vw")}</a>' for k, a in P.GALLERY)
        crumbs, cs = G['breadcrumbs'](lang, [(tx(GP['h1'], lang), 'galeri')])
        body = f'''<section class="page-hero"><div class="wrap">{crumbs}<h1 class="h1">{tx(GP['h1'], lang)}</h1><p class="lead">{tx(GP['lead'], lang)}</p></div></section>
<section class="band tight"><div class="wrap"><h2 class="sr">{ui('photos', lang)}</h2><div class="masonry">{gal}</div>
<p class="center"><a class="btn btn-ghost" href="{D.INSTAGRAM}" target="_blank" rel="noopener">{ICON['insta']}<span>{tx(GP['insta'], lang)}</span></a></p></div></section>
{G['cta_band'](lang, ui('wa_general', lang), 'galeri/1')}'''
        G['write'](lang, 'galeri', G['layout'](lang, 'galeri', tx(GP['title'], lang), tx(GP['desc'], lang), body, nav='galeri', schemas=[cs], og_image=G['og_src']('galeri/1')))

        # ---------------- hakkımızda
        render_about(G, lang)
        # ---------------- iletişim
        render_contact(G, lang)

    render_regions(G)
    render_legal(G)
    render_404(G)


def render_about(G, lang):
    D, P, e, tx, ui, url, picture, ICON = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    A = [x for x in G['PRAW'][lang]['about'] if x[0] != 'img']
    h1, intro = A[0][1], A[1][1]
    q1, q2 = A[2][1], A[3][1]
    # bölümleri başlıklara göre ayır
    secs, cur = [], None
    for x in A[4:]:
        if x[0] == 'h2':
            cur = {'h': x[1], 'items': []}
            secs.append(cur)
        elif cur is not None:
            cur['items'].append(x)
    by = {i: s for i, s in enumerate(secs)}
    stats = ''.join(f'<div><dt>{tx(a, lang)}</dt><dd>{tx(b, lang)}{f"<small>{tx(c, lang)}</small>" if c else ""}</dd></div>' for a, b, c in P.HOME['stats'])
    wwf = by[1]
    wwf_p = next(x[1] for x in wwf['items'] if x[0] == 'p')
    steps = ''.join(f'<li><span class="n">0{i + 1}</span><h3 class="h4">{tx(t, lang)}</h3><p>{tx(d, lang)}</p></li>' for i, (t, d) in enumerate(P.STEPS))
    how = by[2]
    bq = next((x[1] for x in how['items'] if x[0] == 'blockquote'), '')
    villa = by[3]
    villa_p = [x[1] for x in villa['items'] if x[0] == 'p']
    cats = ''.join(f'<li><a href="{url(lang, f"urunler/{ck}")}"><span class="kicker">{tx(c["kicker"], lang)}</span><span class="h4">{tx(c["name"], lang)}</span></a></li>' for ck, c in D.CATS.items())
    crumbs, cs = G['breadcrumbs'](lang, [(h1, 'hakkimizda')])
    body = f'''<section class="page-hero"><div class="wrap ph-grid">
  <div>{crumbs}<h1 class="h1">{e(h1)}</h1><p class="lead">{e(intro)}</p></div>
  <figure class="hero-ph"><div class="ph">{picture('hakkimizda/isik', tx(P.HOME['brand_img_alt'], lang), '(max-width: 900px) 100vw, 45vw', eager=True)}</div></figure>
</div></section>
<section class="band dark tight"><div class="wrap"><blockquote class="big-quote"><p>{e(q1)}</p><p>{e(q2)}</p></blockquote></div></section>
<section class="band"><div class="wrap"><h2 class="kicker">{e(secs[0]['h'])}</h2><dl class="stats">{stats}</dl></div></section>
<section class="band linen"><div class="wrap two"><div><h2 class="h2">{e(wwf['h'])}</h2></div><div class="prose"><p>{e(wwf_p)}</p><ul class="cat-links">{cats}</ul></div></div></section>
<section class="band" aria-labelledby="h-how"><div class="wrap">{G['sec_head'](tx(P.HOME['trust_k'], lang), e(how['h']), tx(P.HOME['trust_p'], lang), 'h-how')}<ol class="steps">{steps}</ol>
  <blockquote class="pull-quote">{e(bq)}</blockquote></div></section>
<section class="band linen"><div class="wrap two"><div><h2 class="h2">{e(villa['h'])}</h2></div><div class="prose"><p>{e(villa_p[0])}</p><p class="kicker mt">{e(villa_p[1])}</p><p>{e(villa_p[2])}</p></div></div></section>
<section class="band tight"><div class="wrap two"><div><h2 class="h2">{ui('areas', lang)}</h2></div><div><p class="lead">{tx(P.HOME['areas_p'], lang)}</p><ul class="chips">{''.join(f'<li><a href="/tr/hizmet-bolgeleri/{k}"{"" if lang == "tr" else " hreflang=\"tr\""}>{tx(P.AREA_NAMES[k], lang)}</a></li>' for k, _ in P.AREAS)}</ul>
  <div class="row mt">{G['arrow_link'](url(lang, 'projeler'), ui('nav_projects', lang))}<a class="arrow-link" href="{D.INSTAGRAM}" target="_blank" rel="noopener"><span>Instagram @beyperdee</span>{ICON['arrow']}</a></div></div></div></section>
{G['cta_band'](lang, ui('wa_general', lang), 'iletisim/ofis')}'''
    AP = P.PAGES['about']
    G['write'](lang, 'hakkimizda', G['layout'](lang, 'hakkimizda', tx(AP['title'], lang), tx(AP['desc'], lang), body, nav='hakkimizda',
                                               schemas=[cs, {'@context': 'https://schema.org', '@type': 'AboutPage', 'url': G['abs_url'](lang, 'hakkimizda'), 'about': {'@id': D.SITE + '/#isletme'}}],
                                               og_image=G['og_src']('hakkimizda/isik')))


def render_contact(G, lang):
    D, P, e, tx, ui, url, picture, ICON = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    CP = P.PAGES['contact']
    crumbs, cs = G['breadcrumbs'](lang, [(tx(CP['h1'], lang), 'iletisim')])
    body = f'''<section class="page-hero"><div class="wrap">{crumbs}<h1 class="h1">{tx(CP['h1'], lang)}</h1><p class="lead">{tx(CP['lead'], lang)}</p>
  <div class="row">{G['btn_wa'](lang, ui('wa_general', lang))}<a class="btn btn-ghost" href="tel:{D.TEL}">{ICON['phone']}<span>{G['ltr'](D.PHONE_DISPLAY)}</span></a></div></div></section>
<section class="band tight quote-band" id="teklif" aria-labelledby="h-teklif"><div class="wrap quote-grid">
  <div class="quote-intro"><h2 class="h2" id="h-teklif">{tx(P.FORM['h'], lang)}</h2><p class="lead">{tx(P.FORM['p'], lang)}</p></div>
  {G['quote_forms'](lang, idp='cq')}
</div></section>
<section class="band linen" aria-labelledby="h-ofis"><div class="wrap ct-grid">
  <div><h2 class="h2" id="h-ofis">{tx(D.UI['address'], lang)}</h2>
    <dl class="contact-dl">
      <div><dt>{ui('phone', lang)} · {ui('whatsapp_short', lang)}</dt><dd><a href="tel:{D.TEL}">{G['ltr'](D.PHONE)}</a></dd></div>
      <div><dt>{ui('email', lang)}</dt><dd><a href="mailto:{D.EMAIL}">{D.EMAIL}</a></dd></div>
      <div><dt>{ui('address', lang)}</dt><dd lang="tr">{e(D.ADDRESS_LINE)}</dd></div>
      <div><dt>{ui('hours_l', lang)}</dt><dd>{ui('hours', lang)}</dd></div>
      <div><dt>Instagram</dt><dd><a href="{D.INSTAGRAM}" target="_blank" rel="noopener">@beyperdee</a></dd></div>
    </dl>
    <div class="row">{G['arrow_link'](D.MAPS_DIR, ui('directions', lang), attrs=' target="_blank" rel="noopener"')}{G['arrow_link'](D.MAPS, 'Google Maps', attrs=' target="_blank" rel="noopener"')}</div>
  </div>
  <figure><div class="ph ph-43">{picture('iletisim/ofis', tx(CP['office_alt'], lang), '(max-width: 900px) 100vw, 50vw')}</div></figure>
</div></section>'''
    cp = {'@context': 'https://schema.org', '@type': 'ContactPage', 'url': G['abs_url'](lang, 'iletisim'), 'about': {'@id': D.SITE + '/#isletme'}}
    G['write'](lang, 'iletisim', G['layout'](lang, 'iletisim', tx(CP['title'], lang), tx(CP['desc'], lang), body, nav='iletisim',
                                             schemas=[cs, cp], scripts=('forms.js',), og_image=G['og_src']('iletisim/ofis')))


def render_regions(G):
    D, P, L, e, ui, url, picture, ICON = G['D'], G['P'], G['LOC'], G['e'], G['ui'], G['url'], G['picture'], G['ICON']
    lang = 'tr'
    I = L.REGIONS_INDEX
    cards = ''.join(f'<li><a class="rcard" href="/tr/hizmet-bolgeleri/{k}"><span class="h3">{r["name"]}</span><span>{e(r["lead"])}</span><span class="pcard-more">{ui("details", lang)}{ICON["arrow"]}</span></a></li>' for k, r in L.REGIONS.items())
    crumbs, cs = G['breadcrumbs'](lang, [(I['h1'], 'hizmet-bolgeleri')])
    body = f'''<section class="page-hero"><div class="wrap">{crumbs}<h1 class="h1">{I['h1']}</h1><p class="lead">{I['lead']}</p></div></section>
<section class="band tight"><div class="wrap"><h2 class="sr">{I['h1']}</h2><ul class="rgrid">{cards}</ul></div></section>
{G['cta_band'](lang, ui('wa_general', lang))}'''
    G['write'](lang, 'hizmet-bolgeleri', G['layout'](lang, 'hizmet-bolgeleri', I['title'], I['desc'], body, avail={'tr'}, schemas=[cs]))
    for k, r in L.REGIONS.items():
        path = f'hizmet-bolgeleri/{k}'
        crumbs, cs = G['breadcrumbs'](lang, [(I['h1'], 'hizmet-bolgeleri'), (r['name'], path)])
        secs = ''.join(f'<section><h2 class="h3">{e(h)}</h2><p>{e(p)}</p></section>' for h, p in r['sections'])
        prods = ''.join(G['product_card'](s, lang, '(max-width: 640px) 50vw, 25vw') for s in r['products'])
        others = ''.join(f'<li><a href="/tr/hizmet-bolgeleri/{o}">{L.REGIONS[o]["name"]}</a></li>' for o in L.REGIONS if o != k)
        wa = f'Merhaba, {r["name"]} için perde / duvar kağıdı teklifi almak istiyorum.'
        body = f'''<section class="page-hero"><div class="wrap">{crumbs}<p class="kicker">{ui('areas', lang)}</p><h1 class="h1">{e(r['h1'])}</h1><p class="lead">{e(r['lead'])}</p>
  <div class="row">{G['btn_wa'](lang, wa)}<a class="btn btn-ghost" href="#teklif">{ui('get_quote', lang)}</a></div></div></section>
<section class="band linen"><div class="wrap art art-solo"><article class="prose">{secs}</article></div></section>
<section class="band tight" aria-labelledby="h-rp"><div class="wrap">{G['sec_head'](r['name'], 'Bu bölgede sık seçilenler' if False else 'Önerdiğimiz ürünler', '', 'h-rp')}<div class="pgrid pgrid-3">{prods}</div></div></section>
<section class="band linen" aria-labelledby="h-sss"><div class="wrap faq-grid"><div><p class="kicker">{r['name']}</p><h2 class="h2" id="h-sss">{ui('faq', lang)}</h2><p class="kicker mt">{ui('areas', lang)}</p><ul class="chips">{others}</ul></div>{G['faq_block'](r['faq'], lang)}</div></section>
<section class="band quote-band" id="teklif" aria-labelledby="h-teklif"><div class="wrap quote-grid"><div class="quote-intro"><h2 class="h2" id="h-teklif">{ui('cta_h', lang)}</h2><p class="lead">{ui('cta_p', lang)}</p></div>{G['quote_forms'](lang, idp='rq')}</div></section>'''
        svc = {'@context': 'https://schema.org', '@type': 'Service', 'name': f'{r["name"]} perde ve duvar kağıdı', 'serviceType': 'Perde, duvar kağıdı ve halı uygulaması',
               'provider': {'@id': D.SITE + '/#isletme'}, 'areaServed': {'@type': 'Place', 'name': f'{r["name"]}, İstanbul'}, 'url': G['abs_url'](lang, path)}
        G['write'](lang, path, G['layout'](lang, path, r['title'], r['desc'], body, avail={'tr'}, schemas=[cs, svc, G['faq_schema'](r['faq'])],
                                           scripts=('forms.js',), wa_text=wa))


def render_legal(G):
    L, e, ui = G['LOC'], G['e'], G['ui']
    lang = 'tr'
    for slug, doc in L.LEGAL.items():
        parts = []
        for kind, val in doc['body']:
            if kind == 'p':
                parts.append(f'<p>{e(val)}</p>')
            elif kind == 'h2':
                parts.append(f'<h2 class="h3">{e(val)}</h2>')
            elif kind == 'ul':
                parts.append('<ul class="dash">' + ''.join(f'<li>{e(x)}</li>' for x in val) + '</ul>')
            elif kind == 'table':
                head, *rows = val
                parts.append('<div class="table-wrap"><table><thead><tr>' + ''.join(f'<th scope="col">{e(h)}</th>' for h in head) + '</tr></thead><tbody>' +
                             ''.join('<tr>' + ''.join(f'<td>{e(c)}</td>' for c in r) + '</tr>' for r in rows) + '</tbody></table></div>')
            elif kind == 'consent':
                parts.append(f'<div class="consent-box" data-consent-manage><p data-consent-state></p><div class="row"><button class="btn btn-sm" type="button" data-consent="all" hidden>{ui("cookie_accept", lang)}</button><button class="btn btn-ghost btn-sm" type="button" data-consent="necessary">{ui("cookie_reject", lang)}</button></div></div>')
        crumbs, cs = G['breadcrumbs'](lang, [(doc['h1'], slug)])
        body = f'''<section class="page-hero"><div class="wrap">{crumbs}<h1 class="h1">{e(doc['h1'])}</h1><p class="kicker">Son güncelleme: {L.UPDATED}</p></div></section>
<section class="band tight"><div class="wrap art art-solo"><article class="prose legal">{''.join(parts)}</article></div></section>'''
        G['write'](lang, slug, G['layout'](lang, slug, doc['title'], doc['desc'], body, avail={'tr'}, schemas=[cs]))


def render_404(G):
    D, P, e, tx, ui, url = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url']
    N = P.NOTFOUND
    blocks = []
    for lang in D.LANGS:
        links = ''.join(f'<li><a href="{url(lang, p)}">{ui(k, lang)}</a></li>' for p, k in [('', 'nav_home'), ('urunler', 'nav_products'), ('katalog', 'nav_catalog'), ('projeler', 'nav_projects'), ('iletisim', 'nav_contact')])
        blocks.append(f'<div class="nf" lang="{lang}" dir="{"rtl" if lang == "ar" else "ltr"}"><p class="kicker">404</p><{"h1" if lang == "tr" else "h2"} class="h2">{tx(N["h1"], lang)}</{"h1" if lang == "tr" else "h2"}><p class="lead">{tx(N["p"], lang)}</p><ul class="chips">{links}</ul></div>')
    body = f'<section class="page-hero nf-wrap"><div class="wrap nf-grid">{"".join(blocks)}</div></section>'
    page = G['layout']('tr', '404', tx(N['title'], 'tr'), tx(N['p'], 'tr'), body, avail={'tr'}, noindex=True)
    G['PAGES_OUT'].pop()  # 404 site haritasına girmez
    open(G['os'].path.join(G['PUB'], '404.html'), 'w').write(page)
