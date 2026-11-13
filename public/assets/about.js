/* Hakkımızda: bölümler görünür alana girince hafifçe belirir; zaman çizelgesi çizgisi ilerler. */
(() => {
  'use strict';
  const els = document.querySelectorAll('.ab [data-rv], .ab [data-tl]');
  if (!els.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((en) => en.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  els.forEach((el) => io.observe(el));
})();
