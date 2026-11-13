/* Perde Seçici: görselli dört adım + kişisel öneri raporu.
   Puanlama ana sayfadaki kısa sürümle aynıdır (D.QUIZ['scores']); cevap değerleri değişmedi. */
(() => {
  'use strict';
  const form = document.querySelector('[data-adv]');
  if (!form) return;
  const D = JSON.parse(form.querySelector('[data-adv-data]').textContent);
  const T = D.t;
  const steps = [...form.querySelectorAll('.astep')];
  const segs = [...form.querySelectorAll('.aseg')];
  const prog = form.querySelector('[data-prog]');
  const nav = form.querySelector('[data-nav]');
  const back = form.querySelector('[data-back]');
  const next = form.querySelector('[data-next]');
  const res = form.querySelector('[data-result]');
  const preview = form.querySelector('[data-preview]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const N = steps.length;
  const answers = {};
  let i = 0, pointer = false, timer = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qOf = (n) => D.order[n];

  function inView(el) { const r = el.getBoundingClientRect(); return r.top >= 60 && r.top < innerHeight * 0.5; }
  function toTop() { if (!inView(form)) form.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' }); }

  function paint() {
    segs.forEach((b, k) => {
      const done = answers[qOf(k)] !== undefined;
      b.classList.toggle('done', done);
      b.classList.toggle('cur', k === i);
      b.disabled = !(done || k <= firstOpen());
      if (k === i && i < N) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
  }
  function firstOpen() { for (let k = 0; k < N; k++) if (answers[qOf(k)] === undefined) return k; return N; }

  function go(n, focus = true, scroll = true) {
    clearTimeout(timer);
    const prev = i; i = n;
    steps.forEach((s, k) => {
      const on = k === i;
      s.hidden = !on;
      if (on) { s.classList.remove('in-l', 'in-r'); void s.offsetWidth; s.classList.add(n >= prev ? 'in-r' : 'in-l'); }
    });
    const atRes = i >= N;
    res.hidden = !atRes;
    nav.hidden = atRes;
    back.hidden = i === 0;
    prog.textContent = atRes ? T.progress.replace('{n}', N).replace('{t}', N) : T.progress.replace('{n}', i + 1).replace('{t}', N);
    if (!atRes) {
      next.disabled = answers[qOf(i)] === undefined;
      next.querySelector('span').textContent = i === N - 1 ? next.dataset.lLast : next.dataset.lNext;
      if (focus) { const el = steps[i].querySelector('input:checked') || steps[i].querySelector('input'); el && el.focus({ preventScroll: true }); }
    }
    paint();
    if (scroll) toTop();
  }

  /* ---------- seçim ---------- */
  form.addEventListener('pointerdown', () => { pointer = true; });
  form.addEventListener('keydown', () => { pointer = false; });
  form.addEventListener('change', (ev) => {
    const inp = ev.target; if (inp.type !== 'radio') return;
    answers[inp.name] = inp.value;
    if (inp.name === 'color') tint();
    next.disabled = false; paint();
    // fareyle/dokunarak seçince kendiliğinden ilerle; klavyede ok tuşlarıyla gezinirken ilerleme (Devam Et ile geçilir)
    if (pointer) timer = setTimeout(() => advance(), reduce.matches ? 0 : 420);
  });
  function advance() { if (answers[qOf(i)] === undefined) return; i < N - 1 ? go(i + 1) : result(); }
  back.addEventListener('click', () => go(Math.max(0, i - 1)));
  segs.forEach((b) => b.addEventListener('click', () => go(+b.dataset.goto)));
  form.addEventListener('submit', (ev) => { ev.preventDefault(); advance(); });

  /* ---------- renk önizlemesi ---------- */
  function tint() {
    if (!preview) return;
    const c = (D.colors[answers.color] || [])[0];
    if (c) preview.style.setProperty('--pc', D.hex[c]);
  }

  /* ---------- sonuç ---------- */
  function result() {
    const score = {}, by = {};
    D.scores.forEach(([q, v, m]) => {
      if (answers[q] !== v) return;
      for (const p in m) { score[p] = (score[p] || 0) + m[p]; (by[p] = by[p] || {})[q] = true; }
    });
    let ranked = Object.entries(score).sort((a, b) => b[1] - a[1]).map(([s]) => s);
    // en üstteki iki öneri tül + kalın perde ikilisiyse, tek bir "birlikte" öneri olarak sun
    let main = [ranked[0]];
    const pair = D.pairs.find(([a, b]) => ranked.slice(0, 2).includes(a) && ranked.slice(0, 2).includes(b));
    if (pair) main = ranked.slice(0, 2);
    const alts = ranked.filter((s) => !main.includes(s)).slice(0, 2);
    const P = D.p;

    // seçilen tercihler
    const lbl = (q) => D.labels[q][answers[q]];
    form.querySelector('[data-tags]').innerHTML = D.order.map((q) => `<li>${esc(lbl(q))}</li>`).join('');

    // öneri cümlesi: yalnızca ürünün gerçekten puan aldığı cevaplardan
    const lead = P[main[0]];
    const hit = (q) => main.some((s) => by[s] && by[s][q]);
    const bits = [];
    if (hit('light')) bits.push(T.say.light[answers.light]);
    if (hit('style')) bits.push(T.say.style[answers.style]);
    let why = main.map((s) => P[s].d).join(' ');
    if (bits.length) {
      const room = hit('room') ? T.say.room.replace('{room}', lbl('room').toLocaleLowerCase(document.documentElement.lang)) + ', ' : '';
      const s = room + main.map((x) => P[x].n).join(T.plus) + ' ' + bits.join(T.say.and) + '.';
      why += ' ' + s.charAt(0).toLocaleUpperCase(document.documentElement.lang) + s.slice(1);
    }
    const reasons = ['room', 'light', 'style', 'color'].filter(hit).map((q) => `<li>${esc(T.why[q])}</li>`).join('');
    const title = main.map((s) => P[s].n).join(T.plus);
    const imgs = main.map((s) => P[s]).filter((p) => p.i);
    const media = imgs.map((p) => `<span class="aph"><img src="${p.i}" alt="${esc(p.a)}" loading="lazy" decoding="async"></span>`).join('');
    form.querySelector('[data-main]').innerHTML = `
      <div class="ares-media ${imgs.length > 1 ? 'two' : ''}">${media}</div>
      <div class="ares-text">
        <p class="kicker">${esc(T.ours)}</p>
        <h3 class="h2 ares-title">${esc(title)}</h3>
        <p class="ares-why">${esc(why)}</p>
        ${reasons ? `<ul class="ares-reasons">${reasons}</ul>` : ''}
        <div class="row">${main.map((s) => `<a class="arrow-link" href="${P[s].u}"><span>${esc(P[s].n)}</span>${ARROW}</a>`).join('')}</div>
      </div>`;
    const altWrap = form.querySelector('[data-alt-wrap]');
    altWrap.hidden = !alts.length;
    form.querySelector('[data-alts]').innerHTML = alts.map((s) => {
      const p = P[s];
      return `<li><a class="aalt" href="${p.u}"><span class="aph">${p.is ? `<img src="${p.is}" alt="${esc(p.a)}" loading="lazy" decoding="async">` : ''}</span>
        <span class="aalt-b"><span class="aalt-t">${esc(p.n)}</span><span class="aalt-d">${esc(p.d)}</span><span class="link-sm">${esc(T.detail)}</span></span></a></li>`;
    }).join('');

    // WhatsApp mesajı: tercihler + önerilen ürünler
    const prods = main.concat(alts.slice(0, 1)).map((s) => P[s].n);
    const msg = T.wa.replace('{room}', lbl('room')).replace('{light}', lbl('light')).replace('{style}', lbl('style')).replace('{color}', lbl('color'))
      .replace('{prods}', prods.join(document.documentElement.lang === 'ar' ? '، ' : ', '));
    form.querySelector('[data-wa]').href = D.wa + encodeURIComponent(msg);
    const colors = D.colors[answers.color] || [];
    form.querySelector('[data-catalog]').href = `${D.cat}?type=${main.concat(alts).join(',')}${colors.length ? '&color=' + colors.join(',') : ''}`;
    go(N, false);
    res.focus({ preventScroll: true });
  }
  const ARROW = next.querySelector('svg') ? next.querySelector('svg').outerHTML : '';

  form.querySelector('[data-edit]').addEventListener('click', () => go(0));
  form.querySelector('[data-restart]').addEventListener('click', () => {
    form.reset(); for (const k in answers) delete answers[k];
    if (preview) preview.style.removeProperty('--pc');
    go(0);
  });
  go(0, false, false);
})();
