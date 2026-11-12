/* Odanıza uygun perdeyi bulun: dört soru, puanlamayla ürün önerisi. */
(() => {
  'use strict';
  document.querySelectorAll('[data-quiz]').forEach((form) => {
    const data = JSON.parse(form.querySelector('[data-q-data]').textContent);
    const steps = [...form.querySelectorAll('.qstep')];
    const back = form.querySelector('[data-q-back]');
    const res = form.querySelector('[data-q-result]');
    const bar = form.querySelector('.qprog span');
    const list = res.querySelector('.qres-list');
    const cat = res.querySelector('[data-q-catalog]');
    let i = 0;
    const answers = {};
    function go(n) {
      i = n;
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      res.hidden = i < steps.length;
      back.hidden = i === 0 || i >= steps.length;
      bar.style.transform = `scaleX(${Math.min(i, steps.length) / steps.length})`;
      if (i < steps.length) { const first = steps[i].querySelector('input:checked') || steps[i].querySelector('input'); first && first.focus({ preventScroll: true }); }
    }
    function result() {
      const score = {};
      data.scores.forEach(([q, v, m]) => { if (answers[q] === v) for (const p in m) score[p] = (score[p] || 0) + m[p]; });
      const top = Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      list.innerHTML = top.map(([s], k) => {
        const p = data.p[s];
        const img = p.i ? `<img src="${p.i}" alt="" loading="lazy" width="84" height="84">` : '<span class="ph-swatch" aria-hidden="true"></span>';
        return `<li><a href="${p.u}">${img}<span>${k === 0 ? `<span class="qr-m">${data.t.match}</span>` : ''}<span class="qr-t">${p.n}</span><span class="qr-d">${p.d}</span></span>${arrow}</a></li>`;
      }).join('');
      const colors = data.colors[answers.color] || [];
      const types = top.map(([s]) => s);
      cat.href = `${data.cat}?type=${types.join(',')}${colors.length ? '&color=' + colors.join(',') : ''}`;
      go(steps.length);
      res.focus({ preventScroll: true });
    }
    form.addEventListener('change', (ev) => {
      const inp = ev.target; if (inp.type !== 'radio') return;
      answers[inp.name] = inp.value;
      setTimeout(() => (i < steps.length - 1 ? go(i + 1) : result()), 260);
    });
    back.addEventListener('click', () => go(Math.max(0, i - 1)));
    res.querySelector('[data-q-restart]').addEventListener('click', () => { form.reset(); for (const k in answers) delete answers[k]; go(0); });
    form.addEventListener('submit', (ev) => ev.preventDefault());
    go(0);
  });
})();
