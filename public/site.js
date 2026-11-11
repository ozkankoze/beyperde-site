(() => {
  const hdr = document.querySelector('.site-header');
  const intro = document.getElementById('giris');
  function solid() {
    if (!hdr) return;
    let on = true;
    if (intro) on = intro.getBoundingClientRect().bottom < 80;
    hdr.classList.toggle('solid', on);
  }
  addEventListener('scroll', solid, { passive: true }); addEventListener('resize', solid); solid();

  const mb = document.querySelector('.menu-btn'), nav = document.querySelector('.site-nav');
  if (mb && nav) {
    mb.addEventListener('click', () => { const o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); mb.textContent = o ? 'Kapat' : 'Menü'; });
    nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', false); mb.textContent = 'Menü'; } });
  }

  // prototipte olmayan sayfalar
  let noteT;
  function note(msg) {
    let n = document.querySelector('.proto-note');
    if (!n) { n = document.createElement('div'); n.className = 'proto-note'; n.setAttribute('role', 'status'); document.body.appendChild(n); }
    n.textContent = msg; n.hidden = false; clearTimeout(noteT); noteT = setTimeout(() => n.hidden = true, 2800);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-proto]');
    if (a) { e.preventDefault(); note('“' + a.textContent.trim() + '” sayfası prototipte yok; şablonu Rustik Perde ile aynı olacak.'); }
  });

  // lightbox
  const groups = {};
  document.querySelectorAll('[data-lb]').forEach(el => { (groups[el.dataset.lb] ||= []).push(el); });
  let lb, cur, list;
  function show(i) {
    cur = (i + list.length) % list.length; const el = list[cur]; const img = el.querySelector('img');
    lb.querySelector('img').src = img.currentSrc || img.src; lb.querySelector('img').alt = img.alt;
    lb.querySelector('figcaption').textContent = el.dataset.cap || img.alt || '';
  }
  function open(el) {
    list = groups[el.dataset.lb];
    if (!lb) {
      lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Fotoğraf');
      lb.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><button class="x" aria-label="Kapat">✕</button><button class="pv" aria-label="Önceki">←</button><button class="nx" aria-label="Sonraki">→</button>';
      document.body.appendChild(lb);
      lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.x')) close(); if (e.target.closest('.pv')) show(cur - 1); if (e.target.closest('.nx')) show(cur + 1); });
      addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    }
    lb.hidden = false; document.body.style.overflow = 'hidden'; show(list.indexOf(el)); lb.querySelector('.x').focus();
  }
  function close() { lb.hidden = true; document.body.style.overflow = ''; }
  document.addEventListener('click', e => { const el = e.target.closest('[data-lb]'); if (el) { e.preventDefault(); open(el); } });

  // teklif formu
  document.querySelectorAll('form[data-quote]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    const out = f.querySelector('.form-status');
    out.textContent = 'Teşekkürler. Prototipte form gönderilmiyor; canlı sitede bu istek e-posta ve WhatsApp ile ekibe iletilecek.';
  }));
})();
