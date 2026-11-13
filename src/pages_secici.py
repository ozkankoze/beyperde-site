# -*- coding: utf-8 -*-
"""Perde Seçici (/perde-secici): görselli, adım adım danışmanlık deneyimi.

Sorular, cevap değerleri ve puanlama D.QUIZ'den gelir (ana sayfadaki kısa sürümle aynı mantık);
burada yalnızca sunum katmanı var. Sonuç ekranı secici.js tarafından aynı puanlamayla üretilir.
"""
import json


def render_secici(G, lang):
    D, e, tx, ui, url, picture, ICON = G['D'], G['e'], G['tx'], G['ui'], G['url'], G['picture'], G['ICON']
    Q, A = D.QUIZ, D.ADV
    n_steps = len(Q['questions'])
    check = '<svg class="acheck" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9.25"/><path d="M6 10.4l2.6 2.6L14.2 7.4"/></svg>'

    def img_src(key, w=960):
        k = G['img_key'](key)
        ws = G['IMG'][k + '.webp']['widths']
        w = w if w in ws else ws[-1]
        return f'/img/{k}-{w}.webp'

    steps = []
    labels = {}
    for i, (qk, _qlabel, opts) in enumerate(Q['questions']):
        title, desc = A['steps'][qk]
        labels[qk] = {v: tx(lbl, lang) for v, lbl in opts}
        cards = []
        for v, lbl in opts:
            name = tx(lbl, lang)
            sub = A['opt_desc'].get(qk, {}).get(v)
            sub_html = f'<span class="acard-d">{e(tx(sub, lang))}</span>' if sub else ''
            if qk == 'color':
                sw = ''.join(f'<span style="--c:{D.COLORS[c][1]}"></span>' for c in Q['color_map'][v])
                media = f'<span class="aswatch" aria-hidden="true">{sw}</span>'
            else:
                key = A['img'][qk][v]
                media = f'<span class="aph">{picture(key, "", "(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 300px")}</span>'
            cards.append(f'''<label class="acard acard-{qk}">
  <input class="sr" type="radio" name="{qk}" value="{v}">
  {media}
  <span class="acard-b"><span class="acard-t">{e(name)}</span>{sub_html}</span>
  {check}
</label>''')
        extra = ''
        if qk == 'color':
            pleats = ''.join('<i></i>' for _ in range(9))
            extra = f'<figure class="apreview" aria-label="{tx(A["preview"], lang)}"><div class="apv-rod"></div><div class="apv-curtain" data-preview>{pleats}</div><div class="apv-sill"></div></figure>'
        steps.append(f'''<fieldset class="astep" data-step="{i}" {'' if i == 0 else 'hidden'}>
  <legend class="astep-h"><span class="h2">{tx(title, lang)}</span></legend>
  <p class="astep-p">{tx(desc, lang)}</p>
  <div class="astep-body{' has-preview' if extra else ''}"><div class="agrid agrid-{qk}" role="radiogroup">{''.join(cards)}</div>{extra}</div>
</fieldset>''')

    segs = ''.join(f'<li><button type="button" class="aseg" data-goto="{i}" disabled><span class="sr">{tx(A["step_label"], lang).format(n=i + 1)}</span></button></li>' for i in range(n_steps))

    prods = {}
    for s in {p for sc in Q['scores'].values() for p in sc}:
        cat, name, short = D.PRODUCTS[s]
        imgs = G['product_imgs'](s)
        prods[s] = {'n': tx(name, lang), 'd': tx(short, lang), 'u': url(lang, f'urunler/{cat}/{s}'),
                    'i': img_src(imgs[0], 1600) if imgs else '', 'is': img_src(imgs[0], 480) if imgs else '',
                    'a': G['product_alt'](s, imgs[0], lang) if imgs else ''}
    data = {
        'scores': [[k[0], k[1], v] for k, v in Q['scores'].items()],
        'p': prods, 'labels': labels, 'order': [q[0] for q in Q['questions']],
        'colors': Q['color_map'], 'hex': {k: v[1] for k, v in D.COLORS.items()},
        'cat': url(lang, 'katalog'), 'wa': f'https://wa.me/{D.WA_NUMBER}?text=',
        't': {
            'progress': tx(A['progress'], lang), 'step': tx(A['step_label'], lang), 'n': n_steps,
            'why': {k: tx(v, lang) for k, v in A['why'].items()},
            'say': {k: ({kk: tx(vv, lang) for kk, vv in v.items()} if isinstance(v, dict) and 'tr' not in v else tx(v, lang)) for k, v in A['say'].items()},
            'wa': tx(A['wa_msg'], lang), 'ours': tx(A['ours'], lang), 'detail': tx(A['detail'], lang), 'plus': tx(A['plus'], lang),
        },
        # birlikte önerildiğinde tek bir öneri olarak sunulan ikililer (tül + kalın perde)
        'pairs': [['tul-perde', 'fon-perde'], ['tul-perde', 'rustik-perde']],
    }
    arrow = ICON['arrow']
    facts = ''.join(f'<li>{tx(f, lang)}</li>' for f in A['facts'])
    crumbs, cs = G['breadcrumbs'](lang, [(ui('nav_quiz', lang), 'perde-secici')])

    html = f'''<section class="adv-intro">
  <div class="wrap adv-intro-in">
    <div class="adv-intro-t">
      {crumbs}
      <h1 class="h1 adv-h1">{tx(A['h1'], lang)}</h1>
      <p class="lead">{tx(A['lead'], lang)}</p>
      <ul class="adv-facts">{facts}</ul>
    </div>
    <div class="adv-intro-img">{picture(A['hero_img'], G['product_alt']('fon-perde', '/' + A['hero_img'] + '.jpg', lang), '(max-width: 900px) 0px, 34vw', eager=True)}</div>
  </div>
</section>
<section class="adv" aria-label="{ui('nav_quiz', lang)}">
  <form class="wrap adv-form" data-adv novalidate>
    <div class="adv-top">
      <p class="adv-prog" data-prog aria-live="polite">{tx(A['progress'], lang).format(n=1, t=n_steps)}</p>
      <ol class="adv-segs">{segs}</ol>
    </div>
    <div class="adv-steps">{''.join(steps)}</div>
    <div class="adv-nav" data-nav>
      <button type="button" class="btn btn-ghost" data-back hidden>{tx(A['back'], lang)}</button>
      <button type="submit" class="btn" data-next disabled data-l-next="{tx(A['next'], lang)}" data-l-last="{tx(A['see_result'], lang)}"><span>{tx(A['next'], lang)}</span>{arrow}</button>
    </div>
    <div class="adv-res" data-result hidden tabindex="-1">
      <div class="ares-head">
        <p class="kicker">{tx(A['res_k'], lang)}</p>
        <h2 class="h2">{tx(A['res_h'], lang)}</h2>
        <p class="lead">{tx(A['res_p'], lang)}</p>
        <ul class="ares-tags" data-tags></ul>
      </div>
      <article class="ares-main" data-main></article>
      <div class="ares-cta">
        <a class="btn btn-wa btn-lg" data-wa href="https://wa.me/{D.WA_NUMBER}" target="_blank" rel="noopener">{ICON['wa']}<span>{tx(A['wa_btn'], lang)}</span></a>
        <a class="arrow-link" data-catalog href="{url(lang, 'katalog')}"><span>{tx(Q['see_catalog'], lang)}</span>{arrow}</a>
      </div>
      <div class="ares-alt" data-alt-wrap><h3 class="h3">{tx(A['alt_h'], lang)}</h3><ul class="ares-alts" data-alts></ul></div>
      <p class="fnote">{tx(Q['result_note'], lang)}</p>
      <div class="ares-actions"><button type="button" class="btn btn-ghost" data-edit>{tx(A['edit'], lang)}</button><button type="button" class="btn btn-ghost" data-restart>{tx(A['restart'], lang)}</button></div>
    </div>
    <script type="application/json" data-adv-data>{json.dumps(data, ensure_ascii=False).replace('</', '<\\/')}</script>
  </form>
</section>'''
    return html, cs
