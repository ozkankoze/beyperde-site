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
  // Büyük/retina ekranda 2K, diğerlerinde 1080p sürüm (görüntü ekranı kaplayacak genişlikte piksele göre seçilir)
  const needPx = Math.max(innerWidth, innerHeight * 16 / 9) * Math.min(devicePixelRatio || 1, 2);
  const SRC = (vid.dataset.srcHd && needPx > 2100) ? vid.dataset.srcHd : vid.dataset.src, DUR = parseFloat(vid.dataset.dur) || 15;
  let ready = false;
  // Video (≈6 MB) sayfa açılışını yavaşlatmasın: ilk etkileşimde ya da sayfa yüklendikten sonra boşta indirilir.
  // O ana kadar videonun ilk karesiyle aynı olan statik görsel görünür.
  let started = false;
  const EV = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'];
  function start() {
    if (started) return; started = true;
    EV.forEach((t) => removeEventListener(t, start, { passive: true }));
    fetch(SRC).then((r) => { if (!r.ok) throw 0; return r.blob(); })
      .then((b) => URL.createObjectURL(b))
      .catch(() => SRC)
      .then((url) => {
        vid.addEventListener('loadeddata', () => { ready = true; intro.classList.add('ready'); dirty = true; wake(); }, { once: true });
        vid.addEventListener('error', goStatic, { once: true });
        vid.preload = 'auto'; vid.src = url; vid.load();
      });
  }
  EV.forEach((t) => addEventListener(t, start, { passive: true }));
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1));
  const later = () => setTimeout(() => idle(start, { timeout: 2000 }), 2500);
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });

  // Ürün hedeflerinin videodaki konumu: [saniye, x, y] (0..1). Kamera ilerlediği için zamanla değişir.
  const KEYS = {
    // Okların başladığı halka ekranda sabit durur (kamera hareketiyle oynamaz); nokta, bölüm boyunca
    // hep ürünün üstünde kalacak şekilde seçildi.
    a1: [[0, 0.2, 0.42]],    // duvar kağıdı
    a2: [[0, 0.935, 0.42]],  // sağdaki kalın rustik fon perde
  };
  function keyAt(keys, t) {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, x0, y0] = keys[i - 1], [t1, x1, y1] = keys[i], k = (t - t0) / (t1 - t0); return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]; }
    return keys[keys.length - 1].slice(1);
  }

  /* ---------- metin ve oklar ---------- */
  // Stil/özellik yazımlarını önbellekle: değer değişmediyse DOM'a dokunma (gereksiz yeniden çizim videonun kare atlamasına yol açıyordu)
  const _c = new WeakMap();
  const memo = (el) => { let m = _c.get(el); if (!m) _c.set(el, m = {}); return m; };
  const st = (el, k, v) => { const m = memo(el); if (m[k] === v) return; m[k] = v; if (k[0] === '-') el.style.setProperty(k, v); else el.style[k] = v; };
  const sa = (el, k, v) => { const m = memo(el); const kk = '@' + k; if (m[kk] === v) return; m[kk] = v; el.setAttribute(k, v); };
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
    st(node, 'opacity', String(oText.toFixed(3)));
    st(node, 'visibility', String(oText < 0.01 ? 'hidden' : 'visible'));
    st(node, '--ty', ((1 - sm(0, 1, oText)) * 105).toFixed(1) + '%');
    st(c.g, 'opacity', String(oArrow.toFixed(3)));
    if (oArrow < 0.01 && oText < 0.01) return;
    const P = isMob ? S.pos.m : S.pos.d;
    const [nw, nh] = size.get(node) || [0, 0];
    let lx = P[0] * VW; if (rtl) lx = VW - lx - nw;
    st(node, 'transform', String(`translate3d(${fx(lx)}px,${fx(P[1] * VH)}px,0)`));
    const [tx, ty] = anchor(p, S.key);
    const vis = sm(-0.04, 0.04, tx / VW) * sm(1.04, 0.96, tx / VW) * sm(-0.04, 0.04, ty / VH) * sm(1.04, 0.96, ty / VH);
    st(c.g, 'opacity', String((oArrow * vis).toFixed(3)));
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
    sa(c.ln, 'd', String(path)); sa(c.lh, 'd', String(path));
    const hv = sm(0.06, 0.2, draw_), s = 11, bx = hx - hux * s, by = hy - huy * s, nx = -huy * s * 0.5, ny = hux * s * 0.5;
    const hd = `M${fx(bx + nx)},${fx(by + ny)} L${fx(hx)},${fx(hy)} L${fx(bx - nx)},${fx(by - ny)}`;
    sa(c.hd, 'd', String(hd)); sa(c.hh, 'd', String(hd)); st(c.hh, 'opacity', String(hv));
    st(c.hd, 'opacity', String(hv)); st(c.tg, 'opacity', String(sm(0, 0.12, draw_)));
    sa(c.ring, 'cx', String(fx(tx))); sa(c.ring, 'cy', String(fx(ty))); sa(c.dot, 'cx', String(fx(tx))); sa(c.dot, 'cy', String(fx(ty)));
  }
  // dar ekranda video yanlardan kırpılır: işaret edilen ürün ekranda kalsın diye görüntü yatayda kayar
  function pan(p) {
    let want = 0.5;
    [S1, S2].forEach((S) => { const w = Math.min(sm(S.a - 0.08, S.a, p), 1 - sm(S.b, S.b + 0.08, p)); if (w > 0) want = 0.5 + (keyAt(KEYS[S.key], p * DUR)[0] - 0.5) * w * 1.15; });
    panX = clamp(want);
    st(vid, 'objectPosition', String(`${(panX * 100).toFixed(2)}% 50%`));
  }
  let lastIdx = -1;
  function overlay(p) {
    const o = 1 - sm(0.01, 0.06, p);
    st(L.hero, 'opacity', String(o.toFixed(3))); st(L.hero, 'visibility', String(o < 0.01 ? 'hidden' : 'visible'));
    st(L.hero, 'translate', String(`0 ${fx(-(1 - o) * 24)}px`));
    callout(L.l1, C1, S1, p);
    callout(L.l2, C2, S2, p);
    const oo = sm(0.9, 0.96, p);
    st(L.out, 'opacity', String(oo.toFixed(3))); st(L.out, 'translate', String(`0 ${fx((1 - oo) * 18)}px`));
    const idx = p < 0.3 ? 0 : p < 0.62 ? 1 : p < 0.89 ? 2 : 3;
    if (idx !== lastIdx) { railLi.forEach((r, i) => r.classList.toggle('on', i === idx)); lastIdx = idx; }
    st(rail, 'opacity', String(sm(0.03, 0.09, p).toFixed(3)));
    st(bar, 'transform', String(`scaleX(${p.toFixed(3)})`));
    if (skip) { const so = 1 - sm(0.9, 0.97, p); st(skip, 'opacity', String(so.toFixed(3))); st(skip, 'visibility', String(so < 0.02 ? 'hidden' : 'visible')); }
  }

  /* ---------- döngü ---------- */
  let target = 0, cur = 0, visible = true, dirty = true, raf = 0, last = 0;
  // Kaydırma konumu zorunlu düzen hesabı (getBoundingClientRect) yapmadan, önbellekteki ölçülerle okunur
  let top0 = 0, span = 1;
  function geom() { let y = 0, n = intro; while (n) { y += n.offsetTop; n = n.offsetParent; } top0 = y; span = Math.max(1, intro.offsetHeight - innerHeight); }
  function readScroll() { target = clamp((window.scrollY - top0) / span); wake(); }
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
    target = clamp((window.scrollY - top0) / span);
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
    measure(); geom(); readScroll();
    dirty = true; wake();
  }
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => resize(false));
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) wake(); }).observe(intro);
  mqReduce.addEventListener && mqReduce.addEventListener('change', (ev) => { if (ev.matches) goStatic(); });
  resize(true); readScroll(); cur = target;
  document.fonts && document.fonts.ready.then(() => { measure(); geom(); dirty = true; wake(); });
  document.dispatchEvent(new CustomEvent('bp:intro-ready'));
})();
