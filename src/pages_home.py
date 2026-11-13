# -*- coding: utf-8 -*-
"""Anasayfa: giriş animasyonu → marka → ürünler → uygulamalar → güven → teklif."""
import json


def quiz_block(G, lang, hid='oda-rehberi', intro=True):
    D, e, tx, url, picture, ICON = G['D'], G['e'], G['tx'], G['url'], G['picture'], G['ICON']
    Q = D.QUIZ
    fs = []
    for i, (qk, qlabel, opts) in enumerate(Q['questions']):
        radios = ''.join(
            f'<label class="qopt"><input type="radio" name="{qk}" value="{v}"><span>{tx(lbl, lang)}</span></label>'
            for v, lbl in opts)
        fs.append(f'''<fieldset class="qstep" data-step="{i}"><legend><span class="qnum">{tx(Q["step"], lang).format(n=i + 1, t=len(Q["questions"]))}</span>{tx(qlabel, lang)}</legend><div class="qopts">{radios}</div></fieldset>''')
    prods = {}
    for s in {p for sc in Q['scores'].values() for p in sc}:
        cat, name, short = D.PRODUCTS[s]
        imgs = G['product_imgs'](s)
        prods[s] = {'n': tx(name, lang), 'd': tx(short, lang), 'u': url(lang, f'urunler/{cat}/{s}'),
                    'i': (f'/img/{G["img_key"](imgs[0])}-480.webp' if imgs else '')}
    data = {'scores': [[k[0], k[1], v] for k, v in Q['scores'].items()], 'p': prods,
            'colors': Q['color_map'], 'cat': url(lang, 'katalog'),
            't': {'match': tx(Q['match1'], lang), 'details': G['ui']('details', lang)}}
    head = f'''<div class="quiz-intro">
      <p class="kicker">{tx(D.UI['nav_quiz'], lang)}</p>
      <h2 class="h2" id="{hid}-h">{tx(Q['title'], lang)}</h2>
      <p class="lead">{tx(Q['intro'], lang)}</p>
    </div>''' if intro else f'<h2 class="sr" id="{hid}-h">{tx(Q["title"], lang)}</h2>'
    return f'''<section class="band quiz-band" id="{hid}" aria-labelledby="{hid}-h">
  <div class="wrap {'quiz-grid' if intro else 'quiz-solo'}">
    {head}
    <form class="quiz" data-quiz novalidate>
      <div class="qprog" aria-hidden="true"><span></span></div>
      {''.join(fs)}
      <div class="qnav"><button type="button" class="btn btn-ghost btn-sm" data-q-back hidden>{tx(Q['back'], lang)}</button></div>
      <div class="qres" data-q-result hidden tabindex="-1">
        <h3 class="h3">{tx(Q['result_h'], lang)}</h3>
        <ol class="qres-list"></ol>
        <p class="fnote">{tx(Q['result_note'], lang)}</p>
        <div class="row"><a class="arrow-link" data-q-catalog href="{url(lang, 'katalog')}"><span>{tx(Q['see_catalog'], lang)}</span>{ICON['arrow']}</a><button type="button" class="btn btn-ghost btn-sm" data-q-restart>{tx(Q['restart'], lang)}</button></div>
      </div>
      <script type="application/json" data-q-data>{json.dumps(data, ensure_ascii=False).replace('</', '<\\/')}</script>
    </form>
  </div>
</section>'''


def intro_static(G, alt):
    """Animasyonun ilk karesi (yatay/dikey); kareler henüz yoksa salon fotoğrafı."""
    IMG, e = G['IMG'], G['e']
    if 'intro/kapi-d.webp' not in IMG:
        return G['picture']('ana-sayfa', alt, '100vw', eager=True)
    def ss(k):
        m = IMG[k + '.webp']
        return ', '.join(f'/img/{k}-{w}.webp {w}w' for w in m['widths']), m
    d, md = ss('intro/kapi-d')
    out = '<picture>'
    if 'intro/kapi-m.webp' in IMG:
        mm, _ = ss('intro/kapi-m')
        out += f'<source media="(max-aspect-ratio: 1/1)" srcset="{mm}" sizes="100vw">'
    out += f'<source srcset="{d}" sizes="100vw"><img src="/img/intro/kapi-d-{md["widths"][-1]}.webp" width="{md["w"]}" height="{md["h"]}" alt="{e(alt)}" fetchpriority="high" loading="eager" decoding="async"></picture>'
    return out


def compare_block(G, lang, items):
    """Öncesi/sonrası sürgüsü. Yalnızca gerçek fotoğraf çifti varsa çıktı üretir."""
    if not items:
        return ''
    P, tx, picture, e = G['P'], G['tx'], G['picture'], G['e']
    out = []
    for it in items:
        out.append(f'''<figure class="cmp" data-compare>
  <div class="cmp-box" style="aspect-ratio:{it.get('ratio', '4/3')}">
    <div class="cmp-after">{picture(it['after'], tx(it['after_alt'], lang), '(max-width: 900px) 100vw, 60vw')}</div>
    <div class="cmp-before">{picture(it['before'], tx(it['before_alt'], lang), '(max-width: 900px) 100vw, 60vw')}</div>
    <span class="cmp-tag cmp-tag-b">{tx(P.PAGES['projects']['before'], lang)}</span><span class="cmp-tag cmp-tag-a">{tx(P.PAGES['projects']['after'], lang)}</span>
    <input class="cmp-range" type="range" min="0" max="100" value="50" aria-label="{tx(P.PAGES['projects']['slider'], lang)}">
    <span class="cmp-handle" aria-hidden="true"></span>
  </div>
  <figcaption>{e(tx(it['caption'], lang))}</figcaption>
</figure>''')
    return f'<div class="cmp-list"><h3 class="h3">{tx(P.PAGES["projects"]["before_after_h"], lang)}</h3>{"".join(out)}</div>'


def render_home(G, catalog):
    D, P, e, tx, ui, url, picture, ICON = G['D'], G['P'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    H = P.HOME
    PR = G['PRAW']
    for lang in D.LANGS:
        h = lambda k: tx(H[k], lang)  # noqa: E731
        stats = ''.join(f'<div><dt>{tx(a, lang)}</dt><dd>{tx(b, lang)}{f"<small>{tx(c, lang)}</small>" if c else ""}</dd></div>' for a, b, c in H['stats'])

        cats = []
        for ck, c in D.CATS.items():
            links = ''.join(f'<li><a href="{url(lang, f"urunler/{ck}/{s}")}">{tx(D.PRODUCTS[s][1], lang)}</a></li>' for s in c['items'])
            cats.append(f'''<article class="cat">
  <a class="cat-media" href="{url(lang, f'urunler/{ck}')}" tabindex="-1" aria-hidden="true"><div class="ph">{picture(c['cover'], '', '(max-width: 900px) 100vw, 33vw')}</div></a>
  <div class="cat-body">
    <p class="kicker">{tx(c['kicker'], lang)} · {tx(H['n_products'], lang).format(n=len(c['items']))}</p>
    <h3 class="h3"><a href="{url(lang, f'urunler/{ck}')}">{tx(c['name'], lang)}</a></h3>
    <p>{tx(c['short'], lang)}</p>
    <ul class="chips">{links}</ul>
  </div>
</article>''')

        fins = ''.join(
            f'<button type="button" class="fin" aria-pressed="{"true" if i == 0 else "false"}" data-swap-src="{G["big_src"](k)}" data-swap-alt="{e(G["product_alt"]("rustik-perde", "/" + k + ".jpg", lang))}">'
            f'{picture(k, "", "96px")}<span>{tx(n, lang)}</span></button>'
            for i, (k, n) in enumerate(H['finials']))
        first_fin = H['finials'][0][0]

        cat_strip_keys = ['urunler/fon-perde/zeytin-doku', 'urunler/vinyl/vera/1509-4', 'urunler/stor-perde/keten-doku', 'urunler/jaluzi-perde/bal-tonu', 'urunler/vinyl/omega/23207-1', 'urunler/fon-perde/kenar-bandi']
        strip = ''.join(f'<li><a href="{url(lang, "katalog")}" tabindex="-1">{picture(k, "", "(max-width: 640px) 33vw, 16vw")}</a></li>' for k in cat_strip_keys)

        ep = PR[lang]
        gal_keys = P.GALLERY[:7]
        gal = ''.join(f'<a class="gi" href="{G["big_src"](k)}" data-lb="home">{picture(k, tx(a, lang), "(max-width: 640px) 50vw, 25vw")}</a>' for k, a in gal_keys)

        steps = ''.join(f'<li><span class="n">0{i + 1}</span><h3 class="h4">{tx(t, lang)}</h3><p>{tx(d, lang)}</p></li>' for i, (t, d) in enumerate(P.STEPS))
        faq_items = [(tx(q, lang), tx(a, lang)) for q, a in P.HOME_FAQ]
        areas = ''.join(f'<li><a href="/tr/hizmet-bolgeleri/{k}"{"" if lang == "tr" else " hreflang=\"tr\""}>{tx(P.AREA_NAMES[k], lang)}</a></li>' for k, _ in P.AREAS)
        rail = ''.join(f'<li data-i="{i}"><b>{tx(r, lang)}</b><span>0{i + 1}</span><i></i></li>' for i, r in enumerate(H['rail']))

        body = f'''
<section class="intro" id="giris" data-intro aria-label="{tx(H['brand_h'], lang)}">
  <div class="stage">
    <div class="intro-static">{intro_static(G, h('static_alt'))}</div>
    <video id="stage" muted playsinline preload="none" disablepictureinpicture data-src="/intro/giris.mp4?v={G['INTRO_V']}"{f' data-src-hd="/intro/giris-2k.mp4?v={G["INTRO_V"]}"' if G['INTRO_HD'] else ''} data-dur="15.04" aria-hidden="true"></video>
    <div class="veil" aria-hidden="true"></div>
    <div class="ilabel" id="ihero">
      <h1><span class="isub">{h('h1_sub')}</span><span class="ibig">{h('h1')}</span></h1>
      <div class="irule" aria-hidden="true"></div>
      <p class="ihint" aria-hidden="true"><span class="mouse"></span><span>{h('hint')}</span></p>
    </div>
    <svg id="callouts" aria-hidden="true"></svg>
    <div class="iprod" id="l1" aria-hidden="true"><p class="ik">02 · {h('l1_k')}</p><p class="it"><span class="mask"><span>{h('l1').replace('<br>', '</span></span><span class="mask"><span>')}</span></span></p></div>
    <div class="iprod" id="l2" aria-hidden="true"><p class="ik">03 · {h('l2_k')}</p><p class="it"><span class="mask"><span>{h('l2')}</span></span></p></div>
    <div class="iprod" id="l3" aria-hidden="true"><p class="ik">04 · {h('l3_k')}</p><p class="it"><span class="mask"><span>{h('l3')}</span></span></p></div>
    <div class="iprod" id="l4" aria-hidden="true"><p class="ik">05 · {h('l4_k')}</p><p class="it"><span class="mask"><span>{h('l4')}</span></span></p></div>
    <div class="ilabel" id="ioutro" aria-hidden="true"><p class="isub">{h('outro_k')}</p><p class="iout">{h('outro')}</p></div>
    <ol class="rail" aria-hidden="true">{rail}</ol>
    <div class="ibar" aria-hidden="true"><span></span></div>
    <a class="iskip" href="#marka" data-skip>{h('skip')}{ICON['arrow']}</a>
  </div>
</section>

{quiz_block(G, lang)}

<section class="band brand" id="marka" aria-labelledby="h-marka">
  <div class="wrap brand-grid">
    <div class="brand-text">
      <p class="kicker">{h('brand_k')}</p>
      <h2 class="h2" id="h-marka">{h('brand_h')}</h2>
      <p class="lead">{h('brand_p')}</p>
      <blockquote>{h('brand_q')}</blockquote>
      {G['arrow_link'](url(lang, 'hakkimizda'), h('about_link'))}
    </div>
    <figure class="brand-img"><div class="ph">{picture('hakkimizda/isik', h('brand_img_alt'), '(max-width: 900px) 100vw, 55vw')}</div><figcaption>{h('brand_cap')}</figcaption></figure>
  </div>
  <div class="wrap"><dl class="stats">{stats}</dl></div>
</section>

<section class="band linen" id="urunler" aria-labelledby="h-urunler">
  <div class="wrap">
    {G['sec_head'](h('prod_k'), h('prod_h'), h('prod_p'), 'h-urunler', extra=G['arrow_link'](url(lang, 'katalog'), ui('all_products', lang)))}
    <div class="cat-grid">{''.join(cats)}</div>
  </div>
</section>

<section class="band dark feature" aria-labelledby="h-rustik">
  <div class="wrap feat-grid">
    <figure class="feat-media"><div class="ph">{picture(first_fin, G['product_alt']('rustik-perde', '/' + first_fin + '.jpg', lang), '(max-width: 900px) 100vw, 50vw', cls='swap-img')}</div></figure>
    <div class="feat-text">
      <p class="kicker">{h('rk_k')}</p>
      <h2 class="h2" id="h-rustik">{h('rk_h')}</h2>
      <p class="lead">{h('rk_p')}</p>
      <p class="kicker mt">{h('rk_pick')}</p>
      <div class="fins" role="group" aria-label="{h('rk_pick')}" data-swap>{fins}</div>
      <div class="row"><a class="btn btn-light" href="{url(lang, 'urunler/perde/rustik-perde')}">{h('rk_cta')}</a></div>
    </div>
  </div>
</section>


<section class="band tight catteaser" aria-labelledby="h-katalog">
  <div class="wrap">
    {G['sec_head'](h('cat_k'), h('cat_h'), h('cat_p').format(n=len(catalog)), 'h-katalog', extra=f'<a class="btn" href="{url(lang, "katalog")}">{h("cat_cta")}</a>')}
    <ul class="strip" aria-hidden="true">{strip}</ul>
  </div>
</section>

<section class="band linen" id="uygulamalar" aria-labelledby="h-uyg">
  <div class="wrap">
    {G['sec_head'](h('app_k'), h('app_h'), h('app_p'), 'h-uyg')}
    <article class="pj-feature">
      <a class="pj-media" href="{url(lang, 'projeler/erenkoy-hk-evi')}" tabindex="-1" aria-hidden="true"><div class="ph">{picture('projeler/erenkoy-hk-evi/pencere', '', '(max-width: 900px) 100vw, 45vw')}</div></a>
      <div class="pj-text">
        <dl class="meta">{''.join(f'<div><dt>{e(a)}</dt><dd>{e(b) if b else e(" · ".join(ep["work"]))}</dd></div>' for a, b in ep['meta'])}</dl>
        <h3 class="h2"><a href="{url(lang, 'projeler/erenkoy-hk-evi')}">{e(ep['h1'])}</a></h3>
        <p>{e(ep['lead'])}</p>
        {G['arrow_link'](url(lang, 'projeler/erenkoy-hk-evi'), h('project_cta'))}
      </div>
    </article>
    {compare_block(G, lang, G['COMPARE'])}
    <div class="gal-grid">{gal}</div>
    <p class="center">{G['arrow_link'](url(lang, 'galeri'), h('gallery_cta'))}</p>
  </div>
</section>

<section class="band" id="guven" aria-labelledby="h-guven">
  <div class="wrap">
    {G['sec_head'](h('trust_k'), h('trust_h'), h('trust_p'), 'h-guven')}
    <ol class="steps">{steps}</ol>
    <dl class="facts">
      <div><dt>{ui('measure', lang)}</dt><dd>{ui('measure_v', lang)}</dd></div>
      <div><dt>{ui('delivery', lang)}</dt><dd>{ui('delivery_v', lang)}</dd></div>
      <div><dt>{ui('fitting', lang)}</dt><dd>{ui('fitting_v', lang)}</dd></div>
      <div><dt>{ui('guarantee', lang)}</dt><dd>{ui('guarantee_v', lang)}</dd></div>
    </dl>
  </div>
</section>

<section class="band linen" aria-labelledby="h-sss">
  <div class="wrap faq-grid">
    <div>
      <p class="kicker">{h('faq_k')}</p><h2 class="h2" id="h-sss">{h('faq_h')}</h2>
      <p class="lead">{h('faq_p')}</p>
      <div class="areas"><p class="kicker">{ui('areas', lang)}</p><p>{h('areas_p')}</p><ul class="chips">{areas}</ul></div>
    </div>
    {G['faq_block'](faq_items, lang)}
  </div>
</section>

<section class="band quote-band" id="teklif" aria-labelledby="h-teklif">
  <div class="wrap quote-grid">
    <div class="quote-intro">
      <p class="kicker">{tx(P.FORM['k'], lang)}</p>
      <h2 class="h2" id="h-teklif">{tx(P.FORM['h'], lang)}</h2>
      <p class="lead">{tx(P.FORM['p'], lang)}</p>
      <dl class="contact-dl">
        <div><dt>{ui('phone', lang)}</dt><dd><a href="tel:{D.TEL}">{G['ltr'](D.PHONE)}</a></dd></div>
        <div><dt>{ui('email', lang)}</dt><dd><a href="mailto:{D.EMAIL}">{D.EMAIL}</a></dd></div>
        <div><dt>{ui('hours_l', lang)}</dt><dd>{ui('hours', lang)}</dd></div>
      </dl>
    </div>
    {G['quote_forms'](lang, idp='hq')}
  </div>
</section>'''

        schemas = [{'@context': 'https://schema.org', '@type': 'WebSite', 'name': 'Bey Perde', 'url': G['abs_url'](lang),
                    'inLanguage': lang, 'publisher': {'@id': D.SITE + '/#isletme'}},
                   G['faq_schema'](faq_items)]
        page = G['layout'](lang, '', h('title'), h('desc'), body, schemas=schemas,
                           scripts=(('intro.js', 'quiz.js', 'forms.js') + (('compare.js',) if G['COMPARE'] else ())),
                           body_cls='home', head_extra='<link rel="preload" href="/js/three-0.149.0.min.js" as="script" media="(min-width: 1px)" data-three>' if False else '')
        G['write'](lang, '', page)
