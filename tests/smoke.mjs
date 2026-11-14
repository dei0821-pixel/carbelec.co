#!/usr/bin/env node
// Smoke tests: serves the repository as the site and drives it in a real browser.
//
//   npm install && npx playwright install chromium    (once)
//   npm test
//
// Every check prints one line; the script exits with 1 if any of them fails.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain' };

// ── A static server that behaves like GitHub Pages for our purposes ─────────
const server = http.createServer((req, res) => {
  let file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;

// ── Helpers ─────────────────────────────────────────────────────────────────
let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures++;
  console.log((ok ? '  ok    ' : '  FAIL  ') + name + (ok || detail === '' ? '' : ' — ' + detail));
}
const same = (name, actual, expected) => check(name, actual === expected, `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);

const browser = await chromium.launch();

// Opens a page and records everything that should never happen: script errors, console errors (which include
// Content-Security-Policy violations) and requests to our own site that fail.
async function open(context, url) {
  const page = await context.newPage();
  page.problems = [];
  page.on('pageerror', err => page.problems.push('script error: ' + err.message));
  page.on('console', msg => { if (msg.type() === 'error') page.problems.push('console: ' + msg.text().slice(0, 200)); });
  page.on('response', res => { if (res.status() >= 400 && res.url().startsWith(BASE)) page.problems.push(`HTTP ${res.status()} ${res.url()}`); });
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  return page;
}
const clean = (name, page) => check(name + ': no errors', page.problems.length === 0, page.problems.join(' | '));
const noOverflow = async (name, page) => same(name + ': no horizontal scroll', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
const setLang = async (page, lang) => { await page.evaluate(l => document.querySelector(`.lang-btn[data-lang=${l}]`).click(), lang); await page.waitForTimeout(600); };
const text = (page, selector) => page.$eval(selector, el => el.textContent.trim());

const sample = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'catalog.json'), 'utf8'));
const total = sample.length;
const firstId = sample[0][0];
const english = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'catalog.en.json'), 'utf8'));

// ── Desktop ─────────────────────────────────────────────────────────────────
console.log('Home');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await open(context, '/');
  same('featured products shown', await page.$$eval('#productos .pc', cards => cards.length), 8);
  same('six category cards', await page.$$eval('.cat', cards => cards.length), 6);
  check('icons come from the sprite', await page.$eval('.nav-cta use', use => use.getAttribute('href').startsWith('/assets/icons.svg#')));
  check('quote bar hidden while the list is empty', await page.$eval('#qBar', el => el.hidden));
  await page.fill('#heroQ', 'taladro');
  await Promise.all([page.waitForURL('**/catalogo/?q=taladro'), page.press('#heroQ', 'Enter')]);
  check('hero search opens the catalog', page.url().endsWith('/catalogo/?q=taladro'));
  clean('home', page);
  await context.close();
}

console.log('Home in other languages');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await open(context, '/');
  const spanish = await text(page, '#productos .pc-nm a');
  await setLang(page, 'en');
  same('title in English', await text(page, 'h1'), 'Your trusted hardware store.');
  same('product name in English', await text(page, '#productos .pc-nm a'), english[firstId]);
  check('page title in English', (await page.title()).includes('Hardware store'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  same('language remembered after reload', await text(page, 'h1'), 'Your trusted hardware store.');
  await setLang(page, 'es');
  same('back to Spanish', await text(page, '#productos .pc-nm a'), spanish);
  clean('languages', page);
  await context.close();
}

console.log('Catalog');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await open(context, '/catalogo/');
  const count = () => text(page, '#pgCount');
  same('all products counted', await count(), new Intl.NumberFormat('es-CO').format(total) + ' productos');
  same('first batch of cards', await page.$$eval('.pc', cards => cards.length), 24);
  await page.click('#pgMore');
  same('"Ver más" adds a batch', await page.$$eval('.pc', cards => cards.length), 48);
  await page.selectOption('#pgSort', 'asc');
  const prices = await page.$$eval('.pc', cards => cards.slice(0, 5).map(card => Number(card.dataset.price)));
  check('sorted by price', prices.every((price, i) => i === 0 || prices[i - 1] <= price), prices.join(','));
  await page.selectOption('#pgSort', '');
  await page.click('.pills .pill[data-f=repuestos]');
  check('spare-part kinds appear', !(await page.$eval('#pgSubs', el => el.hidden)));
  await page.click('#pgSubs .pill[data-sub=escobillas]');
  await page.selectOption('#pgBrand', 'Bosch');
  check('filters narrow the list', Number((await count()).split(' ')[0]) < 100, await count());
  same('filters are in the address', new URL(page.url()).search, '?cat=repuestos&tipo=escobillas&marca=Bosch');
  await page.click('.pills .pill[data-f=all]');
  await page.selectOption('#pgBrand', '');
  await page.fill('#pgSearch', 'zzzzqqqq');
  await page.waitForTimeout(400);
  check('empty state for a search without results', !(await page.$eval('#pgEmpty', el => el.hidden)));
  await page.fill('#pgSearch', '');
  await page.waitForTimeout(400);
  await setLang(page, 'en');
  same('names in English', await text(page, '.pc-nm a'), english[firstId]);
  await page.fill('#pgSearch', 'grinder switch');
  await page.waitForTimeout(400);
  check('search works in English', Number((await count()).split(' ')[0]) > 5, await count());
  clean('catalog', page);
  await context.close();
}

console.log('Shared catalog links');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await open(context, '/catalogo/?q=taladro&cat=herramientas&orden=asc');
  same('search box filled from the address', await page.$eval('#pgSearch', el => el.value), 'taladro');
  check('category applied from the address', await page.$eval('.pills .pill[data-f=herramientas]', el => el.classList.contains('active')));
  clean('shared link', page);
  const old = await open(context, '/?q=taladro&cat=herramientas');
  await old.waitForURL('**/catalogo/?q=taladro&cat=herramientas');
  check('old home links go to the catalog', old.url().includes('/catalogo/?q=taladro'));
  await context.close();
}

console.log('Product page and quote list');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await open(context, `/p/${firstId}.html`);
  same('product name', await text(page, 'h1'), sample[0][1]);
  check('link to MercadoLibre', (await page.$eval('.pd-actions .btn-gold', a => a.href)).includes('mercadolibre.com.co'));
  same('related products', await page.$$eval('.pgrid .pc', cards => cards.length), 4);
  await page.click('.pd-add');
  check('add button switches on', await page.$eval('.pd-add', btn => btn.classList.contains('on')));
  same('quote bar counts one unit', await text(page, '#qBarN'), '1');
  await page.click('.pgrid .pc .pc-add');
  await page.click('#qBar');
  same('two rows in the list', await page.$$eval('.q-item', rows => rows.length), 2);
  await page.click('.q-item .q-inc');
  check('WhatsApp message lists the products', decodeURIComponent(await page.$eval('#qWa', a => a.href)).includes('2 × ' + sample[0][1]));
  await Promise.all([page.waitForURL('**/#cotizacion'), page.click('#qMail')]);
  await page.waitForTimeout(500);
  check('"Enviar por correo" fills the form on the home page', (await page.$eval('#fM', box => box.value)).includes('2 × ' + sample[0][1]));
  clean('product and quote', page);
  const catalog = await open(context, '/catalogo/');
  same('the list follows the visitor to other pages', await text(catalog, '#qBarN'), '3');
  check('its products are marked in the catalog', await catalog.$eval(`.pc[data-id=${firstId}] .pc-add`, btn => btn.classList.contains('on')));
  await catalog.click('#qBar');
  await catalog.click('#qClear');
  check('"Vaciar lista" empties it', await catalog.$eval('#qBar', el => el.hidden));
  await context.close();
}

console.log('Quote form and chat');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await open(context, '/');
  await page.click('#quoteSend');
  check('empty form is rejected with a message', (await text(page, '#quoteStatus')).length > 10);
  await page.click('#chtToggle');
  check('chat opens with its greeting', await page.$eval('#chtMsgs', el => el.textContent.includes('CARBELEC')));
  clean('form and chat', page);
  await context.close();
}

console.log('Category list and privacy page');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const list = await open(context, '/catalogo/repuestos.html');
  check('category list has its products', (await list.$$eval('.plist li', items => items.length)) > 100);
  clean('category list', list);
  const privacy = await open(context, '/privacidad/');
  check('privacy page opens', (await privacy.title()).includes('Privacidad'));
  await context.close();
}

// ── Phone ───────────────────────────────────────────────────────────────────
console.log('Phone (390 px)');
{
  const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
  for (const [name, url] of [['home', '/'], ['catalog', '/catalogo/'], ['product', `/p/${firstId}.html`], ['category list', '/catalogo/hogar.html']]) {
    const page = await open(context, url);
    await noOverflow(name, page);
    clean(name, page);
    if (name === 'home') {
      await page.click('.nav-toggle');
      check('menu opens', await page.$eval('#mn', el => el.classList.contains('open')));
      await page.click('#mn a[href="/#cotizacion"]');
      await page.waitForTimeout(400);
      check('quote link lands on the form', (await page.$eval('#cotizacion', el => el.getBoundingClientRect().top)) < 300);
    }
    await page.close();
  }
  await context.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
