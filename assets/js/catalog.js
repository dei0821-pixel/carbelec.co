// The catalog page: search, filters, order and the product grid, all built from assets/catalog.json.
import { $, $$, I18N, fold, getLang, pesos, start, t, translate, waUrl } from './core.js';
import { cardHtml, fromRow } from './card.js';
import { descOf, nameOf } from './names.js';
import { paintAddButtons } from './quote.js';

const grid = $('#pg');
const emptyNote = $('#pgEmpty');
const moreBtn = $('#pgMore');
const searchBox = $('#pgSearch');
const countNote = $('#pgCount');
const brandBox = $('#pgBrand');
const sortBox = $('#pgSort');
const subsRow = $('#pgSubs');
const PAGE_SIZE = 24;                       // cards added per "Ver más productos"
// Kinds of spare parts, matched against the Spanish name (first match wins; the rest are "otros").
const SUBS = [
  ['escobillas', /escobilla|carbon/], ['inducidos', /inducido|armadura|rotor/], ['interruptores', /interruptor|switch|gatillo|boton/],
  ['rodamientos', /rodamiento|balinera/], ['campos', /campo|bobina|estator/], ['mandriles', /mandril|broquero|portabroca/]
];

let catalog = [];
let matches = [];
let rendered = 0;
let currentFilter = 'all';
let query = '';
let brandFilter = '';
let sortOrder = '';                         // '' (featured first), 'asc', 'desc' or 'az'
let subFilter = '';                         // kind of spare part, only inside Repuestos

const shownName = p => nameOf(p.id, p.name);
const subOf = p => p.sub || (p.sub = (SUBS.find(([, pattern]) => pattern.test(fold(p.name))) || ['otros'])[0]);
// A search finds a product by its Spanish name or by its name in the language on screen.
function searchText(p) {
  if (p.searchLang !== getLang()) {
    p.search = fold(p.name + ' ' + shownName(p) + ' ' + p.brand);
    p.searchLang = getLang();
  }
  return p.search;
}

function makeCard(p) {
  const holder = document.createElement('template');
  holder.innerHTML = cardHtml(p, { name: shownName(p), desc: descOf(p.id, p.desc) });
  const card = holder.content.firstElementChild;
  translate(card);
  return card;
}

function findMatches() {
  const words = fold(query).split(/\s+/).filter(Boolean);
  matches = catalog.filter(p => (currentFilter === 'all' || p.cat === currentFilter)
    && (!brandFilter || p.brand === brandFilter)
    && (!subFilter || currentFilter !== 'repuestos' || subOf(p) === subFilter)
    && words.every(word => searchText(p).includes(word)));
  if (sortOrder === 'asc') matches.sort((a, b) => a.price - b.price);
  else if (sortOrder === 'desc') matches.sort((a, b) => b.price - a.price);
  else if (sortOrder === 'az') matches.sort((a, b) => shownName(a).localeCompare(shownName(b), getLang()));
}

// Brand list for the products of the current category, most common first.
function paintBrands() {
  const counts = new Map();
  catalog.forEach(p => { if (p.brand && (currentFilter === 'all' || p.cat === currentFilter)) counts.set(p.brand, (counts.get(p.brand) || 0) + 1); });
  if (catalog.length && brandFilter && !counts.has(brandFilter)) brandFilter = '';
  const options = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([brand, count]) => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand + ' (' + count + ')';
    return option;
  });
  brandBox.replaceChildren(brandBox.options[0], ...options);
  brandBox.value = brandFilter;
}

function paintSubs() {
  const on = currentFilter === 'repuestos';
  subsRow.hidden = !on;
  if (!on) { subFilter = ''; return; }
  if (!subsRow.childElementCount) {
    subsRow.append(...[''].concat(SUBS.map(([key]) => key), 'otros').map(key => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill';
      btn.dataset.sub = key;
      btn.dataset.i18n = 'sub_' + (key || 'all');
      return btn;
    }));
    translate(subsRow);
  }
  $$('.pill', subsRow).forEach(btn => {
    const active = btn.dataset.sub === subFilter;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active);
  });
}

// The search, category, brand and order live in the address, so a filtered view can be shared or bookmarked.
function readAddress() {
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  if (cat && $('.pills .pill[data-f="' + CSS.escape(cat) + '"]')) currentFilter = cat;
  query = (params.get('q') || '').slice(0, 80);
  brandFilter = (params.get('marca') || '').slice(0, 40);
  subFilter = SUBS.some(([key]) => key === params.get('tipo')) || params.get('tipo') === 'otros' ? params.get('tipo') : '';
  sortOrder = ['asc', 'desc', 'az'].includes(params.get('orden')) ? params.get('orden') : '';
  searchBox.value = query;
  sortBox.value = sortOrder;
}

function writeAddress() {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (currentFilter !== 'all') params.set('cat', currentFilter);
  if (subFilter) params.set('tipo', subFilter);
  if (brandFilter) params.set('marca', brandFilter);
  if (sortOrder) params.set('orden', sortOrder);
  const text = params.toString();
  try { history.replaceState(null, '', location.pathname + (text ? '?' + text : '')); } catch (e) { /* file:// pages cannot change it */ }
}

function paintCount() {
  countNote.textContent = matches.length ? t('pg_count').replace('{n}', pesos.format(matches.length)) : '';
  moreBtn.hidden = rendered >= matches.length;
  emptyNote.hidden = !catalog.length || matches.length > 0;
}

// Adds the next batch of cards and returns the first new one.
function renderMore() {
  const cards = matches.slice(rendered, rendered + PAGE_SIZE).map(makeCard);
  emptyNote.before(...cards);
  rendered += cards.length;
  paintAddButtons(grid);
  paintCount();
  return cards[0];
}

// Draws the grid again from the first product; `keep` cards are shown (at least one batch).
function showProducts(keep = 0) {
  paintSubs();
  paintBrands();
  findMatches();
  writeAddress();
  $$('.pc', grid).forEach(card => card.remove());
  rendered = 0;
  do { renderMore(); } while (rendered < Math.min(keep, matches.length));
  let label = '';
  $$('.pills .pill').forEach(btn => {
    const on = btn.dataset.f === currentFilter;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
    if (on && currentFilter !== 'all') label = I18N.es[btn.dataset.i18n] || '';
  });
  // The WhatsApp message stays in Spanish: it is read by the store.
  if (!matches.length) $('#pgEmptyWa').href = waUrl('Hola, busco: ' + [query.trim(), brandFilter, label].filter(Boolean).join(' — '));
}

function setFilter(filter) { currentFilter = filter; subFilter = ''; showProducts(); }

async function loadCatalog() {
  const response = await fetch('/assets/catalog.json');
  if (!response.ok) throw new Error('catalog.json: HTTP ' + response.status);
  catalog = (await response.json()).map(fromRow);
  showProducts();
}

start('catalog', () => {
  readAddress();
  moreBtn.addEventListener('click', () => {
    const first = renderMore();
    if (first) $('.pc-nm a', first).focus({ preventScroll: true });
  });
  $$('.pills .pill').forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.f)));
  subsRow.addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (btn) { subFilter = btn.dataset.sub; showProducts(); }
  });
  brandBox.addEventListener('change', () => { brandFilter = brandBox.value; showProducts(); });
  sortBox.addEventListener('change', () => { sortOrder = sortBox.value; showProducts(); });
  let typing;
  searchBox.addEventListener('input', () => {
    clearTimeout(typing);
    typing = setTimeout(() => { query = searchBox.value; showProducts(); }, 150);
  });
  document.addEventListener('carbelec:lang', paintCount);
  // New names arrived: draw the same number of cards again, in the new language.
  document.addEventListener('carbelec:names', () => { if (catalog.length) showProducts(rendered); });
  loadCatalog().catch(err => {
    console.error('[CARBELEC] catalog:', err);
    $('#pgFail').hidden = false;
  });
});
