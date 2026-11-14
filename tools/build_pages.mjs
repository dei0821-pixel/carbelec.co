#!/usr/bin/env node
// Generates the static pages search engines can read: one per product (p/<id>.html), one per category
// (catalogo/<category>.html), the catalog index and sitemap.xml.
//
//   node tools/build_pages.mjs
//
// It reads the featured products from index.html and the rest from assets/catalog.json, so run it after
// either of them changes. Everything inside p/ and catalogo/ is rewritten on each run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = 'https://carbelec.co';
const WA_PHONE = '573153899483';
const ML_SELLER = '?pdp_filters=seller_id%3A272993470';
const CATEGORIES = {
  herramientas: 'Herramientas', repuestos: 'Repuestos', electricos: 'Eléctricos',
  hogar: 'Hogar', construccion: 'Construcción', seguridad: 'Seguridad Industrial'
};

const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pesos = new Intl.NumberFormat('es-CO');
const fmt = value => '$' + pesos.format(value);
const jsonLd = data => JSON.stringify(data).replace(/</g, '\\u003c');

// ── Products ────────────────────────────────────────────────────────────────
function featuredProducts() {
  const page = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
  const start = page.indexOf('const PRODUCTS = [');
  const end = page.indexOf('\n    ];', start);
  if (start < 0 || end < 0) throw new Error('PRODUCTS not found in index.html');
  const list = new Function('return ' + page.slice(start + 'const PRODUCTS = '.length, end + '\n    ]'.length))();
  return list.map(p => ({ id: p.id, name: p.name, price: p.price, cat: p.cat, brand: p.brand || '', desc: p.desc || '', img: '/' + p.img, url: p.url }));
}

function catalogProducts() {
  const rows = JSON.parse(fs.readFileSync(path.join(REPO, 'assets', 'catalog.json'), 'utf8'));
  return rows.map(([id, name, price, cat, brand, address]) => ({
    id, name, price, cat, brand, desc: '',
    img: '/assets/catalog/' + id + '.webp',
    url: 'https://' + address + (address.startsWith('www.') ? ML_SELLER : '')
  }));
}

const products = [...featuredProducts(), ...catalogProducts()];
for (const p of products) {
  if (!/^MCO\d+$/.test(p.id)) throw new Error('Bad product id: ' + p.id);
  if (!CATEGORIES[p.cat]) throw new Error('Unknown category "' + p.cat + '" in ' + p.id);
  if (!/^https:\/\/(www|articulo)\.mercadolibre\.com\.co\//.test(p.url)) throw new Error('Bad link in ' + p.id);
}
if (new Set(products.map(p => p.id)).size !== products.length) throw new Error('Duplicate product ids');

// ── Page shell ──────────────────────────────────────────────────────────────
const CSP = "default-src 'self'; script-src 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";

function shell({ title, description, canonical, image, body, structured }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="CARBELEC">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:locale" content="es_CO">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/pages.css">
${structured.map(data => `  <script type="application/ld+json">${jsonLd(data)}</script>`).join('\n')}
</head>
<body>
  <header class="top"><a class="logo" href="/"><img src="/assets/logo.png" alt="CARBELEC" width="586" height="450"></a><nav><a href="/#productos">Catálogo</a><a href="/#contacto">Contacto</a></nav></header>
  <main>
${body}
  </main>
  <footer>
    <p><strong>CARBELEC — Carbon Electric S.A.S.</strong> · Cra. 81 #73F Sur 57, Bogotá · <a href="tel:+576016484985">601 648 4985</a> · <a href="https://wa.me/${WA_PHONE}">WhatsApp 315 389 9483</a></p>
    <p><a href="/">Inicio</a> · <a href="/catalogo/">Catálogo completo</a> · <a href="/privacidad/">Política de privacidad</a></p>
  </footer>
</body>
</html>
`;
}

const crumbs = items => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], index) => ({ '@type': 'ListItem', position: index + 1, name, item: url }))
});

// ── Product pages ───────────────────────────────────────────────────────────
function productPage(p) {
  const canonical = `${SITE}/p/${p.id}.html`;
  const category = CATEGORIES[p.cat];
  const image = SITE + p.img;
  const description = `${p.name}. Precio de referencia ${fmt(p.price)} COP. Ferretería CARBELEC en Bogotá: compra en MercadoLibre con envío a todo Colombia o cotiza por WhatsApp.`;
  const wa = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(`Hola, me interesa: ${p.name} (${fmt(p.price)})`)}`;
  const body = `    <p class="crumbs"><a href="/">Inicio</a> › <a href="/catalogo/${p.cat}.html">${esc(category)}</a></p>
    <article class="product">
      <div class="photo"><img src="${esc(p.img)}" alt="${esc(p.name)}" width="640" height="640"></div>
      <div class="info">
        ${p.brand ? `<p class="brand">${esc(p.brand)}</p>` : ''}
        <h1>${esc(p.name)}</h1>
        ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
        <p class="price">${fmt(p.price)} <span>COP</span></p>
        <p class="note">Precio de referencia. El precio final y la disponibilidad son los publicados en MercadoLibre.</p>
        <p class="actions">
          <a class="btn gold" href="${esc(p.url)}" rel="noopener">Comprar en MercadoLibre</a>
          <a class="btn green" href="${esc(wa)}" rel="noopener">Cotizar por WhatsApp</a>
        </p>
        <p class="more"><a href="/?cat=${p.cat}#productos">Ver más productos de ${esc(category)}</a></p>
      </div>
    </article>`;
  const product = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, image, sku: p.id, category,
    offers: { '@type': 'Offer', price: p.price, priceCurrency: 'COP', url: p.url, seller: { '@type': 'Organization', name: 'CARBELEC — Carbon Electric S.A.S.' } }
  };
  if (p.brand) product.brand = { '@type': 'Brand', name: p.brand };
  if (p.desc) product.description = p.desc;
  return shell({
    title: `${p.name} | CARBELEC`, description, canonical, image, body,
    structured: [product, crumbs([['Inicio', SITE + '/'], [category, `${SITE}/catalogo/${p.cat}.html`], [p.name, canonical]])]
  });
}

// ── Category pages ──────────────────────────────────────────────────────────
function categoryPage(cat, list) {
  const category = CATEGORIES[cat];
  const canonical = `${SITE}/catalogo/${cat}.html`;
  const body = `    <p class="crumbs"><a href="/">Inicio</a> › <a href="/catalogo/">Catálogo</a></p>
    <h1>${esc(category)}</h1>
    <p class="lead">${pesos.format(list.length)} productos de ${esc(category.toLowerCase())} en CARBELEC, Bogotá. <a href="/?cat=${cat}#productos">Verlos con fotos, buscador y filtros</a>.</p>
    <ul class="plist">
${list.map(p => `      <li><a href="/p/${p.id}.html">${esc(p.name)}</a> <span>${fmt(p.price)}</span></li>`).join('\n')}
    </ul>`;
  return shell({
    title: `${category} | Catálogo CARBELEC`, canonical, image: SITE + '/assets/logo.png', body,
    description: `${pesos.format(list.length)} productos de ${category.toLowerCase()} en la ferretería CARBELEC, Bogotá. Precios de referencia y envío a todo Colombia por MercadoLibre.`,
    structured: [crumbs([['Inicio', SITE + '/'], ['Catálogo', SITE + '/catalogo/'], [category, canonical]])]
  });
}

function catalogIndex(groups) {
  const body = `    <p class="crumbs"><a href="/">Inicio</a></p>
    <h1>Catálogo completo</h1>
    <p class="lead">${pesos.format(products.length)} productos de ferretería, repuestos, eléctricos y seguridad industrial. <a href="/#productos">Ver el catálogo con fotos, buscador y filtros</a>.</p>
    <ul class="clist">
${Object.keys(CATEGORIES).map(cat => `      <li><a href="/catalogo/${cat}.html">${esc(CATEGORIES[cat])}</a> <span>${pesos.format(groups[cat].length)} productos</span></li>`).join('\n')}
    </ul>`;
  return shell({
    title: 'Catálogo completo | CARBELEC', canonical: SITE + '/catalogo/', image: SITE + '/assets/logo.png', body,
    description: `Catálogo de la ferretería CARBELEC en Bogotá: ${pesos.format(products.length)} productos con precio de referencia.`,
    structured: [crumbs([['Inicio', SITE + '/'], ['Catálogo', SITE + '/catalogo/']])]
  });
}

// ── Write ───────────────────────────────────────────────────────────────────
function freshDir(name) {
  const dir = path.join(REPO, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const productDir = freshDir('p');
for (const p of products) fs.writeFileSync(path.join(productDir, p.id + '.html'), productPage(p));

const groups = Object.fromEntries(Object.keys(CATEGORIES).map(cat => [cat, products.filter(p => p.cat === cat)]));
const catalogDir = freshDir('catalogo');
fs.writeFileSync(path.join(catalogDir, 'index.html'), catalogIndex(groups));
for (const cat of Object.keys(CATEGORIES)) fs.writeFileSync(path.join(catalogDir, cat + '.html'), categoryPage(cat, groups[cat]));

const urls = [SITE + '/', SITE + '/catalogo/', ...Object.keys(CATEGORIES).map(cat => `${SITE}/catalogo/${cat}.html`),
  ...products.map(p => `${SITE}/p/${p.id}.html`), SITE + '/privacidad/'];
fs.writeFileSync(path.join(REPO, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(url => `  <url><loc>${esc(url)}</loc></url>`).join('\n') + '\n</urlset>\n');

console.log(`${products.length} product pages, ${Object.keys(CATEGORIES).length} category pages, ${urls.length} sitemap entries`);
