#!/usr/bin/env python3
"""Rebuild assets/catalog.json (and missing photos) from a MercadoLibre listing export.

    python3 tools/import_catalog.py [data/mercadolibre-export.json]

The export is a JSON list of {id, name, img, price, url}, one entry per listing.
The featured products in data/featured.json are written first, with their own name, description and photo;
their listings are skipped so they are not shown twice.
After running this, run `node tools/build.mjs` to regenerate the pages and the sitemap.
"""
import json
import os
import re
import subprocess
import sys
import unicodedata

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPORT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, 'data', 'mercadolibre-export.json')
PHOTOS = os.path.join(REPO, 'assets', 'catalog')
PHOTO_SIZE = 640          # longest side, in pixels


def fold(text):
    """Lower case without accents."""
    return unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()


# ── Categories ─────────────────────────────────────────────────────────────
# The first rule that matches the folded name wins; anything unmatched is a tool.
TOOL_WORDS = (r'pulidora|taladro|esmeril|sierra|rotomartillo|amoladora|lijadora|caladora|ruteadora|router|'
              r'martillo demoledor|demoledor|tronzadora|cepillo electrico|atornillador|mototool|compresor|'
              r'hidrolavadora|guadana|motosierra|aspiradora|minipulidora|acolilladora|ingleteadora|'
              r'dewalt|bosch|makita|skil|black|stanley|milwaukee|hitachi|metabo|dw\d|gws|gsb|gbh|d28|dwe|dcd|hr\d|ga\d')

RULES = [
    # safety (checked first: 'cartuchos de repuesto' for a respirator is safety gear)
    ('seguridad', r'respirador|monogafa|gafas?\b|guantes?\b|^casco|orejera|tapones? (auditivos?|de oido|para oido)|tapabocas|mascarilla|arnes|'
                  r'rodillera|careta|chaleco|proteccion (auditiva|respiratoria|visual|ocular)|botas?\b|senal|'
                  r'cinta (de )?(peligro|seguridad|antideslizante|reflectiva)|cartucho.*(3m|vapor)|filtro.*3m|overol|delantal'),
    # kitchen and household appliances, before the generic spare-part rules
    ('hogar', r'\b(olla|estufa|licuadora|nevera|lavadora|lavaplatos|lavamanos|sanitario|inodoro|cisterna)\b|grival|cartucho ceramico'),
    ('construccion', r'soldadura (max )?(pvc|cpvc|liquida)'),
    # spare parts for power tools
    ('repuestos', r'^(inducido|rodamiento|platinera|bobina|campo|carcasa|mandril|guarda|centrifugo|pinon|'
                  r'portaescobillas|armadura|escobillas?|carbones|engranaje|rotor|buje|excentrica|golpeador|'
                  r'piston|transmision|diafragma|presostato|collet|broquero|acople|oring|eje|anillo|repuesto|'
                  r'estator|corona|biela|cilindro|selector|gatillo)\b'),
    ('repuestos', r'^par (de )?(escobillas|carbones)'),
    ('repuestos', r'^(interruptor|switch|boton|gatillo|cable|motor|tapa|base|manija|mango|caucho|resistencia|'
                  r'cuchillas?|ventilador|filtro|cargador|bateria|porta|brida|tuerca|junta)\b.*\b(' + TOOL_WORDS + r')'),
    ('repuestos', r'\b(de )?repuesto\b|\bpara (' + TOOL_WORDS + r')|\b(original|generico|generica|compatible)\b.*\b(' + TOOL_WORDS + r')|'
                  r'\b(' + TOOL_WORDS + r')\b.*\b(original|generico|generica)\b'),
    # electrical
    ('electricos', r'^(interruptor|switch|toma|tomacorriente|multitoma|multicontacto|extension|clavija|bombillo|'
                   r'timbre|contactor|cable|conector|pila|bateria|cargador|linterna|multimetro|probador|cautin|'
                   r'soldadura|breaker|taco|roseta|plafon|balasto|lampara|reflector|sensor|temporizador|'
                   r'adaptador|regulador de voltaje|canaleta|terminal|amarre|cinta aislante|pito|sonda|pasa|neutro)\b'),
    ('electricos', r'polo a tierra|circuitos|\b\d+ ?(amp|amperios)\b'),
    ('electricos', r'\b(electrico|electrica|voltios|amperios|led)\b.*\b(cable|bombillo|lampara|toma)\b|cinta aislante|encauchetado|duplex|rj45|utp'),
    # home, plumbing, garden
    ('hogar', r'^(ducha|regadera|griferia|grifo|llave (de )?(paso|jardin|terminal|bola|bano|cocina|regadera)|'
              r'registro|sifon|rejilla|valvula|flotador|herraje|manguera (de |para )?(jardin|riego|gas)|pistola .*manguera|acople.*manguera|'
              r'candado|cerradura|bisagra|pomo|chapa|bascula|calentador|insecticida|trampa|chupa|destapa|diablo|'
              r'limpiador|desengrasante|abrillantador|ganchos?|rodachines|ruedas|zocalo|embudo|sombrilla|'
              r'afilador|piedra afilar|tijeras? .*(podar|jardin|cocina)|pala|hacha|'
              r'neumatico|bomba .*inflar|inflador|calibrador llantas|lubricante|aceite|grasa|vaselina|aerosol|'
              r'tapon|codo|niple|racor|union|te\b|tubo|cortatubo|teflon|gastop)'),
    # construction and finishes
    ('construccion', r'^(silicona|sikaflex|sika|espuma|pegante|pegamento|pegadit|adhesivo|estuco|masilla|tapagoteras|'
                     r'sintesolda|concolor|mezcla|cemento|thinner|removedor|brocha|rodillo|llana|palustre|cinta (de )?(enmascarar|'
                     r'papel|malla|ducto|doble|montaje|teflon|empaque|transparente|pvc)|cinta\b|lija\b|pintura|laca|'
                     r'esmalte|barniz|impermeabilizante|sellador|clavos?|puntilla|tornillo|'
                     r'chazo|ancla|remache|grapa|alambre|bolsa|laminas?|marco|nivel|plomada|tiralineas|flexometro|'
                     r'cinta metrica|escuadra|carretilla|balde|mezcladora)'),
]


def classify(name):
    folded = fold(name)
    for category, pattern in RULES:
        if re.search(pattern, folded):
            return category
    return 'herramientas'


# ── Brands ─────────────────────────────────────────────────────────────────
BRANDS = ['Truper', 'Pretul', 'Total', 'DeWalt', 'Bosch', 'Makita', 'Stanley', 'Black+Decker', 'Black & Decker',
          'Black Decker', 'Skil', '3M', 'Sika', 'Steelpro', 'Toolcraft', 'Schneider', 'Energizer', 'Oster',
          'Uyustools', 'Hermex', 'Fiero', 'Foset', 'Volteck', 'Klintek', 'Wurth', 'Milwaukee', 'Hitachi',
          'Ingco', 'Corona', 'Globy', 'Pegadit', 'Loctite', 'Abro', 'WD-40', 'Irwin', 'Bellota', 'Diablo Rojo',
          'Wolfox', 'Kalley', 'Yale', 'Norton', 'Gricol', 'Grival', 'Levapan', 'Furius', 'Karson', 'Sata', 'Weg']


def brand_of(name):
    folded = fold(name)
    for brand in BRANDS:
        if re.search(r'(?<![a-z0-9])' + re.escape(fold(brand)) + r'(?![a-z0-9])', folded):
            return 'Black+Decker' if brand.startswith('Black') else brand
    return ''


# ── Names ──────────────────────────────────────────────────────────────────
# MercadoLibre titles come in "Title Case Of Every Word"; this makes them read like a catalog.
SMALL_WORDS = {'de', 'del', 'para', 'con', 'sin', 'y', 'o', 'en', 'por', 'a', 'al', 'el', 'la', 'los', 'las', 'x'}
UNITS = {'w': 'W', 'v': 'V', 'a': 'A', 'hz': 'Hz', 'kg': 'kg', 'g': 'g', 'gr': 'g', 'ml': 'ml', 'l': 'L', 'mm': 'mm',
         'cm': 'cm', 'm': 'm', 'mt': 'm', 'mts': 'm', 'psi': 'PSI', 'hp': 'HP', 'pzs': 'pzs', 'pcs': 'pzs', 'pz': 'pzs',
         'und': 'und', 'uds': 'und', 'unds': 'und', 'ud': 'und', 'pulg': 'pulg', 'cc': 'cc', 'mah': 'mAh', 'ah': 'Ah', 'kw': 'kW',
         'lb': 'lb', 'oz': 'oz', 'gal': 'gal', 'rpm': 'RPM', 'amp': 'A', 'nm': 'Nm'}
ACRONYMS = {'gbh', 'gws', 'gsb', 'gex', 'gks', 'gsr', 'dwe', 'dcd', 'sds', 'led', 'pvc', 'cpvc', 'utp', 'hdmi', 'npt', 'usb', 'epp', 'rj45'}
BRAND_CASE = {fold(b): b for b in BRANDS if ' ' not in b and '+' not in b and '&' not in b}


def clean_word(word, first, after_number=False):
    core = word.strip('.,;:()[]')
    if not core:
        return word
    folded = fold(core)
    if folded in BRAND_CASE:
        fixed = BRAND_CASE[folded]
    elif folded in ACRONYMS:
        fixed = core.upper()
    elif after_number and folded in UNITS:
        fixed = UNITS[folded]                         # "550 Ml" → "550 ml"
    elif not first and folded in SMALL_WORDS:
        fixed = folded
    else:
        unit = re.fullmatch(r'(\d+(?:[.,/]\d+)*)([a-z]+)', folded)
        if unit and unit.group(2) in UNITS:
            fixed = core[:len(unit.group(1))] + UNITS[unit.group(2)]
        elif re.search(r'\d', core) and re.search(r'[A-Za-z]', core) and len(core) >= 4:
            fixed = core.upper()                      # model references: Dwe4120 → DWE4120
        else:
            fixed = core
    return word.replace(core, fixed, 1)


def clean_name(name):
    name = re.sub(r'\s+', ' ', name.replace('\xa0', ' ')).strip()
    name = re.sub(r'\s+([,.;:])', r'\1', name)
    words = name.split(' ')
    return ' '.join(clean_word(word, index == 0, index > 0 and bool(re.fullmatch(r'\d+(?:[.,/]\d+)*', words[index - 1])))
                    for index, word in enumerate(words))


# ── Photos ─────────────────────────────────────────────────────────────────
def full_size_url(listing_img):
    """Listing thumbnails are D_Q_NP_2X_<key>-E.webp; the same key with D_NQ_NP_2X_…-F.webp is the full photo."""
    match = re.search(r'_(\d+-[A-Z]{3}\d+_\d+)-[A-Z]+\.webp$', listing_img)
    return 'https://http2.mlstatic.com/D_NQ_NP_2X_%s-F.webp' % match.group(1) if match else None


def ensure_photo(product_id, listing_img):
    target = os.path.join(PHOTOS, product_id + '.webp')
    if os.path.exists(target):
        return True
    from PIL import Image                              # only needed when a photo is missing
    url = full_size_url(listing_img)
    if not url:
        return False
    tmp = target + '.download'
    if subprocess.run(['curl', '-sS', '-f', '-m', '60', '-o', tmp, url]).returncode != 0:
        return False
    image = Image.open(tmp)
    image = image.convert('RGBA' if image.mode in ('RGBA', 'LA', 'P') else 'RGB')
    image.thumbnail((PHOTO_SIZE, PHOTO_SIZE), Image.LANCZOS)
    image.save(target, 'WEBP', quality=80, method=6)
    os.remove(tmp)
    return True


# ── Build ──────────────────────────────────────────────────────────────────
def address_of(url):
    """MercadoLibre address without scheme and query; the site adds the seller filter back."""
    address = url[len('https://'):].split('?')[0]
    assert re.fullmatch(r'(www|articulo)\.mercadolibre\.com\.co/[A-Za-z0-9_\-/.%]+', address), url
    return address


def main():
    listings = json.load(open(EXPORT, encoding='utf8'))
    featured = json.load(open(os.path.join(REPO, 'data', 'featured.json'), encoding='utf8'))
    featured_ids = {item['id'] for item in featured}
    assert len(featured_ids) == len(featured), 'duplicate id in data/featured.json'
    os.makedirs(PHOTOS, exist_ok=True)

    # Featured products come first and carry what the listing does not have: a hand-written name,
    # an optional description, the "best seller" mark and their own photo.
    rows = []
    for item in featured:
        extra = {'img': '/' + item['img'].lstrip('/')}
        if item.get('desc'):
            extra['desc'] = item['desc']
        if item.get('best'):
            extra['best'] = True
        rows.append([item['id'], item['name'], item['price'], item['cat'], item.get('brand', ''), address_of(item['url']), extra])

    no_photo = []
    for listing in listings:
        product_id = listing['id'].replace('-', '')
        assert re.fullmatch(r'MCO\d+', product_id), listing['id']
        if product_id in featured_ids:
            continue
        if not ensure_photo(product_id, listing['img']):
            no_photo.append(product_id)
            continue
        name = clean_name(listing['name'])
        # [id, name, price in COP, category, brand, MercadoLibre address]
        rows.append([product_id, name, int(re.sub(r'\D', '', listing['price'])), classify(name), brand_of(name), address_of(listing['url'])])

    with open(os.path.join(REPO, 'assets', 'catalog.json'), 'w', encoding='utf8') as out:
        json.dump(rows, out, ensure_ascii=False, separators=(',', ':'))
    print('%d products written (%d featured, %d from the listing); %d listings without photo'
          % (len(rows), len(featured), len(rows) - len(featured), len(no_photo)))


if __name__ == '__main__':
    main()
