/* İnteraktif katalog: tür, renk, kumaş, oda, stil ve ışığa göre filtreleme.
   Bir grup içinde seçimler "veya", gruplar arasında "ve" ile birleşir. Durum adres satırında tutulur. */
(() => {
  'use strict';
  const root = document.querySelector('[data-catalog]');
  if (!root) return;
  const form = root.querySelector('[data-filters]');
  const cards = [...root.querySelectorAll('.ccard')];
  const count = root.querySelector('[data-count]');
  const empty = root.querySelector('[data-empty]');
  const openBtn = root.querySelector('[data-filters-open]');
  const activeN = root.querySelector('[data-active-n]');
  const groups = ['type', 'color', 'material', 'room', 'style', 'light'];
  const attr = { type: 'type', color: 'color', material: 'material', room: 'room', style: 'style', light: 'light' };
  const val = (c, g) => (c.dataset[attr[g]] || '').split(' ').filter(Boolean);

  function selected() {
    const s = {};
    groups.forEach((g) => { s[g] = [...form.querySelectorAll(`input[name="${g}"]:checked`)].map((i) => i.value); });
    return s;
  }
  function match(c, s, skip) {
    return groups.every((g) => g === skip || !s[g].length || s[g].some((v) => val(c, g).includes(v)));
  }
  function apply(push) {
    const s = selected();
    let n = 0;
    cards.forEach((c) => { const ok = match(c, s); c.hidden = !ok; if (ok) n++; });
    count.textContent = count.dataset.tpl.replace('{n}', n);
    empty.hidden = n > 0;
    // her seçenek için, diğer filtreler korunarak kaç sonuç kalacağını göster
    form.querySelectorAll('.fchip').forEach((ch) => {
      const inp = ch.querySelector('input'), g = inp.name;
      const k = cards.filter((c) => match(c, s, g) && val(c, g).includes(inp.value)).length;
      ch.querySelector('[data-n]').textContent = k;
      ch.classList.toggle('zero', !k && !inp.checked);
    });
    const total = groups.reduce((a, g) => a + s[g].length, 0);
    activeN.hidden = !total; activeN.textContent = total;
    if (push !== false) {
      const q = new URLSearchParams();
      groups.forEach((g) => { if (s[g].length) q.set(g, s[g].join(',')); });
      const qs = q.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }
  }
  // adres satırından başlangıç durumu
  const q = new URLSearchParams(location.search);
  groups.forEach((g) => (q.get(g) || '').split(',').filter(Boolean).forEach((v) => { const i = form.querySelector(`input[name="${g}"][value="${CSS.escape(v)}"]`); if (i) i.checked = true; }));
  form.addEventListener('change', () => apply());
  form.addEventListener('reset', () => setTimeout(() => apply(), 0));
  apply(false);

  // mobil filtre paneli
  const close = () => { form.classList.remove('open'); openBtn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('locked'); openBtn.focus(); };
  openBtn.addEventListener('click', () => { form.classList.add('open'); openBtn.setAttribute('aria-expanded', 'true'); document.body.classList.add('locked'); form.querySelector('input').focus(); });
  form.querySelectorAll('[data-filters-close]').forEach((b) => b.addEventListener('click', close));
  form.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && form.classList.contains('open')) close(); });
})();
