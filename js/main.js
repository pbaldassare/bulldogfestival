/* Comportamento della pagina: prato delle zampe, contatori, modulo, calendario, condivisione. */
(function () {
  'use strict';
  const CFG = window.BF_CONFIG;
  const API = window.BF_API;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => new Intl.NumberFormat('it-IT').format(n);

  /* ---------- Anteprima ---------- */
  if (CFG.preview) $$('[data-preview-only]').forEach(el => { el.hidden = false; });

  /* ---------- Contatori ---------- */
  function countUp(el, to) {
    if (reduceMotion || to === 0) { el.textContent = fmt(to); return; }
    const dur = 1400, t0 = performance.now();
    (function tick(t) {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(to * e));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  async function renderCounts() {
    const c = await API.getCounts();
    const pct = Math.round((Math.min(c.bulldog || 0, CFG.goal) / CFG.goal) * 100);
    $('.counter--main').style.setProperty('--pct', pct);
    const start = () => {
      $$('[data-count]').forEach(el => countUp(el, c[el.dataset.count] || 0));
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (es.some(e => e.isIntersecting)) { start(); io.disconnect(); }
      }, { threshold: 0.25 });
      io.observe($('.counters'));
    } else start();
  }

  renderCounts();

  /* ---------- Salva la data (.ics) ---------- */
  function icsDate(yyyymmdd, addDays) {
    const y = +yyyymmdd.slice(0, 4), m = +yyyymmdd.slice(4, 6) - 1, d = +yyyymmdd.slice(6, 8) + (addDays || 0);
    const dt = new Date(Date.UTC(y, m, d));
    return dt.toISOString().slice(0, 10).replace(/-/g, '');
  }
  function saveDate() {
    const ev = CFG.event;
    const esc = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gold Lake Garda Bulldog Francese//IT', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:raduno-2027@goldlakegarda',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
      'DTSTART;VALUE=DATE:' + icsDate(ev.date),
      'DTEND;VALUE=DATE:' + icsDate(ev.date, 1),
      'SUMMARY:' + esc(ev.title),
      'LOCATION:' + esc(ev.location),
      'DESCRIPTION:' + esc(ev.description + (location.href.startsWith('http') ? '\n' + location.href.split('#')[0] : '')),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'raduno-gold-lake-garda-2027.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  $$('[data-action="save-date"]').forEach(b => b.addEventListener('click', saveDate));

  /* ---------- Condividi ---------- */
  const pageUrl = location.href.split('#')[0];
  const shareText = 'Sabato 25 settembre 2027 a Moniga del Garda: 3° Raduno Nazionale Gold Lake Garda Bulldog Francese. Obiettivo 1.001 bulldog francesi! Iscrivi i tuoi qui: ' + pageUrl;
  $('#share-wa').href = 'https://wa.me/?text=' + encodeURIComponent(shareText);
  $('#copy-link').addEventListener('click', async function () {
    const label = $('span', this);
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({ title: CFG.event.title, text: shareText.replace(pageUrl, '').trim(), url: pageUrl });
        return;
      }
      await navigator.clipboard.writeText(pageUrl);
      label.textContent = 'Link copiato';
    } catch (e) {
      label.textContent = 'Copia da qui: ' + pageUrl;
    }
    setTimeout(() => { label.textContent = 'Copia il link'; }, 2500);
  });

  /* ---------- Modulo ---------- */
  const form = $('#form-iscrizione');
  const errBox = $('#form-errors');
  const acc = $('#f-acc'), nBull = $('#f-nbull'), dogsEl = $('#dogs');
  const tot = $('#tot-persone'), totSub = $('#tot-persone-sub');
  const waPhoneWrap = $('#wa-phone'), waPhone = $('#f-tel');

  acc.max = CFG.maxAccompagnatori; nBull.max = CFG.maxBulldog;

  // stepper − / +
  $$('.stepper').forEach(st => {
    const input = $('input', st);
    $$('.stepper__btn', st).forEach(b => b.addEventListener('click', () => {
      const min = +input.min || 0, max = +input.max || 99;
      const v = Math.min(max, Math.max(min, (+input.value || 0) + (+b.dataset.step)));
      input.value = v;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }));
  });

  function clamp(input) {
    const min = +input.min || 0, max = +input.max || 99;
    let v = parseInt(input.value, 10);
    if (isNaN(v)) v = min;
    v = Math.min(max, Math.max(min, v));
    if (String(v) !== input.value) input.value = v;
    return v;
  }

  function updateTotal() {
    const n = clamp(acc);
    tot.textContent = n + 1;
    totSub.textContent = n === 0 ? 'solo tu' : n === 1 ? 'tu e 1 accompagnatore' : 'tu e ' + n + ' accompagnatori';
  }
  acc.addEventListener('input', updateTotal);
  updateTotal();

  // campi dei nomi dei bulldog: si aggiungono/tolgono senza perdere quelli già scritti
  function renderDogs() {
    const n = clamp(nBull);
    const current = $$('.dog', dogsEl);
    for (let i = current.length; i < n; i++) {
      const row = document.createElement('div');
      row.className = 'dog';
      row.innerHTML =
        '<svg class="dog__paw" aria-hidden="true"><use href="#paw"/></svg>' +
        '<label for="dog-' + i + '">Nome del bulldog ' + (i + 1) + ' <abbr title="obbligatorio">*</abbr></label>' +
        '<input id="dog-' + i + '" name="bulldog[]" type="text" required autocomplete="off" placeholder="' + ['Rocky', 'Luna', 'Nina', 'Bruno', 'Maya', 'Leo'][i % 6] + '">';
      dogsEl.appendChild(row);
    }
    for (let i = current.length - 1; i >= n; i--) current[i].remove();
    dogsEl.classList.toggle('dogs--many', n > 4);
  }
  nBull.addEventListener('input', renderDogs);
  renderDogs();

  // WhatsApp: il telefono compare solo con "Sì"
  $$('input[name="whatsapp"]').forEach(r => r.addEventListener('change', () => {
    const yes = form.whatsapp.value === 'si';
    waPhoneWrap.hidden = !yes;
    waPhone.disabled = !yes;
    waPhone.required = yes;
    if (yes) waPhone.focus();
  }));

  // messaggi di errore in italiano, uno per campo
  function messageFor(el) {
    const v = el.validity;
    if (el.name === 'whatsapp') return 'Scegli una delle tre opzioni per il gruppo WhatsApp.';
    if (el.name === 'privacy') return 'Per iscriverti serve la presa visione dell\'informativa privacy.';
    if (el.name === 'bulldog[]') return 'Scrivi il nome di ogni bulldog.';
    if (v.valueMissing) return 'Compila questo campo.';
    if (el.type === 'email') return 'Controlla l\'indirizzo e-mail: sembra incompleto.';
    if (el.name === 'provincia') return 'La provincia è la sigla di due lettere, per esempio BS.';
    if (el.type === 'tel') return 'Scrivi il numero di cellulare con il prefisso.';
    if (v.tooShort) return 'Troppo corto.';
    if (v.rangeUnderflow || v.rangeOverflow) return 'Valore fuori dai limiti.';
    return 'Controlla questo campo.';
  }

  function clearErrors() {
    errBox.hidden = true; errBox.innerHTML = '';
    $$('.field.is-invalid, .choices.is-invalid, .form__group--privacy.is-invalid, .dog.is-invalid', form).forEach(el => el.classList.remove('is-invalid'));
    $$('.field__error', form).forEach(el => el.remove());
  }

  function showErrors(list) {
    const seen = new Set();
    const items = [];
    list.forEach(el => {
      const key = el.name;
      const wrap = el.closest('.field, .dog') || (key === 'whatsapp' ? el.closest('.choices') : el.closest('.form__group--privacy'));
      if (wrap) wrap.classList.add('is-invalid');
      if (seen.has(key)) return; seen.add(key);
      const msg = messageFor(el);
      if (wrap && wrap.matches('.field, .dog')) {
        const p = document.createElement('p'); p.className = 'field__error'; p.textContent = msg; wrap.appendChild(p);
      }
      const id = el.id || (key === 'whatsapp' ? 'wa-choices' : key);
      items.push('<li><a href="#' + id + '">' + msg + '</a></li>');
    });
    errBox.innerHTML = '<p><strong>Manca qualcosa</strong> prima di inviare:</p><ul>' + items.join('') + '</ul>';
    errBox.hidden = false;
    const first = list[0];
    (first.closest('.field, .dog, .choices, .form__group--privacy') || first).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => first.focus({ preventScroll: true }), reduceMotion ? 0 : 350);
  }

  // appena l'utente corregge un campo, il suo errore sparisce
  form.addEventListener('input', clearFieldError);
  form.addEventListener('change', clearFieldError);
  function clearFieldError(e) {
    const el = e.target;
    const wrap = el.closest('.field, .dog') || (el.name === 'whatsapp' ? el.closest('.choices') : el.closest('.form__group--privacy'));
    if (!wrap) return;
    wrap.classList.remove('is-invalid');
    const err = wrap.querySelector('.field__error'); if (err) err.remove();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    if (form.website && form.website.value) return; // honeypot

    const invalid = $$('input', form).filter(el => !el.disabled && !el.checkValidity());
    if (invalid.length) { showErrors(invalid); return; }

    const dogs = $$('input[name="bulldog[]"]', form).map(i => i.value.trim());
    const nAcc = clamp(acc);
    const payload = {
      referente: form.referente.value.trim(),
      citta: form.citta.value.trim(),
      provincia: form.provincia.value.trim().toUpperCase(),
      email: form.email.value.trim().toLowerCase(),
      accompagnatori: nAcc,
      totale_persone: nAcc + 1,
      n_bulldog: dogs.length,
      bulldog: dogs,
      whatsapp: form.whatsapp.value,
      telefono: form.whatsapp.value === 'si' ? waPhone.value.trim() : null,
      privacy: true
    };

    const btn = $('#submit-btn');
    btn.disabled = true; btn.classList.add('is-busy');
    try {
      const res = await API.submit(payload);
      showSuccess(res, payload);
    } catch (err) {
      errBox.innerHTML = '<p><strong>Non siamo riusciti a registrare l\'iscrizione.</strong> Riprova tra qualche istante; se il problema continua, scrivici.</p>';
      errBox.hidden = false;
      btn.disabled = false; btn.classList.remove('is-busy');
    }
  });

  function showSuccess(res, p) {
    const panel = $('#success');
    $('#success-number').textContent = 'Iscrizione n. ' + String(res.number).padStart(4, '0');
    $('#success-mail').innerHTML = res.emailSent
      ? 'Abbiamo inviato all\'indirizzo e-mail <strong>' + escapeHtml(p.email) + '</strong> la conferma della tua iscrizione, con il relativo numero progressivo.'
      : 'Quando il sistema sarà attivo riceverai all\'indirizzo <strong>' + escapeHtml(p.email) + '</strong> la conferma con il tuo numero progressivo.' + (res.preview ? ' <em>(anteprima: questa iscrizione non è stata salvata)</em>' : '');
    const names = p.bulldog.map(escapeHtml);
    const list = names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1];
    $('#success-dogs').innerHTML = (p.n_bulldog === 1 ? 'Ti aspettiamo con <strong>' : 'Vi aspettiamo con <strong>') + list + '</strong>' +
      (p.totale_persone > 1 ? ' e con le altre ' + (p.totale_persone - 1) + (p.totale_persone - 1 === 1 ? ' persona' : ' persone') + ' del tuo gruppo.' : '.');

    form.hidden = true;
    $('.register__head').hidden = true;
    panel.hidden = false;
    panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => panel.focus({ preventScroll: true }), 400);

    // il contatore dei bulldog sale dei suoi (solo visivo, in questa pagina)
    const el = $('[data-count="bulldog"]');
    const cur = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
    el.textContent = fmt(cur + p.n_bulldog);
    el.classList.add('is-bumped');
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /* ---------- Foto delle edizioni: sfogliabili da tastiera solo quando scorrono di lato ---------- */
  const strips = $$('.edition__photos');
  const markScrollable = () => strips.forEach(el => { el.tabIndex = el.scrollWidth > el.clientWidth + 1 ? 0 : -1; });
  markScrollable();
  window.addEventListener('resize', markScrollable);

  /* ---------- Barra in alto: ombra dopo lo scroll ---------- */
  const topbar = $('.topbar');
  const onScroll = () => topbar.classList.toggle('is-scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
