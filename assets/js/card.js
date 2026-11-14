// The product card, written once: the build script uses it for the cards printed into the pages and the
// catalog page uses it in the browser. It has no imports so both can load it.

const WA_PHONE = '573153899483';
const ML_SELLER = '?pdp_filters=seller_id%3A272993470';
const pesos = new Intl.NumberFormat('es-CO');

export const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = value => '$' + pesos.format(value);
export const icon = name => `<svg class="ico" aria-hidden="true"><use href="/assets/icons.svg#${name}"/></svg>`;
export const pageUrl = id => `/p/${id}.html`;
export const waLink = text => `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
// The WhatsApp message stays in Spanish: it is read by the store, not by the visitor.
export const waProduct = p => waLink(`Hola, me interesa: ${p.name} (${fmt(p.price)})`);

// A row of assets/catalog.json: [id, name, price, category, brand, MercadoLibre address, { img, desc, best }?]
export function fromRow([id, name, price, cat, brand, address, extra = {}]) {
  return {
    id, name, price, cat, brand,
    desc: extra.desc || '',
    best: Boolean(extra.best),
    img: extra.img || `/assets/catalog/${id}.webp`,
    url: 'https://' + address + (address.startsWith('www.') ? ML_SELLER : '')
  };
}

// `name` and `desc` may be given in another language; the data attributes always keep the Spanish ones,
// which the quote list and the WhatsApp message use.
export function cardHtml(p, { name = p.name, desc = p.desc, lazy = true } = {}) {
  return `<article class="pc" data-id="${p.id}" data-name="${esc(p.name)}" data-price="${p.price}">
  <a class="pc-img" href="${pageUrl(p.id)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.img)}" alt="" width="640" height="640"${lazy ? ' loading="lazy"' : ''} decoding="async">${p.best ? '<span class="pc-badge" data-i18n="pc_best">Más Vendido</span>' : ''}</a>
  <div class="pc-body">
    ${p.brand ? `<div class="pc-br">${esc(p.brand)}</div>` : ''}
    <h3 class="pc-nm"><a href="${pageUrl(p.id)}" data-pname="${p.id}">${esc(name)}</a></h3>
    ${p.desc ? `<p class="pc-ds" data-pdesc="${p.id}">${esc(desc)}</p>` : ''}
    <div class="pc-ft">
      <div class="pc-pr">${fmt(p.price)}</div>
      <div class="pc-acts">
        <button type="button" class="pc-add js-add" aria-pressed="false" aria-label="Agregar a mi cotización" title="Agregar a mi cotización">${icon('plus')}</button>
        <a class="pc-wa" href="${esc(waProduct(p))}" target="_blank" rel="noopener" aria-label="Preguntar por WhatsApp" data-i18n-attr="aria-label:pc_wa">${icon('whatsapp')}</a>
      </div>
    </div>
  </div>
</article>`;
}
