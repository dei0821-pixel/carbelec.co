// Product names and descriptions in the other languages. assets/catalog.<lang>.json maps a product id to its
// name, and "d:<id>" to its description. A product missing there is shown in Spanish.
import { $$, getLang } from './core.js';

const translations = {};
const table = () => translations[getLang()] || {};

export const nameOf = (id, spanish) => table()[id] || spanish;
export const descOf = (id, spanish) => table()['d:' + id] || spanish;

// Product names printed into the page carry data-pname="<id>" (descriptions data-pdesc); their Spanish text is
// remembered the first time so it can be put back.
export function paintNames(root = document) {
  $$('[data-pname]', root).forEach(el => {
    if (el.dataset.es === undefined) el.dataset.es = el.textContent;
    el.textContent = nameOf(el.dataset.pname, el.dataset.es);
  });
  $$('[data-pdesc]', root).forEach(el => {
    if (el.dataset.es === undefined) el.dataset.es = el.textContent;
    el.textContent = descOf(el.dataset.pdesc, el.dataset.es);
  });
}

// Loads the names for the current language (once), repaints the page and tells the other modules.
export async function loadNames() {
  const wanted = getLang();
  if (wanted !== 'es' && !translations[wanted]) {
    try {
      const response = await fetch('/assets/catalog.' + wanted + '.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      translations[wanted] = await response.json();
    } catch (err) {
      console.error('[CARBELEC] catalog.' + wanted + '.json:', err);
      translations[wanted] = {};                // keep the Spanish names; do not ask again
    }
  }
  if (wanted !== getLang()) return;             // the visitor switched again while this was loading
  paintNames();
  document.dispatchEvent(new CustomEvent('carbelec:names'));
}
