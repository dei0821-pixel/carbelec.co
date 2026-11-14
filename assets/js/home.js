// Home page only: brand strip, hero search and the quote form.
import { $, start, t } from './core.js';
import { takeDraft } from './quote.js';

// Links shared before the catalog had its own page looked like /?q=taladro&cat=herramientas#productos.
start('old catalog links', () => {
  const params = new URLSearchParams(location.search);
  if (['q', 'cat', 'marca', 'tipo', 'orden'].some(key => params.has(key))) location.replace('/catalogo/' + location.search);
});

start('brand strip', () => {
  // The list is written once in the HTML. Three more copies follow it and each one slides left by its own
  // width, so the loop is seamless and leaves no gap even on very wide screens.
  const track = $('.brands-track');
  const brands = $('.brands-set', track);
  for (let i = 0; i < 3; i++) {
    const copy = brands.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.append(copy);
  }
  track.classList.add('run');
});

start('hero search', () => {
  $('#heroSearch').addEventListener('submit', e => {
    e.preventDefault();
    const query = $('#heroQ').value.trim();
    location.href = '/catalogo/' + (query ? '?q=' + encodeURIComponent(query) : '');
  });
});

start('quote form', () => {
  const form = $('#quoteForm');
  const button = $('#quoteSend');
  const label = $('#quoteSendLabel');
  const status = $('#quoteStatus');
  const retry = $('#quoteRetry');
  let pending = false;
  let statusKey = '';
  let lastAccepted = '';
  let unconfirmed = '';
  let allowUnconfirmedRetry = false;
  let nextAttemptAt = 0;
  function paint() {
    label.textContent = t(pending ? 'form_sending' : 'form_send');
    status.textContent = statusKey ? t(statusKey) : '';
    retry.textContent = t('form_retry');
    retry.hidden = !unconfirmed || pending;
    button.disabled = pending;
    retry.disabled = pending;
    form.setAttribute('aria-busy', String(pending));
  }
  function show(key, kind = 'error') { statusKey = key; status.dataset.state = kind; paint(); status.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  retry.addEventListener('click', () => {
    if (pending) return;
    allowUnconfirmedRetry = true;
    form.requestSubmit();
  });
  document.addEventListener('carbelec:lang', paint);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (pending) return;
    const values = {};
    for (const [id, name, max, required] of [
      ['fN', 'name', 120, true], ['fE', 'email', 254, true], ['fP', 'phone', 40, false],
      ['fC', 'company', 160, false], ['fM', 'products', 4000, true],
    ]) {
      const field = $('#' + id);
      const value = field.value.trim();
      field.setCustomValidity((required && !value) || value.length > max ? t('form_invalid') : '');
      values[name] = value;
    }
    if (!form.reportValidity() || $('#quoteHoney').value) { show('form_invalid'); return; }
    const fingerprint = JSON.stringify(values);
    if (fingerprint === lastAccepted) { show('form_duplicate', 'success'); return; }
    if (fingerprint === unconfirmed && !allowUnconfirmedRetry) { show('form_uncertain'); return; }
    if (Date.now() < nextAttemptAt) { show('form_wait'); return; }
    allowUnconfirmedRetry = false;
    unconfirmed = '';
    pending = true;
    show('form_sending', 'pending');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('https://formsubmit.co/ajax/dpg9612@gmail.com', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ ...values, _honey: '', _url: 'https://carbelec.co/',
          _subject: 'Solicitud de cotización — CARBELEC', _template: 'table' }),
      });
      const data = await response.json();
      const message = typeof data?.message === 'string' ? data.message.trim() : '';
      if (/activat/i.test(message)) { show('form_activation'); }
      else if (response.ok && (data?.success === true || data?.success === 'true')
        && /^The form was submitted successfully\.?$/i.test(message)) {
        lastAccepted = fingerprint;
        show('form_sent', 'success');
      } else if (!response.ok || data?.success === false || data?.success === 'false') {
        show('form_error');
      } else { unconfirmed = fingerprint; show('form_uncertain'); }
    } catch {
      // A lost response or timeout cannot prove that the provider did not receive the request.
      unconfirmed = fingerprint;
      show('form_uncertain');
    } finally {
      clearTimeout(timer);
      pending = false;
      nextAttemptAt = Date.now() + 5000;
      paint();
    }
  });
  paint();
});

// A quote list sent "por correo" from another page arrives here and is written into the form.
start('quote draft', () => {
  const text = takeDraft();
  if (!text) return;
  const box = $('#fM');
  box.value = box.value.trim() ? box.value.trim() + '\n' + text : text;
  $('#fN').focus({ preventScroll: true });
});
