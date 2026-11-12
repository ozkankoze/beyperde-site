/* Teklif formları: Hızlı teklif (WhatsApp'a yönlendirir) ve Detaylı teklif (/api/teklif).
   Sunucu yapılandırılmamışsa başarı mesajı gösterilmez; kullanıcı WhatsApp'a yönlendirilir. */
(() => {
  'use strict';
  const BP = window.BP || {};
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = BP.wa || '905535962614';

  const phoneOk = (v) => { const n = v.replace(/[^\d+]/g, ''); const digits = n.replace(/\D/g, ''); return digits.length >= 10 && digits.length <= 15; };
  const emailOk = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function setErr(input, msg) {
    const field = input.closest('.field');
    const out = field && $('.ferr', field);
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (out) { out.textContent = msg; out.hidden = false; if (!out.id) out.id = input.id + '-err'; input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), out.id].filter(Boolean).join(' ').replace(/\s+/g, ' ')); }
    } else {
      input.removeAttribute('aria-invalid');
      if (out) { out.hidden = true; out.textContent = ''; }
    }
  }
  function check(input) {
    const v = (input.value || '').trim();
    let msg = '';
    if (input.type === 'checkbox') msg = input.required && !input.checked ? input.dataset.err : '';
    else if (input.hasAttribute('data-phone')) msg = !phoneOk(v) ? input.dataset.err : '';
    else if (input.type === 'email') msg = !emailOk(v) ? input.dataset.err : '';
    else if (input.required) msg = v.length < (+input.getAttribute('minlength') || 1) ? input.dataset.err : '';
    setErr(input, msg);
    return !msg;
  }
  function validate(form) {
    const inputs = $$('input[data-err]:not([type=file]),select[data-err],textarea[data-err]', form);
    const bad = inputs.filter((i) => !check(i));
    const sum = $('.fsummary', form);
    if (sum) { sum.hidden = !bad.length; sum.textContent = bad.length ? sum.dataset.summary : ''; }
    if (bad.length) bad[0].focus();
    return !bad.length;
  }
  function waUrl(text) { return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`; }

  $$('[data-quote]').forEach((box) => {
    const M = JSON.parse($('template[data-msgs]', box).content.textContent);
    const tabs = $$('[data-tab]', box);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    function select(i, focus) {
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', i === j); t.tabIndex = i === j ? 0 : -1; panels[j].hidden = i !== j; });
      if (focus) tabs[i].focus();
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (ev) => {
        const rtl = document.documentElement.dir === 'rtl';
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { ev.preventDefault(); const dir = (ev.key === 'ArrowRight') !== rtl ? 1 : -1; select((i + dir + tabs.length) % tabs.length, true); }
      });
    });
    if (location.hash === '#detayli') select(1);

    $$('input,select,textarea', box).forEach((i) => {
      i.addEventListener('blur', () => { if (i.dataset.err && i.value) check(i); });
      i.addEventListener('input', () => { if (i.getAttribute('aria-invalid') === 'true') check(i); });
    });

    const nameOf = (sel) => { const o = sel.options[sel.selectedIndex]; return sel.value ? o.textContent : ''; };

    /* --- hızlı teklif --- */
    const quick = $('[data-form="quick"]', box);
    quick.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!validate(quick)) return;
      const f = quick.elements;
      const lines = [M.wa_intro, `${M.name}: ${f.ad.value.trim()}`, `${M.phone}: ${f.tel.value.trim()}`];
      const p = nameOf(f.urun); if (p) lines.push(`${M.product}: ${p}`);
      const a = document.createElement('a');
      a.href = waUrl(lines.join('\n')); a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    });

    /* --- detaylı teklif --- */
    const det = $('[data-form="detail"]', box);
    det.elements.t.value = String(Date.now());
    const fileIn = $('input[type=file]', det);
    const prev = $('.thumbs-prev', det);
    let photos = [];   // {name, type, data(base64), url}
    async function shrink(file) {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
        const max = 1600, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const data = c.toDataURL('image/jpeg', 0.8);
        return { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', data: data.split(',')[1], url: data };
      } finally { URL.revokeObjectURL(url); }
    }
    function drawThumbs() {
      prev.innerHTML = '';
      photos.forEach((p, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<img src="${p.url}" alt=""><button type="button" aria-label="${p.name} ✕">×</button>`;
        li.querySelector('button').addEventListener('click', () => { photos.splice(i, 1); drawThumbs(); });
        prev.appendChild(li);
      });
    }
    fileIn && fileIn.addEventListener('change', async () => {
      const files = [...fileIn.files];
      setErr(fileIn, '');
      if (photos.length + files.length > (+fileIn.dataset.max || 4)) { setErr(fileIn, fileIn.dataset.err); fileIn.value = ''; return; }
      for (const f of files) {
        if (!/^image\//.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) { setErr(fileIn, fileIn.dataset.errType); continue; }
        try { photos.push(await shrink(f)); } catch (_) { setErr(fileIn, fileIn.dataset.errType); }
      }
      fileIn.value = ''; drawThumbs();
    });

    const status = $('.fstatus', det);
    function show(kind, msg, waFallback) {
      status.className = 'fstatus ' + kind;
      status.textContent = msg;
      if (waFallback) {
        const f = det.elements;
        const lines = [M.wa_intro, `${M.name}: ${f.ad.value.trim()}`, `${M.phone}: ${f.tel.value.trim()}`];
        if (f.eposta.value) lines.push(`${M.email}: ${f.eposta.value.trim()}`);
        lines.push(`${M.space}: ${f.mekan.value}`);
        const p = nameOf(f.urun); if (p) lines.push(`${M.product}: ${p}`);
        if (f.pencere.value) lines.push(`${M.windows}: ${f.pencere.value}`);
        if (f.olcu.value) lines.push(`${M.sizes}: ${f.olcu.value.trim()}`);
        if (f.not.value) lines.push(`${M.message}: ${f.not.value.trim()}`);
        const a = document.createElement('a');
        a.className = 'btn btn-wa'; a.href = waUrl(lines.join('\n')); a.target = '_blank'; a.rel = 'noopener'; a.textContent = M.to_whatsapp;
        status.appendChild(document.createElement('br')); status.appendChild(a);
      }
      status.focus && status.setAttribute('tabindex', '-1'); status.focus();
    }
    det.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (!validate(det)) return;
      const btn = $('button[type=submit]', det), label = btn.textContent;
      btn.disabled = true; btn.textContent = btn.dataset.sending;
      const f = det.elements;
      const body = {
        ad: f.ad.value.trim(), tel: f.tel.value.trim(), eposta: f.eposta.value.trim(), mekan: f.mekan.value,
        urun: f.urun.value, urun_adi: nameOf(f.urun), pencere: f.pencere.value, olcu: f.olcu.value.trim(), not: f.not.value.trim(),
        kvkk: f.kvkk.checked, lang: f.lang.value, t: +f.t.value, website: f.website.value, sayfa: location.pathname,
        foto: photos.map((p) => ({ name: p.name, type: p.type, data: p.data })),
      };
      try {
        const r = await fetch('/api/teklif', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        let j = {}; try { j = await r.json(); } catch (_) { /* boş yanıt */ }
        if (r.ok && j.ok) { show('ok', M.ok_detail); det.reset(); photos = []; drawThumbs(); det.elements.t.value = String(Date.now()); }
        else if (r.status === 503 || j.error === 'not_configured' || r.status === 404 || r.status === 405) show('err', M.err_unconfigured, true);
        else show('err', M.err_server, true);
      } catch (_) { show('err', M.err_network, true); }
      finally { btn.disabled = false; btn.textContent = label; }
    });
  });
})();
