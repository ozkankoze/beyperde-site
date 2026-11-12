/* Bey Perde — giriş animasyonu: tek parça video, sayfa kaydırıldıkça ileri/geri oynatılır.
   Video bir kez belleğe (blob) alınır; böylece her konuma anında atlanır.
   Hareket azaltma, veri tasarrufu ve düşük güçlü cihazlarda yalnızca ilk kare (statik görsel) gösterilir. */
(() => {
  'use strict';
  const intro = document.querySelector('[data-intro]');
  if (!intro) return;
  const rtl = document.documentElement.dir === 'rtl';
  const nav = navigator, conn = nav.connection || {};
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const lowEnd = (nav.deviceMemory && nav.deviceMemory <= 2) || conn.saveData || /2g/.test(conn.effectiveType || '');
  const skip = intro.querySelector('[data-skip]');
  const vid = document.getElementById('stage');

  function goStatic() { intro.classList.add('static'); intro.classList.remove('ready'); document.dispatchEvent(new CustomEvent('bp:intro-static')); }
  if (!vid || mqReduce.matches || lowEnd) { goStatic(); return; }

  skip && skip.addEventListener('click', (ev) => {
    ev.preventDefault();
    const r = intro.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.bottom, behavior: 'auto' });
    const h = document.getElementById('h-marka');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });

  /* ---------- video ---------- */
  const SRC = vid.dataset.src, DUR = parseFloat(vid.dataset.dur) || 15;
  let ready = false;
  fetch(SRC).then((r) => { if (!r.ok) throw 0; return r.blob(); })
    .then((b) => URL.createObjectURL(b))
    .catch(() => SRC)
    .then((url) => {
      vid.addEventListener('loadeddata', () => { ready = true; intro.classList.add('ready'); dirty = true; wake(); }, { once: true });
      vid.addEventListener('error', goStatic, { once: true });
      vid.preload = 'auto'; vid.src = url; vid.load();
    });

  // Ürün hedeflerinin videodaki konumu: [saniye, x, y] (0..1). Kamera ilerlediği için zamanla değişir.
  const KEYS = {
    a1: [[5, 0.4, 0.4], [7, 0.27, 0.4], [8, 0.25, 0.45], [9, 0.26, 0.43], [10, 0.27, 0.4]],
    a2: [[8, 0.93, 0.42], [15, 0.935, 0.42]],   // sağdaki kalın rustik fon perde
  };
  function keyAt(keys, t) {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, x0, y0] = keys[i - 1], [t1, x1, y1] = keys[i], k = (t - t0) / (t1 - t0); return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]; }
    return keys[keys.length - 1].slice(1);
  }

  /* ---------- metin ve oklar ---------- */
  const $ = (id) => document.getElementById(id);
  const L = { hero: $('ihero'), l1: $('l1'), l2: $('l2'), out: $('ioutro') };
  const rail = intro.querySelector('.rail'), railLi = [...intro.querySelectorAll('.rail li')];
  const bar = intro.querySelector('.ibar span');
  const NS = 'http://www.w3.org/2000/svg', svgEl = $('callouts');
  function mk() { const g = document.createElementNS(NS, 'g'); g.innerHTML = '<path class="halo lh"/><path class="halo hh"/><path class="ln"/><path class="hd"/><g class="tg"><circle class="ring" r="13"/><circle class="dot" r="3.5"/></g>'; svgEl.appendChild(g); return { g, ln: g.querySelector('.ln'), hd: g.querySelector('.hd'), lh: g.querySelector('.lh'), hh: g.querySelector('.hh'), tg: g.querySelector('.tg'), ring: g.querySelector('.ring'), dot: g.querySelector('.dot') }; }
  const C1 = mk(), C2 = mk();
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const band = (p, a, b, f = 0.035) => Math.min(sm(a - f, a, p), 1 - sm(b, b + f, p));
  const fx = (n) => n.toFixed(1);
  let VW = 1, VH = 1, isMob = false, panX = 0.5;
  const size = new Map();
  const measure = () => [L.l1, L.l2].forEach((n) => size.set(n, [n.offsetWidth, n.offsetHeight]));

  // ürün bölümleri, kaydırma oranı (p) cinsinden
  const S1 = { key: 'a1', a: 0.36, b: 0.6, pos: { d: [0.56, 0.15], m: [0.07, 0.15] } };    // Tekstil Duvar Kağıdı
  const S2 = { key: 'a2', a: 0.655, b: 0.875, pos: { d: [0.5, 0.15], m: [0.07, 0.14] } };  // Rustik Perde

  function anchor(p, key) {
    const [x, y] = keyAt(KEYS[key], p * DUR);
    const w = vid.videoWidth || 1920, h = vid.videoHeight || 1080, s = Math.max(VW / w, VH / h);
    return [(VW - w * s) * panX + x * w * s, (VH - h * s) / 2 + y * h * s];
  }
  function callout(node, c, S, p) {
    const oArrow = band(p, S.a, S.b, 0.012), draw_ = sm(S.a, S.a + 0.06, p), oText = band(p, S.a + 0.045, S.b);
    node.style.opacity = oText.toFixed(3);
    node.style.visibility = oText < 0.01 ? 'hidden' : 'visible';
    node.style.setProperty('--ty', ((1 - sm(0, 1, oText)) * 105).toFixed(1) + '%');
    c.g.style.opacity = oArrow.toFixed(3);
    if (oArrow < 0.01 && oText < 0.01) return;
    const P = isMob ? S.pos.m : S.pos.d;
    const [nw, nh] = size.get(node) || [0, 0];
    let lx = P[0] * VW; if (rtl) lx = VW - lx - nw;
    node.style.transform = `translate3d(${fx(lx)}px,${fx(P[1] * VH)}px,0)`;
    const [tx, ty] = anchor(p, S.key);
    const vis = sm(-0.04, 0.04, tx / VW) * sm(1.04, 0.96, tx / VW) * sm(-0.04, 0.04, ty / VH) * sm(1.04, 0.96, ty / VH);
    c.g.style.opacity = (oArrow * vis).toFixed(3);
    if (vis < 0.01) return;
    const rl = lx, rt = P[1] * VH, rw = nw, rh = nh, rr = rl + rw, rb = rt + rh, stub = 34;
    let sx, sy, ex, ey;
    if (tx < rl - 24) { sx = rl - 16; sy = rt + rh * 0.62; ex = sx - stub; ey = sy; }
    else if (tx > rr + 24) { sx = rr + 16; sy = rt + rh * 0.62; ex = sx + stub; ey = sy; }
    else if (ty > rb) { sx = Math.min(Math.max(tx, rl), rr); sy = rb + 14; ex = sx; ey = sy + stub; }
    else { sx = Math.min(Math.max(tx, rl), rr); sy = rt - 14; ex = sx; ey = sy - stub; }
    // ok üründen (halkadan) başlar, yazıya doğru çizilir; ok ucu yazının yanında
    const dx = ex - tx, dy = ey - ty, L2 = Math.hypot(dx, dy) || 1, ux = dx / L2, uy = dy / L2, gap = 16;
    const ox_ = tx + ux * gap, oy_ = ty + uy * gap, Lb = Math.max(1, L2 - gap), L1 = Math.hypot(sx - ex, sy - ey) || 1, d = draw_ * (Lb + L1);
    let path = `M${fx(ox_)},${fx(oy_)}`, hx, hy, hux, huy;
    if (d <= Lb) { const k = d / Lb; hx = ox_ + (ex - ox_) * k; hy = oy_ + (ey - oy_) * k; hux = ux; huy = uy; }
    else { const k = (d - Lb) / L1; path += ` L${fx(ex)},${fx(ey)}`; hx = ex + (sx - ex) * k; hy = ey + (sy - ey) * k; hux = (sx - ex) / L1; huy = (sy - ey) / L1; }
    path += ` L${fx(hx)},${fx(hy)}`;
    c.ln.setAttribute('d', path); c.lh.setAttribute('d', path);
    const hv = sm(0.06, 0.2, draw_), s = 11, bx = hx - hux * s, by = hy - huy * s, nx = -huy * s * 0.5, ny = hux * s * 0.5;
    const hd = `M${fx(bx + nx)},${fx(by + ny)} L${fx(hx)},${fx(hy)} L${fx(bx - nx)},${fx(by - ny)}`;
    c.hd.setAttribute('d', hd); c.hh.setAttribute('d', hd); c.hh.style.opacity = hv;
    c.hd.style.opacity = hv; c.tg.style.opacity = sm(0, 0.12, draw_);
    c.ring.setAttribute('cx', fx(tx)); c.ring.setAttribute('cy', fx(ty)); c.dot.setAttribute('cx', fx(tx)); c.dot.setAttribute('cy', fx(ty));
  }
  // dar ekranda video yanlardan kırpılır: işaret edilen ürün ekranda kalsın diye görüntü yatayda kayar
  function pan(p) {
    let want = 0.5;
    [S1, S2].forEach((S) => { const w = Math.min(sm(S.a - 0.08, S.a, p), 1 - sm(S.b, S.b + 0.08, p)); if (w > 0) want = 0.5 + (keyAt(KEYS[S.key], p * DUR)[0] - 0.5) * w * 1.15; });
    panX = clamp(want);
    vid.style.objectPosition = `${(panX * 100).toFixed(2)}% 50%`;
  }
  let lastIdx = -1;
  function overlay(p) {
    const o = 1 - sm(0.01, 0.06, p);
    L.hero.style.opacity = o.toFixed(3); L.hero.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    L.hero.style.translate = `0 ${fx(-(1 - o) * 24)}px`;
    callout(L.l1, C1, S1, p);
    callout(L.l2, C2, S2, p);
    const oo = sm(0.9, 0.96, p);
    L.out.style.opacity = oo.toFixed(3); L.out.style.translate = `0 ${fx((1 - oo) * 18)}px`;
    const idx = p < 0.3 ? 0 : p < 0.62 ? 1 : p < 0.89 ? 2 : 3;
    if (idx !== lastIdx) { railLi.forEach((r, i) => r.classList.toggle('on', i === idx)); lastIdx = idx; }
    rail.style.opacity = sm(0.03, 0.09, p).toFixed(3);
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (skip) { const so = 1 - sm(0.9, 0.97, p); skip.style.opacity = so.toFixed(3); skip.style.visibility = so < 0.02 ? 'hidden' : 'visible'; }
  }

  /* ---------- döngü ---------- */
  let target = 0, cur = 0, visible = true, dirty = true, raf = 0, last = 0;
  function readScroll() {
    const r = intro.getBoundingClientRect(); const max = r.height - innerHeight;
    target = max > 0 ? clamp(-r.top / max) : 0; wake();
  }
  function wake() { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  // Konumlama: önceki atlama bitmeden yenisi istenmez; biter bitmez (seeked) en güncel konuma hemen geçilir.
  // Böylece bir sonraki kareyi beklemeden kod çözücünün izin verdiği en yüksek hızda kare yenilenir.
  let want = 0;
  function seek(p) {
    if (!ready) return false;
    want = p * (Math.min(DUR, vid.duration || DUR) - 0.05);
    if (Math.abs(vid.currentTime - want) > 0.004) { if (!vid.seeking) vid.currentTime = want; return true; }
    return false;
  }
  vid.addEventListener('seeked', () => { if (ready && Math.abs(vid.currentTime - want) > 0.004) vid.currentTime = want; });
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    cur += (target - cur) * (1 - Math.exp(-dt * 9));
    if (Math.abs(target - cur) < 0.0002) cur = target;
    pan(cur); const pending = seek(cur); overlay(cur);
    if (cur !== target || dirty || pending) { dirty = false; raf = requestAnimationFrame(frame); }
  }
  let lw = 0, lh = 0;
  function resize(force) {
    const w = intro.clientWidth, h = window.innerHeight;
    if (!force && w === lw && Math.abs(h - lh) < 140) return;
    lw = w; lh = h; VW = w; VH = h; isMob = w < 700 || w / h < 1;
    intro.classList.toggle('mobile', isMob);
    measure();
    dirty = true; wake();
  }
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => resize(false));
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) wake(); }).observe(intro);
  mqReduce.addEventListener && mqReduce.addEventListener('change', (ev) => { if (ev.matches) goStatic(); });
  resize(true); readScroll(); cur = target;
  document.fonts && document.fonts.ready.then(() => { measure(); dirty = true; wake(); });
  document.dispatchEvent(new CustomEvent('bp:intro-ready'));
})();
