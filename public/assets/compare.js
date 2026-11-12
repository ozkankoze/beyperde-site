/* Öncesi / sonrası karşılaştırma sürgüsü: fare, dokunmatik ve klavye (ok tuşları) ile çalışır. */
(() => {
  'use strict';
  document.querySelectorAll('[data-compare]').forEach((fig) => {
    const box = fig.querySelector('.cmp-box'), range = fig.querySelector('.cmp-range');
    const rtl = document.documentElement.dir === 'rtl';
    const set = (v) => { v = Math.max(0, Math.min(100, v)); range.value = v; box.style.setProperty('--p', v + '%'); range.setAttribute('aria-valuetext', Math.round(v) + '%'); };
    range.addEventListener('input', () => set(+range.value));
    let drag = false;
    const pos = (x) => { const r = box.getBoundingClientRect(); let v = (x - r.left) / r.width * 100; if (rtl) v = 100 - v; set(v); };
    box.addEventListener('pointerdown', (e) => { drag = true; box.setPointerCapture(e.pointerId); pos(e.clientX); });
    box.addEventListener('pointermove', (e) => { if (drag) pos(e.clientX); });
    box.addEventListener('pointerup', () => { drag = false; });
    box.addEventListener('pointercancel', () => { drag = false; });
    set(50);
  });
})();
