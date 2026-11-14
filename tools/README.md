# Catalog tools

The site is static. Two scripts turn a MercadoLibre listing export into what the site serves.

## Updating prices and products

1. Get a fresh export of the store listing as a JSON list of `{id, name, img, price, url}` and save it as
   `data/mercadolibre-export.json` (the file in the repository is the export of 14 November 2026).
2. Rebuild the catalog. Photos already in `assets/catalog/` are kept; missing ones are downloaded and
   resized (needs Python 3 with Pillow, and `curl`):

       python3 tools/import_catalog.py

3. Rebuild the pages and the sitemap (needs Node.js 22):

       npm run build

4. Run `npm test`, look at the site with `npm run serve`, then commit everything.

## Translations

`assets/catalog.en.json` and `assets/catalog.pt.json` hold the product names in English and Portuguese, keyed by
product id. They are edited by hand: neither script writes them. After an import, new products have no entry
there and are shown in Spanish until one is added.

## What each script writes

| Script | Reads | Writes |
|---|---|---|
| `import_catalog.py` | the export, `data/featured.json` | `assets/catalog.json`, new photos in `assets/catalog/` |
| `build.mjs` | `src/`, `data/featured.json`, `assets/catalog.json` | `index.html`, `404.html`, `catalogo/*.html`, `p/*.html`, `sitemap.xml` |

## Editing by hand

- **Featured products** are `data/featured.json`. They come first in the catalog and the first eight are shown on
  the home page. Each has the `id` of its MercadoLibre listing; run both scripts after changing the file.
- **Category, brand or name of one product**: edit its row in `assets/catalog.json`
  (`[id, name, price, category, brand, MercadoLibre address]`) and run the build. A later import overwrites
  manual edits, so lasting fixes belong in the rules at the top of `import_catalog.py`.
- **Categories** are listed in `CATEGORIES` in `build.mjs`; a new one also needs a filter button in
  `src/pages/catalog.html`, a card in `src/pages/home.html` and its texts in `assets/js/core.js`.
- **Texts** of the menu, footer and pages are in `src/`; their English and Portuguese versions are in
  `assets/js/core.js`.

The generated pages are rewritten on every build: never edit `index.html`, `catalogo/` or `p/` directly.
