// Shared by every page: settings, texts in the three languages, small helpers and the language switch.

export const WA_PHONE = '573153899483';
const LANGS = ['es', 'en', 'pt'];
const LANG_KEY = 'carbelec_lang';

// Interface texts. Spanish for anything written in the HTML is read from the HTML itself,
// so `es` only lists the texts that are created by this script.
export const I18N = {
  es: {
    pg_count: '{n} productos', pc_add: 'Agregar a mi cotización', pc_added: 'Quitar de mi cotización',
    q_qty: 'Cantidad', q_remove: 'Quitar', q_each: 'c/u', sub_all: 'Todos',
    sub_escobillas: 'Escobillas y carbones', sub_inducidos: 'Inducidos y rotores', sub_interruptores: 'Interruptores',
    sub_rodamientos: 'Rodamientos', sub_campos: 'Campos y bobinas', sub_mandriles: 'Mandriles', sub_otros: 'Otros repuestos',
    pc_best: 'Más Vendido', pc_ask: 'Consultar precio', pc_wa: 'Preguntar por WhatsApp', wa_fab: 'Escribir por WhatsApp'
  },
  en: {
    meta_title: 'CARBELEC S.A.S. | Carbon Electric — Hardware store in Bogotá',
    meta_desc: 'CARBELEC hardware store in Bogotá. Over 1,600 hardware, electrical, spare parts and tools products. Free shipping across Colombia.',
    nav_home: 'Home', nav_cat: 'Categories', nav_prod: 'Products', nav_about: 'About', nav_contact: 'Contact', nav_shop: 'Shop', menu: 'Menu',
    hero_title: 'Your <em>trusted</em> hardware store.', hero_btn_catalog: 'Browse the catalogue',
    hero_sub: 'Professional tools, electrical supplies, spare parts and industrial safety. From Bogotá to all of Colombia.',
    hero_btn_ml: 'Shop on MercadoLibre', hero_btn_wa: 'Request a Quote',
    stat_products_n: '1,665+', stat_products: 'Products', stat_brands: 'Brands', stat_rating: 'Rating',
    cat_label: 'What we offer', cat_title: 'Our categories.', cat_desc: 'Everything you need for your projects.',
    cat_tools: 'Tools', cat_tools_d: 'Drills, wrenches, pliers, bits',
    cat_safety: 'Industrial Safety', cat_safety_d: 'Respirators, gloves, safety glasses',
    cat_elec: 'Electrical', cat_elec_d: 'Outlets, cables, extension cords, bulbs',
    cat_home: 'Home', cat_home_d: 'Plumbing, locks, garden, kitchen',
    cat_parts: 'Spare Parts', cat_parts_d: 'Carbon brushes, armatures, switches',
    cat_build: 'Construction', cat_build_d: 'Tapes, adhesives, sealants',
    pg_search: 'Search by name, brand or reference', pg_count: '{n} products',
    hero_search: 'What product are you looking for?', hero_search_btn: 'Search',
    pg_brand: 'Brand', pg_brand_all: 'All brands', pg_sort: 'Sort',
    sort_rel: 'Featured first', sort_asc: 'Price: low to high', sort_desc: 'Price: high to low', sort_az: 'Name: A to Z',
    pc_add: 'Add to my quote', pc_added: 'Remove from my quote',
    q_title: 'My quote', q_close: 'Close', q_total: 'Reference total', q_qty: 'Quantity', q_remove: 'Remove', q_each: 'each',
    q_note: 'Prices are for reference. We confirm availability and the final price when we reply.',
    q_wa: 'Send via WhatsApp', q_mail: 'Send by email', q_clear: 'Empty list',
    sub_all: 'All', sub_escobillas: 'Carbon brushes', sub_inducidos: 'Armatures and rotors', sub_interruptores: 'Switches',
    sub_rodamientos: 'Bearings', sub_campos: 'Field coils', sub_mandriles: 'Chucks', sub_otros: 'Other parts',
    co_map: 'Get directions', ft_catalog: 'Full catalogue',
    prod_label: 'Catalogue', prod_title: 'Our products.', prod_desc: 'Reference prices in Colombian pesos (COP). The final price is the one listed on MercadoLibre.',
    pill_all: 'All', pill_safety: 'Safety',
    prod_cta: 'See all 1,665 products on MercadoLibre',
    cat_meta_title: 'Catalogue | CARBELEC', cat_meta_desc: 'CARBELEC catalogue: 1,665 hardware, spare parts, electrical and safety products with reference prices. Bogotá, Colombia.',
    pcats: 'Catalogue as a list, by category:', pg_fail: 'We could not load the catalogue. Reload the page or browse it by category below.',
    nf_title: 'We could not find that page.', nf_text: 'The product may no longer be available, or the address may have changed.',
    feat_label: 'Featured', feat_title: 'Featured products.', feat_cta: 'See the full catalogue',
    pd_note: 'Reference price. The final price and availability are the ones listed on MercadoLibre.',
    pd_wa: 'Quote on WhatsApp', pd_more: 'See more products in this category', rel_title: 'Related products',
    prod_more: 'Show more products', pc_best: 'Best Seller', pc_ask: 'Ask for price', pc_wa: 'Ask on WhatsApp', wa_fab: 'Message us on WhatsApp', hero_btn_chat: 'Message us on WhatsApp', form_alt: 'Prefer a faster answer?',
    empty_a: 'No products found for that search. Look for them on', empty_b: 'or ask for them on',
    about_label: 'Our story', about_title: 'More than a hardware store.', about_desc: 'Your ally for professional and home projects.',
    about_p1: '<strong>CARBELEC — Carbon Electric S.A.S.</strong> We sell, distribute and import hardware, electrical supplies and spare parts. Electronic invoicing and a physical store in Bogotá.',
    about_p2: 'Over 60 brands: Truper, Bosch, DeWalt, Total, Makita, Stanley, 3M, Pretul, Black+Decker, Toolcraft, Schneider Electric. Wholesale and retail.',
    feat_ship: 'Free Shipping', feat_ship_d: 'Anywhere in Colombia via MercadoLibre',
    feat_inv: 'Electronic Invoice', feat_inv_d: 'On purchases from COP $25,000',
    feat_store: 'Physical Store', feat_whole: 'Wholesale & Retail', feat_whole_d: 'Interest-free installments on MercadoLibre',
    quote_rating: 'Rating on Google',
    test_label: 'Testimonials', test_title: 'What our customers say.',
    test_1: '"A very reliable company with good products at an excellent price. Friendly service."',
    test_2: '"Excellent service and a wide range. I found the spare part for my grinder."',
    test_3: '"They have everything in hardware and electrical supplies. Competitive prices."',
    about_photo: 'Tool display inside the CARBELEC store',
    contact_label: 'Contact', contact_title: 'Need a quote?', contact_desc: 'Buy on MercadoLibre or request a wholesale quote via WhatsApp.',
    co_addr: 'Address', co_phones: 'Phones', co_wa_d: 'Fast quotes', co_hours: 'Opening hours',
    co_hours_d: 'Mon — Fri: 8:30am – 7:00pm<br>Saturdays: 9:30am – 6:00pm',
    form_title: 'Request a quote', form_name: 'Name', form_phone: 'Phone', form_company: 'Company (optional)', form_msg: 'What products do you need?', form_send: 'Send via WhatsApp',
    ft_desc: '<strong>CARBELEC — Carbon Electric S.A.S.</strong><br>Sellers, distributors and importers of hardware, electrical supplies and spare parts. Bogotá, Colombia.',
    ft_nav: 'Navigation', ft_buy: 'Shop', ft_rights: 'All rights reserved.', ft_privacy: 'Privacy policy'
  },
  pt: {
    meta_title: 'CARBELEC S.A.S. | Carbon Electric — Ferragem em Bogotá',
    meta_desc: 'Ferragem CARBELEC em Bogotá. Mais de 1.600 produtos de ferragens, elétricos, peças e ferramentas. Frete grátis para toda a Colômbia.',
    nav_home: 'Início', nav_cat: 'Categorias', nav_prod: 'Produtos', nav_about: 'Sobre', nav_contact: 'Contato', nav_shop: 'Loja', menu: 'Menu',
    hero_title: 'Sua ferragem de <em>confiança</em>.', hero_btn_catalog: 'Ver o catálogo',
    hero_sub: 'Ferramentas profissionais, elétricos, peças de reposição e segurança industrial. De Bogotá para toda a Colômbia.',
    hero_btn_ml: 'Comprar no MercadoLibre', hero_btn_wa: 'Solicitar Orçamento',
    stat_products_n: '1.665+', stat_products: 'Produtos', stat_brands: 'Marcas', stat_rating: 'Avaliação',
    cat_label: 'O que oferecemos', cat_title: 'Nossas categorias.', cat_desc: 'Tudo o que você precisa para seus projetos.',
    cat_tools: 'Ferramentas', cat_tools_d: 'Furadeiras, chaves, alicates, brocas',
    cat_safety: 'Segurança Industrial', cat_safety_d: 'Respiradores, luvas, óculos',
    cat_elec: 'Elétricos', cat_elec_d: 'Tomadas, cabos, extensões, lâmpadas',
    cat_home: 'Casa', cat_home_d: 'Encanamento, fechaduras, jardim, cozinha',
    cat_parts: 'Peças de Reposição', cat_parts_d: 'Escovas de carvão, induzidos, interruptores',
    cat_build: 'Construção', cat_build_d: 'Fitas, adesivos, selantes',
    pg_search: 'Buscar por nome, marca ou referência', pg_count: '{n} produtos',
    hero_search: 'Que produto você procura?', hero_search_btn: 'Buscar',
    pg_brand: 'Marca', pg_brand_all: 'Todas as marcas', pg_sort: 'Ordenar',
    sort_rel: 'Destaques primeiro', sort_asc: 'Preço: menor para maior', sort_desc: 'Preço: maior para menor', sort_az: 'Nome: A a Z',
    pc_add: 'Adicionar ao meu orçamento', pc_added: 'Remover do meu orçamento',
    q_title: 'Meu orçamento', q_close: 'Fechar', q_total: 'Total de referência', q_qty: 'Quantidade', q_remove: 'Remover', q_each: 'cada',
    q_note: 'Os preços são de referência. Confirmamos disponibilidade e preço final na resposta.',
    q_wa: 'Enviar pelo WhatsApp', q_mail: 'Enviar por e-mail', q_clear: 'Esvaziar lista',
    sub_all: 'Todos', sub_escobillas: 'Escovas de carvão', sub_inducidos: 'Induzidos e rotores', sub_interruptores: 'Interruptores',
    sub_rodamientos: 'Rolamentos', sub_campos: 'Bobinas de campo', sub_mandriles: 'Mandris', sub_otros: 'Outras peças',
    co_map: 'Como chegar', ft_catalog: 'Catálogo completo',
    prod_label: 'Catálogo', prod_title: 'Nossos produtos.', prod_desc: 'Preços de referência em pesos colombianos (COP). O preço final é o publicado no MercadoLibre.',
    pill_all: 'Todos', pill_safety: 'Segurança',
    prod_cta: 'Ver 1.665 produtos no MercadoLibre',
    cat_meta_title: 'Catálogo | CARBELEC', cat_meta_desc: 'Catálogo CARBELEC: 1.665 produtos de ferragens, peças de reposição, elétricos e segurança com preços de referência. Bogotá, Colômbia.',
    pcats: 'Catálogo em lista, por categoria:', pg_fail: 'Não foi possível carregar o catálogo. Recarregue a página ou consulte por categoria abaixo.',
    nf_title: 'Não encontramos essa página.', nf_text: 'O produto pode não estar mais disponível ou o endereço pode ter mudado.',
    feat_label: 'Destaques', feat_title: 'Produtos em destaque.', feat_cta: 'Ver o catálogo completo',
    pd_note: 'Preço de referência. O preço final e a disponibilidade são os publicados no MercadoLibre.',
    pd_wa: 'Orçar pelo WhatsApp', pd_more: 'Ver mais produtos desta categoria', rel_title: 'Produtos relacionados',
    prod_more: 'Ver mais produtos', pc_best: 'Mais Vendido', pc_ask: 'Consultar preço', pc_wa: 'Perguntar pelo WhatsApp', wa_fab: 'Fale conosco pelo WhatsApp', hero_btn_chat: 'Fale pelo WhatsApp', form_alt: 'Prefere uma resposta mais rápida?',
    empty_a: 'Não encontramos produtos para essa busca. Procure no', empty_b: 'ou peça pelo',
    about_label: 'Nossa história', about_title: 'Mais que uma ferragem.', about_desc: 'Seu aliado para projetos profissionais e domésticos.',
    about_p1: '<strong>CARBELEC — Carbon Electric S.A.S.</strong> Somos comerciantes, distribuidores e importadores de ferragens, materiais elétricos e peças de reposição. Fatura eletrônica e loja física em Bogotá.',
    about_p2: 'Mais de 60 marcas: Truper, Bosch, DeWalt, Total, Makita, Stanley, 3M, Pretul, Black+Decker, Toolcraft, Schneider Electric. Atacado e varejo.',
    feat_ship: 'Frete Grátis', feat_ship_d: 'Para toda a Colômbia pelo MercadoLibre',
    feat_inv: 'Fatura Eletrônica', feat_inv_d: 'Compras a partir de $25.000',
    feat_store: 'Loja Física', feat_whole: 'Atacado e Varejo', feat_whole_d: 'Parcelas sem juros no MercadoLibre',
    quote_rating: 'Avaliação no Google',
    test_label: 'Depoimentos', test_title: 'O que nossos clientes dizem.',
    test_1: '"Empresa muito séria, com bons produtos a um preço excelente. Atendimento atencioso."',
    test_2: '"Excelente serviço e grande variedade. Encontrei a peça de reposição para a minha esmerilhadeira."',
    test_3: '"Têm de tudo em ferragens e elétricos. Preços competitivos."',
    about_photo: 'Expositor de ferramentas na loja CARBELEC',
    contact_label: 'Contato', contact_title: 'Precisa de um orçamento?', contact_desc: 'Compre no MercadoLibre ou solicite orçamento por WhatsApp.',
    co_addr: 'Endereço', co_phones: 'Telefones', co_wa_d: 'Orçamentos rápidos', co_hours: 'Horário',
    co_hours_d: 'Seg — Sex: 8:30 – 19:00<br>Sábados: 9:30 – 18:00',
    form_title: 'Solicitar orçamento', form_name: 'Nome', form_phone: 'Telefone', form_company: 'Empresa (opcional)', form_msg: 'Quais produtos você precisa?', form_send: 'Enviar pelo WhatsApp',
    ft_desc: '<strong>CARBELEC — Carbon Electric S.A.S.</strong><br>Comerciantes, distribuidores e importadores de ferragens, materiais elétricos e peças de reposição. Bogotá, Colômbia.',
    ft_nav: 'Navegação', ft_buy: 'Comprar', ft_rights: 'Todos os direitos reservados.', ft_privacy: 'Política de privacidade'
  }
};

// Email quotation form copy.
for (const [language, copy] of Object.entries({"es":{"hero_btn_wa":"Solicitar cotización","contact_desc":"Compra en MercadoLibre o solicita una cotización por correo desde este formulario.","form_name":"Nombre","form_phone_optional":"Teléfono (opcional)","form_email":"Correo electrónico","form_company":"Empresa (opcional)","form_msg":"Productos y cantidades que necesitas","form_send":"Enviar solicitud por correo","form_required":"Nombre, correo y productos son obligatorios.","form_notice":"Usamos FormSubmit para procesar tus datos y enviar esta solicitud por correo a CARBELEC.","form_privacy":"Consulta nuestra política de privacidad.","form_sending":"Enviando…","form_sent":"Solicitud enviada. Gracias por contactar a CARBELEC.","form_invalid":"Revisa los campos obligatorios y escribe un correo válido.","form_error":"No se pudo confirmar el envío. Tus datos siguen aquí; intenta de nuevo más tarde.","form_activation":"El servicio de envío no está disponible en este momento. Tus datos siguen aquí; inténtalo más tarde.","form_uncertain":"No pudimos confirmar el envío. Es posible que la solicitud ya se haya recibido. Tus datos siguen aquí; reintentar puede duplicarla.","form_duplicate":"Esta solicitud ya fue aceptada para envío. Cambia los datos si necesitas enviar otra.","form_wait":"Espera unos segundos antes de volver a intentar.","form_retry":"Reintentar aunque pueda duplicarse"},"en":{"hero_btn_wa":"Request a quote","contact_desc":"Shop on MercadoLibre or request a quote by email using this form.","form_name":"Name","form_phone_optional":"Phone (optional)","form_email":"Email address","form_company":"Company (optional)","form_msg":"Products and quantities you need","form_send":"Send request by email","form_required":"Name, email and products are required.","form_notice":"We use FormSubmit to process your details and email this request to CARBELEC.","form_privacy":"Read our privacy policy.","form_sending":"Sending…","form_sent":"Request sent. Thank you for contacting CARBELEC.","form_invalid":"Check the required fields and enter a valid email address.","form_error":"Sending could not be confirmed. Your details remain here; please try again later.","form_activation":"The sending service is temporarily unavailable. Your details remain here; please try again later.","form_uncertain":"Sending could not be confirmed. Your request may already have been received. Your details remain here; retrying may send a duplicate.","form_duplicate":"This request was already accepted for sending. Change the details if you need to send another.","form_wait":"Wait a few seconds before trying again.","form_retry":"Retry even if it may duplicate the request"},"pt":{"hero_btn_wa":"Solicitar orçamento","contact_desc":"Compre no MercadoLibre ou solicite um orçamento por e-mail neste formulário.","form_name":"Nome","form_phone_optional":"Telefone (opcional)","form_email":"E-mail","form_company":"Empresa (opcional)","form_msg":"Produtos e quantidades de que precisa","form_send":"Enviar solicitação por e-mail","form_required":"Nome, e-mail e produtos são obrigatórios.","form_notice":"Usamos o FormSubmit para processar seus dados e enviar esta solicitação por e-mail à CARBELEC.","form_privacy":"Leia nossa política de privacidade.","form_sending":"Enviando…","form_sent":"Solicitação enviada. Obrigado por entrar em contato com a CARBELEC.","form_invalid":"Confira os campos obrigatórios e informe um e-mail válido.","form_error":"Não foi possível confirmar o envio. Seus dados continuam aqui; tente novamente mais tarde.","form_activation":"O serviço de envio está temporariamente indisponível. Seus dados continuam aqui; tente mais tarde.","form_uncertain":"Não foi possível confirmar o envio. A solicitação pode já ter sido recebida. Seus dados continuam aqui; tentar novamente pode duplicá-la.","form_duplicate":"Esta solicitação já foi aceita para envio. Altere os dados se precisar enviar outra.","form_wait":"Aguarde alguns segundos antes de tentar novamente.","form_retry":"Tentar novamente mesmo com risco de duplicação"}})) Object.assign(I18N[language], copy);

/* ── Helpers ────────────────────────────────────────────── */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const pesos = new Intl.NumberFormat('es-CO');
export const fmt = v => '$' + pesos.format(v);
export const waUrl = text => 'https://wa.me/' + WA_PHONE + (text ? '?text=' + encodeURIComponent(text) : '');
// localStorage can be unavailable (private browsing, blocked cookies); the page must work without it.
export const store = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ignore */ } }
};

/* ── Languages ──────────────────────────────────────────── */
let lang = 'es';
export const getLang = () => lang;
// Lower case without accents, so "electrico" finds "Eléctrico".
export const fold = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const t = key => (I18N[lang] && I18N[lang][key]) || I18N.es[key] || '';
// data-i18n-attr="placeholder:key;aria-label:key"
const attrPairs = el => el.dataset.i18nAttr.split(';').map(pair => pair.split(':').map(s => s.trim()));

export function readSpanishFromPage() {
  const keep = (key, value) => { if (!(key in I18N.es)) I18N.es[key] = value; };
  const titleKey = document.documentElement.dataset.titleKey;
  if (titleKey) {
    keep(titleKey + '_title', document.title);
    keep(titleKey + '_desc', $('meta[name="description"]').content);
  }
  $$('[data-i18n]').forEach(el => keep(el.dataset.i18n, el.textContent));
  $$('[data-i18n-html]').forEach(el => keep(el.dataset.i18nHtml, el.innerHTML));
  $$('[data-i18n-attr]').forEach(el => attrPairs(el).forEach(([attr, key]) => keep(key, el.getAttribute(attr))));
}

export function translate(root = document) {
  // Pages that name a title key on <html data-title-key="…"> get their title and description translated too.
  const titleKey = document.documentElement.dataset.titleKey;
  if (root === document && titleKey) {
    document.title = t(titleKey + '_title');
    $('meta[name="description"]').content = t(titleKey + '_desc');
  }
  const apply = (key, write) => { const text = t(key); if (text) write(text); };   // a missing text never blanks the page
  $$('[data-i18n]', root).forEach(el => apply(el.dataset.i18n, text => { el.textContent = text; }));
  $$('[data-i18n-html]', root).forEach(el => apply(el.dataset.i18nHtml, text => { el.innerHTML = text; }));
  $$('[data-i18n-attr]', root).forEach(el => attrPairs(el).forEach(([attr, key]) => apply(key, text => el.setAttribute(attr, text))));
}

export function setLang(next, remember = true) {
  lang = LANGS.includes(next) ? next : 'es';
  document.documentElement.lang = lang;
  translate();
  $$('.lang-btn').forEach(btn => {
    const on = btn.dataset.lang === lang;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on);
  });
  if (remember) store.set(LANG_KEY, lang);
  // Other modules (catalog, quote list, chatbot) follow the language through this event.
  document.dispatchEvent(new CustomEvent('carbelec:lang', { detail: { lang } }));
}

export const savedLang = () => {
  const saved = store.get(LANG_KEY);
  return saved && LANGS.includes(saved) ? saved : 'es';
};

// Each feature starts on its own: if one fails, the error goes to the console and the rest of the page keeps working.
export const start = (name, init) => { try { init(); } catch (err) { console.error('[CARBELEC] ' + name + ':', err); } };
