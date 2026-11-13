/* Journal: kategori süzgeci (?kategori= ile paylaşılabilir), okuma ilerleme çizgisi, bağlantı kopyalama, belirme. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* kategori süzgeci */
  const grid = document.querySelector('[data-jgrid]');
  const btns = [...document.querySelectorAll('[data-cat-btn]')];
  const feat = document.querySelector('.jfeat-s');
  if (grid && btns.length) {
    const cards = [...grid.children];
    const apply = (cat, push) => {
      if (cat && !btns.some((b) => b.dataset.catBtn === cat)) cat = '';
      btns.forEach((b) => (b.dataset.catBtn === cat ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      cards.forEach((c) => {
        const show = cat ? c.dataset.cat === cat : !c.classList.contains('is-feat');
        c.hidden = !show;
        if (show && !reduce) { c.classList.remove('jin'); void c.offsetWidth; c.classList.add('jin'); }
      });
      if (feat) feat.hidden = !!cat;
      if (push) {
        const u = new URL(location.href);
        cat ? u.searchParams.set('kategori', cat) : u.searchParams.delete('kategori');
        history.replaceState(null, '', u);
      }
    };
    btns.forEach((b) => b.addEventListener('click', (ev) => { ev.preventDefault(); apply(b.dataset.catBtn, true); }));
    const q = new URLSearchParams(location.search).get('kategori');
    if (q) apply(q, false);
  }

  /* okuma ilerleme çizgisi: yalnızca transform, kaydırmada rAF ile */
  const bar = document.querySelector('[data-prog]');
  const art = document.querySelector('.jprose');
  if (bar && art) {
    let ticking = false;
    const upd = () => {
      ticking = false;
      const r = art.getBoundingClientRect();
      const total = r.height - innerHeight * 0.6;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd);
    upd();
  }

  /* bağlantıyı kopyala */
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const span = b.querySelector('span'); const orig = span.textContent;
    const status = b.parentElement.querySelector('[data-copy-status],[data-copy-status-2]');
    try { await navigator.clipboard.writeText(b.dataset.copy); }
    catch (_) { const t = document.createElement('textarea'); t.value = b.dataset.copy; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (__) { /* yok */ } t.remove(); }
    span.textContent = b.dataset.done; if (status) status.textContent = b.dataset.done;
    setTimeout(() => { span.textContent = orig; }, 1800);
  }));

  /* içindekiler: okunan bölümü işaretle */
  const toc = [...document.querySelectorAll('.jtoc a')];
  if (toc.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => en.forEach((e) => {
      if (e.isIntersecting) toc.forEach((a) => (a.getAttribute('href') === '#' + e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }), { rootMargin: '-20% 0px -70% 0px' });
    toc.forEach((a) => { const h = document.getElementById(a.getAttribute('href').slice(1)); if (h) io.observe(h); });
  }
})();
