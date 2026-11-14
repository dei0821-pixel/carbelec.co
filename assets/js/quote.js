// The quote list: products picked with an "add" button on any page. It is kept in the browser so it survives
// a reload and follows the visitor from page to page; it is only sent anywhere when the visitor presses one of
// the two send buttons.
import { $, $$, fmt, store, t, translate, waUrl } from './core.js';
import { nameOf } from './names.js';

const QUOTE_KEY = 'carbelec_quote';
const DRAFT_KEY = 'carbelec_quote_draft';       // list on its way to the quote form of the home page
const QUOTE_MAX = 100;
const clampQty = value => Math.min(9999, Math.max(1, Math.round(Number(value)) || 1));

let quote = [];                                 // [{ id, name, price, qty }], names in Spanish
let opener = null;
let bar, overlay, list, rowTpl;

function load() {
  try {
    const saved = JSON.parse(store.get(QUOTE_KEY) || '[]');
    quote = (Array.isArray(saved) ? saved : [])
      .filter(item => item && typeof item.id === 'string' && typeof item.name === 'string')
      .slice(0, QUOTE_MAX)
      .map(item => ({ id: item.id.slice(0, 40), name: item.name.slice(0, 200), price: Math.max(0, Number(item.price) || 0), qty: clampQty(item.qty) }));
  } catch (e) { quote = []; }
}

const inQuote = id => quote.some(item => item.id === id);

// An add button is any .js-add inside an element that carries data-id, data-name and data-price.
// Icon buttons switch between "+" and a check mark; buttons with a [data-add-label] switch their text.
export function paintAddButtons(root = document) {
  $$('.js-add', root).forEach(btn => {
    const on = inQuote(btn.closest('[data-id]').dataset.id);
    const label = t(on ? 'pc_added' : 'pc_add');
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on);
    const use = $('use', btn);
    if (use) use.setAttribute('href', '/assets/icons.svg#' + (on ? 'check' : 'plus'));
    const text = $('[data-add-label]', btn);
    if (text) text.textContent = label;
    else { btn.setAttribute('aria-label', label); btn.title = label; }
  });
}

// The message stays in Spanish: it is read by the store. Long lists are cut so the WhatsApp link stays valid.
function quoteLines(limit) {
  const lines = [];
  let used = 0;
  for (const item of quote) {
    const line = '• ' + item.qty + ' × ' + item.name + (item.price ? ' (' + fmt(item.price) + ' c/u)' : '');
    if (used + line.length > limit) { lines.push('… y ' + (quote.length - lines.length) + ' productos más'); break; }
    lines.push(line);
    used += line.length + 1;
  }
  return lines.join('\n');
}

function paint() {
  store.set(QUOTE_KEY, JSON.stringify(quote));
  bar.hidden = !quote.length;
  $('#qBarN').textContent = quote.reduce((sum, item) => sum + item.qty, 0);
  $('#qTotal').textContent = fmt(quote.reduce((sum, item) => sum + item.qty * item.price, 0));
  $('#qWa').href = waUrl('Hola, quiero cotizar estos productos:\n' + quoteLines(1500));
  list.replaceChildren(...quote.map(item => {
    const row = rowTpl.cloneNode(true);
    row.dataset.id = item.id;
    $('.q-name', row).textContent = nameOf(item.id, item.name);
    $('.q-price', row).textContent = item.price ? fmt(item.price) + ' ' + t('q_each') : '';
    $('input', row).value = item.qty;
    translate(row);
    return row;
  }));
  paintAddButtons();
  if (!quote.length) close();
}

function toggle(product) {
  if (inQuote(product.id)) quote = quote.filter(item => item.id !== product.id);
  else if (quote.length < QUOTE_MAX) quote.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  paint();
}

function open() {
  opener = document.activeElement;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#qClose').focus();
}

function close() {
  if (overlay.hidden) return;
  overlay.hidden = true;
  document.body.style.overflow = '';
  if (opener && opener.isConnected && !opener.hidden) opener.focus();
  opener = null;
}

// Writes the list into the quote form. The form lives on the home page: from any other page the list is
// handed over through sessionStorage and the visitor is taken there.
function sendByMail() {
  const text = quoteLines(3500);
  const box = $('#fM');
  close();
  if (!box) {
    try { sessionStorage.setItem(DRAFT_KEY, text); } catch (e) { /* the form will simply open empty */ }
    location.href = '/#cotizacion';
    return;
  }
  box.value = box.value.trim() ? box.value.trim() + '\n' + text : text;
  $('#cotizacion').scrollIntoView();
  $('#fN').focus({ preventScroll: true });
}

// Called by the home page when it opens: picks up a list handed over from another page.
export function takeDraft() {
  try {
    const text = sessionStorage.getItem(DRAFT_KEY);
    sessionStorage.removeItem(DRAFT_KEY);
    return text || '';
  } catch (e) { return ''; }
}

export function initQuote() {
  bar = $('#qBar');
  overlay = $('#qOverlay');
  list = $('#qList');
  rowTpl = $('#qTpl').content.firstElementChild;
  load();
  paint();

  document.addEventListener('click', e => {
    const btn = e.target.closest('.js-add');
    if (!btn) return;
    const { id, name, price } = btn.closest('[data-id]').dataset;
    toggle({ id, name, price: Number(price) || 0 });
  });
  bar.addEventListener('click', open);
  $('#qClose').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });
  list.addEventListener('click', e => {
    const row = e.target.closest('.q-item');
    const item = row && quote.find(entry => entry.id === row.dataset.id);
    if (!item) return;
    if (e.target.closest('.q-del')) quote = quote.filter(entry => entry !== item);
    else if (e.target.closest('.q-inc')) item.qty = clampQty(item.qty + 1);
    else if (e.target.closest('.q-dec')) item.qty = clampQty(item.qty - 1);
    else return;
    paint();
  });
  list.addEventListener('change', e => {
    const row = e.target.closest('.q-item');
    const item = row && quote.find(entry => entry.id === row.dataset.id);
    if (item) { item.qty = clampQty(e.target.value); paint(); }
  });
  $('#qClear').addEventListener('click', () => { quote = []; paint(); });
  $('#qMail').addEventListener('click', sendByMail);
  // Another tab changed the list.
  window.addEventListener('storage', e => { if (e.key === QUOTE_KEY) { load(); paint(); } });
  document.addEventListener('carbelec:lang', paint);
  document.addEventListener('carbelec:names', paint);
}
