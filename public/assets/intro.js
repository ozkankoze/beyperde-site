/* Bey Perde — giriş animasyonu: Blender'da render edilmiş kare dizisi, kaydırmayla oynatılır.
   Masaüstünde yatay, telefonda dikey dizi yüklenir. Kareler sırayla, arka planda yüklenir;
   hareket azaltma, veri tasarrufu ve düşük güçlü cihazlarda yalnızca ilk kare (statik görsel) gösterilir. */
(() => {
  'use strict';
  const intro = document.querySelector('[data-intro]');
  if (!intro) return;
  const rtl = document.documentElement.dir === 'rtl';
  const nav = navigator, conn = nav.connection || {};
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const lowEnd = (nav.deviceMemory && nav.deviceMemory <= 2) || conn.saveData || /2g/.test(conn.effectiveType || '');
  const skip = intro.querySelector('[data-skip]');

  function goStatic() { intro.classList.add('static'); intro.classList.remove('ready'); document.dispatchEvent(new CustomEvent('bp:intro-static')); }
  if (mqReduce.matches || lowEnd) { goStatic(); return; }

  skip && skip.addEventListener('click', (ev) => {
    ev.preventDefault();
    const r = intro.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.bottom, behavior: 'auto' });
    const h = document.getElementById('h-marka');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });

  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d', { alpha: false });
  const DATA = window.BP_INTRO || {};
  const portrait = () => innerWidth / innerHeight < 1;
  const pick = () => (portrait() && DATA.m ? 'm' : 'd');   // dikey dizi yoksa yatay dizi kırpılarak oynar
  let mode = pick();
  intro.classList.toggle('mobile', mode === 'm');
  let meta = DATA[mode];
  if (!meta) { goStatic(); return; }
  let base = `/intro/${mode}/`;
  let frames = new Array(meta.n);

  function loadFrames() {
    frames = new Array(meta.n);
    let next = 0, active = 0;
    const order = [], seen = new Set(), push = (i) => { if (i < meta.n && !seen.has(i)) { seen.add(i); order.push(i); } };
    // önce baştaki kareler sırayla, sonra her 8. kare (hızlı kaydırmada kaba önizleme), sonra kalanlar
    for (let i = 0; i < 12; i++) push(i);
    for (let st = 8; st >= 1; st >>= 1) for (let i = 0; i < meta.n; i += st) push(i);
    const want = mode;
    const decode = (url) => fetch(url).then((r) => { if (!r.ok) throw 0; return r.blob(); })
      .then((b) => ('createImageBitmap' in window ? createImageBitmap(b) : new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(b); })));
    const pump = () => {
      while (active < 4 && next < order.length) {
        const i = order[next++]; active++;
        decode(`${base}f_${String(i).padStart(3, '0')}.webp?v=${meta.v}`).then((bmp) => {
          if (want !== mode) return;
          frames[i] = bmp;
          if (i === 0) intro.classList.add('ready');
          const cf = Math.round(cur * (meta.n - 1));
          if (Math.abs(cf - i) <= 1) { dirty = true; wake(); }
        }).catch(() => {}).finally(() => { active--; pump(); });
      }
    };
    pump();
  }

  /* ---------- çizim ---------- */
  let VW = 1, VH = 1, fit = { s: 1, ox: 0, oy: 0 }, lastDraw = '';
  function nearest(i) {
    if (frames[i]) return i;
    for (let d = 1; d < meta.n; d++) { if (frames[i - d]) return i - d; if (frames[i + d]) return i + d; }
    return -1;
  }
  function draw(p) {
    const fi = p * (meta.n - 1), a = Math.floor(fi), b = Math.min(meta.n - 1, a + 1);
    const t = Math.round((fi - a) * 8) / 8;       // geçişi 8 adımla sınırla: gereksiz yeniden çizim yok
    const ia = nearest(a);
    if (ia < 0) return;
    const key = ia + ':' + (frames[b] && ia === a ? t : 0);
    if (key === lastDraw) return;
    lastDraw = key;
    ctx.globalAlpha = 1;
    ctx.drawImage(frames[ia], 0, 0);
    if (t > 0 && frames[b] && ia === a) {   // iki kare arasında yumuşak geçiş
      ctx.globalAlpha = t;
      ctx.drawImage(frames[b], 0, 0);
      ctx.globalAlpha = 1;
    }
  }
  function anchor(p, key) {
    const A = meta.anchors, fi = p * (meta.n - 1), a = Math.floor(fi), b = Math.min(meta.n - 1, a + 1), t = fi - a;
    const pa = A[a][key], pb = A[b][key];
    if (!pa[2] || !pb[2]) return null;
    const x = pa[0] + (pb[0] - pa[0]) * t, y = pa[1] + (pb[1] - pa[1]) * t;
    return [fit.ox + x * meta.w * fit.s, fit.oy + y * meta.h * fit.s];
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
  let isMob = false;
  const size = new Map();
  const measure = () => [L.l1, L.l2].forEach((n) => size.set(n, [n.offsetWidth, n.offsetHeight]));
  function callout(node, c, key, p, oArrow, draw_, oText, pos) {
    node.style.opacity = oText.toFixed(3);
    node.style.visibility = oText < 0.01 ? 'hidden' : 'visible';
    node.style.setProperty('--ty', ((1 - sm(0, 1, oText)) * 105).toFixed(1) + '%');
    c.g.style.opacity = oArrow.toFixed(3);
    if (oArrow < 0.01 && oText < 0.01) return;
    const P = isMob ? pos.m : pos.d;
    const [nw, nh] = size.get(node) || [0, 0];
    let lx = P[0] * VW; if (rtl) lx = VW - lx - nw;
    node.style.transform = `translate3d(${fx(lx)}px,${fx(P[1] * VH)}px,0)`;
    const tp = anchor(p, key);
    if (!tp) { c.g.style.opacity = 0; return; }
    const [tx, ty] = tp;
    const vis = sm(-0.04, 0.04, tx / VW) * sm(1.04, 0.96, tx / VW) * sm(-0.04, 0.04, ty / VH) * sm(1.04, 0.96, ty / VH);
    c.g.style.opacity = (oArrow * vis).toFixed(3);
    if (vis < 0.01) return;
    const rl = lx, rt = P[1] * VH, rw = nw, rh = nh, rr = rl + rw, rb = rt + rh, stub = 34;
    let sx, sy, ex, ey;
    if (tx < rl - 24) { sx = rl - 16; sy = rt + rh * 0.62; ex = sx - stub; ey = sy; }
    else if (tx > rr + 24) { sx = rr + 16; sy = rt + rh * 0.62; ex = sx + stub; ey = sy; }
    else if (ty > rb) { sx = Math.min(Math.max(tx, rl), rr); sy = rb + 14; ex = sx; ey = sy + stub; }
    else { sx = Math.min(Math.max(tx, rl), rr); sy = rt - 14; ex = sx; ey = sy - stub; }
    const dx = tx - ex, dy = ty - ey, L2 = Math.hypot(dx, dy) || 1, ux = dx / L2, uy = dy / L2, gap = 12;
    const qx = tx - ux * gap, qy = ty - uy * gap, L1 = Math.hypot(ex - sx, ey - sy), Lb = Math.max(1, L2 - gap), d = draw_ * (L1 + Lb);
    let path = `M${fx(sx)},${fx(sy)}`;
    if (d <= L1) { const k = d / L1; path += ` L${fx(sx + (ex - sx) * k)},${fx(sy + (ey - sy) * k)}`; }
    else { const k = (d - L1) / Lb; path += ` L${fx(ex)},${fx(ey)} L${fx(ex + (qx - ex) * k)},${fx(ey + (qy - ey) * k)}`; }
    c.ln.setAttribute('d', path); c.lh.setAttribute('d', path);
    const hv = sm(0.9, 1, draw_), s = 11, bx = qx - ux * s, by = qy - uy * s, nx = -uy * s * 0.5, ny = ux * s * 0.5;
    const hd = `M${fx(bx + nx)},${fx(by + ny)} L${fx(qx)},${fx(qy)} L${fx(bx - nx)},${fx(by - ny)}`;
    c.hd.setAttribute('d', hd); c.hh.setAttribute('d', hd); c.hh.style.opacity = hv;
    c.hd.style.opacity = hv; c.tg.style.opacity = hv;
    c.ring.setAttribute('cx', fx(tx)); c.ring.setAttribute('cy', fx(ty)); c.dot.setAttribute('cx', fx(tx)); c.dot.setAttribute('cy', fx(ty));
  }
  let lastIdx = -1;
  function overlay(p) {
    const o = 1 - sm(0.01, 0.06, p);
    L.hero.style.opacity = o.toFixed(3); L.hero.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    L.hero.style.translate = `0 ${fx(-(1 - o) * 24)}px`;
    callout(L.l1, C1, isMob ? 'a1m' : 'a1d', p, band(p, 0.30, 0.47, 0.012), sm(0.30, 0.36, p), band(p, 0.385, 0.47), { d: [0.56, 0.15], m: [0.07, 0.15] });
    callout(L.l2, C2, 'a2', p, band(p, 0.63, 0.79, 0.012), sm(0.63, 0.69, p), band(p, 0.715, 0.79), { d: [0.08, 0.15], m: [0.07, 0.14] });
    const oo = sm(0.9, 0.96, p);
    L.out.style.opacity = oo.toFixed(3); L.out.style.translate = `0 ${fx((1 - oo) * 18)}px`;
    const idx = p < 0.28 ? 0 : p < 0.56 ? 1 : p < 0.86 ? 2 : 3;
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
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    cur += (target - cur) * (1 - Math.exp(-dt * 12));
    if (Math.abs(target - cur) < 0.0002) cur = target;
    draw(cur); overlay(cur);
    if (cur !== target || dirty) { dirty = false; raf = requestAnimationFrame(frame); }
  }
  let lw = 0, lh = 0;
  function resize(force) {
    const w = intro.clientWidth, h = window.innerHeight;
    if (!force && w === lw && Math.abs(h - lh) < 140) return;
    lw = w; lh = h; VW = w; VH = h; isMob = w < 700 || w / h < 1;
    const m2 = pick();
    if (m2 !== mode && DATA[m2]) { mode = m2; meta = DATA[mode]; base = `/intro/${mode}/`; intro.classList.toggle('mobile', mode === 'm'); loadFrames(); }
    if (canvas.width !== meta.w || canvas.height !== meta.h) { canvas.width = meta.w; canvas.height = meta.h; lastDraw = ''; }
    const s = Math.max(w / meta.w, h / meta.h);   // tuval CSS ile "cover" ölçeklenir
    fit = { s, ox: (w - meta.w * s) / 2, oy: (h - meta.h * s) / 2 };
    measure();
    dirty = true; wake();
  }
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => resize(false));
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) wake(); }).observe(intro);
  mqReduce.addEventListener && mqReduce.addEventListener('change', (ev) => { if (ev.matches) goStatic(); });
  loadFrames();
  resize(true); readScroll(); cur = target;
  document.fonts && document.fonts.ready.then(() => { measure(); dirty = true; wake(); });
  document.dispatchEvent(new CustomEvent('bp:intro-ready'));
})();
