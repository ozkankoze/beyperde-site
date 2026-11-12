/* Bey Perde — ortak davranışlar: başlık, mobil menü, galeri görüntüleyici, görsel değiştirme,
   WhatsApp düğmesi, çerez bildirimi, içindekiler vurgusu. Bağımlılık yok. */
(() => {
  'use strict';
  const d = document, html = d.documentElement, BP = window.BP || {};
  const rtl = html.dir === 'rtl';
  const $ = (s, r = d) => r.querySelector(s), $$ = (s, r = d) => [...r.querySelectorAll(s)];

  /* ---------- başlık ---------- */
  const hdr = $('[data-header]');
  const intro = $('[data-intro]');
  const hero = $('.pj-hero');
  const wa = $('[data-wa-float]');
  let lastY = scrollY, ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY;
    if (hdr) {
      let solid = true;
      if (intro) solid = intro.getBoundingClientRect().bottom < 90;
      else if (hero) solid = hero.getBoundingClientRect().bottom < 90;
      hdr.classList.toggle('solid', solid);
      // içerikte aşağı inerken gizle, yukarı çıkınca göster
      const hide = solid && y > lastY + 4 && y > 600 && !d.body.classList.contains('locked');
      if (hide) hdr.classList.add('hide'); else if (y < lastY - 4 || y < 600) hdr.classList.remove('hide');
    }
    if (wa) {
      let off = false;
      if (intro && !intro.classList.contains('static')) { const r = intro.getBoundingClientRect(); off = r.bottom > innerHeight * 1.2 && -r.top < innerHeight * 0.4; }
      const foot = $('.site-footer');
      if (foot && foot.getBoundingClientRect().top < innerHeight - 40) off = true;
      wa.classList.toggle('off', off);
    }
    lastY = y;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();
  d.addEventListener('bp:intro-static', onScroll);

  /* ---------- odak tuzağı ---------- */
  function trap(el, ev) {
    if (ev.key !== 'Tab') return;
    const f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', el).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && d.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && d.activeElement === last) { ev.preventDefault(); first.focus(); }
  }
  function lock(on) { d.body.classList.toggle('locked', on); }

  /* ---------- mobil menü ---------- */
  const mm = $('#mmenu'), mOpen = $('[data-menu-open]');
  if (mm && mOpen) {
    const close = () => { mm.hidden = true; mOpen.setAttribute('aria-expanded', 'false'); lock(false); mOpen.focus(); };
    mOpen.addEventListener('click', () => { mm.hidden = false; mOpen.setAttribute('aria-expanded', 'true'); lock(true); $('[data-menu-close]', mm).focus(); });
    $('[data-menu-close]', mm).addEventListener('click', close);
    mm.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') close(); trap(mm, ev); });
    mm.addEventListener('click', (ev) => { const a = ev.target.closest('a'); if (a && a.getAttribute('href').includes('#')) close(); });
    matchMedia('(min-width: 1141px)').addEventListener('change', (e) => { if (e.matches && !mm.hidden) close(); });
  }

  /* ---------- görsel değiştirme (rustik başlıkları, ürün küçük resimleri) ---------- */
  $$('[data-swap]').forEach((wrap) => {
    const root = wrap.closest('.feat-grid, .viewer') || wrap;
    const main = $('.swap-img', root);
    if (!main) return;
    const pic = main.closest('picture');
    const link = main.closest('a');
    $$('[data-swap-src]', wrap).forEach((b) => b.addEventListener('click', () => {
      $$('[data-swap-src]', wrap).forEach((x) => x.setAttribute('aria-pressed', x === b));
      const srcs = $$('source', b);
      main.classList.add('fading');
      setTimeout(() => {
        $$('source', pic).forEach((s, i) => { if (srcs[i]) s.srcset = srcs[i].srcset; });
        main.src = b.dataset.swapSrc; main.alt = b.dataset.swapAlt || '';
        if (link) link.href = b.dataset.swapSrc;
        const done = () => main.classList.remove('fading');
        if (main.complete) requestAnimationFrame(done); else main.addEventListener('load', done, { once: true });
      }, 220);
    }));
  });

  /* ---------- galeri görüntüleyici ---------- */
  const T = {
    tr: { close: 'Kapat', prev: 'Önceki', next: 'Sonraki', photo: 'Fotoğraf' },
    en: { close: 'Close', prev: 'Previous', next: 'Next', photo: 'Photograph' },
    ar: { close: 'إغلاق', prev: 'السابق', next: 'التالي', photo: 'صورة' },
  }[BP.lang || 'tr'];
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let lb, list = [], cur = 0, opener = null;
  function build() {
    lb = d.createElement('div');
    lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', T.photo);
    lb.innerHTML = `<div class="lb-top"><span class="lb-n" aria-live="polite"></span><button class="icon-btn lb-x" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span class="sr">${T.close}</span></button></div>
      <div class="lb-fig"><img alt=""></div><p class="lb-cap"></p>
      <button class="lb-nav lb-prev" type="button" aria-label="${T.prev}">${arrow}</button><button class="lb-nav lb-next" type="button" aria-label="${T.next}">${arrow}</button>`;
    d.body.appendChild(lb);
    lb.addEventListener('click', (ev) => {
      if (ev.target.closest('.lb-x') || ev.target === lb || ev.target.classList.contains('lb-fig')) close();
      else if (ev.target.closest('.lb-prev')) show(cur - 1);
      else if (ev.target.closest('.lb-next')) show(cur + 1);
    });
    lb.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') close();
      else if (ev.key === 'ArrowRight') show(cur + (rtl ? -1 : 1));
      else if (ev.key === 'ArrowLeft') show(cur + (rtl ? 1 : -1));
      trap(lb, ev);
    });
    let sx = null;
    const fig = $('.lb-fig', lb);
    fig.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    fig.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + ((dx < 0) !== rtl ? 1 : -1)); sx = null; });
  }
  function show(i) {
    cur = (i + list.length) % list.length;
    const a = list[cur], img = $('img', a);
    const im = $('.lb-fig img', lb);
    im.src = a.getAttribute('href'); im.alt = (img && img.alt) || '';
    $('.lb-cap', lb).textContent = a.dataset.cap || (img && img.alt) || '';
    $('.lb-n', lb).textContent = list.length > 1 ? `${cur + 1} / ${list.length}` : '';
    $$('.lb-nav', lb).forEach((b) => { b.hidden = list.length < 2; });
  }
  function open(a) {
    if (!lb) build();
    list = $$(`[data-lb="${a.dataset.lb}"]`).filter((x) => !x.closest('[hidden]'));
    opener = a; lb.hidden = false; lock(true); show(list.indexOf(a)); $('.lb-x', lb).focus();
  }
  function close() { lb.hidden = true; lock(false); if (opener) opener.focus({ preventScroll: true }); }
  d.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-lb]');
    if (a) { ev.preventDefault(); open(a); return; }
    const p = ev.target.closest('[data-lb-proxy]');
    if (p) {
      ev.preventDefault();
      const href = p.getAttribute('href');
      const t = $$('[data-lb]').find((x) => x.getAttribute('href') === href);
      if (t) open(t); else { if (!lb) build(); list = [p]; p.dataset.lb = '_'; opener = p; lb.hidden = false; lock(true); show(0); }
    }
  });

  /* ---------- içindekiler vurgusu ---------- */
  const toc = $$('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) toc.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
    toc.forEach((a) => { const t = d.getElementById(a.getAttribute('href').slice(1)); if (t) io.observe(t); });
  }

  /* ---------- çerez bildirimi ve izin yönetimi ---------- */
  const KEY = 'bp-consent';
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } };
  const set = (v) => { try { localStorage.setItem(KEY, JSON.stringify({ v, t: Date.now() })); } catch (_) { /* depolama kapalı */ } };
  const ck = $('[data-cookie]');
  const analytics = !!(BP.consent && BP.consent.analytics);   // istatistik eklenene kadar false
  if (ck && !get()) {
    // bildirimi ilk kaydırmadan sonra göster: açılış görselinin üstünü kapatmasın
    const showCk = () => { ck.hidden = false; removeEventListener('scroll', onFirst); };
    const onFirst = () => { if (scrollY > 240) showCk(); };
    addEventListener('scroll', onFirst, { passive: true });
    setTimeout(() => { if (!intro) showCk(); }, 2500);
    $('[data-cookie-ok]', ck).addEventListener('click', () => { set('necessary'); ck.hidden = true; });
  }
  const mgr = $('[data-consent-manage]');
  if (mgr) {
    const st = $('[data-consent-state]', mgr);
    const render = () => { const c = get(); st.textContent = analytics ? (c && c.v === 'all' ? 'Durum: istatistik çerezlerine izin verildi.' : 'Durum: yalnızca zorunlu depolama.') : 'Durum: sitede yalnızca zorunlu depolama kullanılıyor; değiştirilecek bir tercih yok.'; };
    $$('[data-consent]', mgr).forEach((b) => { if (b.dataset.consent === 'all') b.hidden = !analytics; b.addEventListener('click', () => { set(b.dataset.consent); render(); if (ck) ck.hidden = true; }); });
    render();
  }
  // İstatistik kodu eklenirse yalnızca izin varsa yükleyin:
  // if (analytics && (get() || {}).v === 'all') { /* analitik betiğini burada yükleyin */ }
})();
