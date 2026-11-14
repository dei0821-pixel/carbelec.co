# Catalog tools

The site is static. Two scripts turn a MercadoLibre listing export into what the site serves.

## Updating prices and products

1. Get a fresh export of the store listing as a JSON list of `{id, name, img, price, url}` and save it as
   `tools/data/mercadolibre-export.json` (the file in the repository is the export of 14 November 2026).
2. Rebuild the catalog. Photos already in `assets/catalog/` are kept; missing ones are downloaded and
   resized (needs Python 3 with Pillow, and `curl`):

       python3 tools/import_catalog.py

3. Rebuild the product pages, category pages and sitemap (needs Node.js 18 or later):

       node tools/build_pages.mjs

4. Open `index.html` through a local web server (`python3 -m http.server`) and check the catalog, then commit.

## What each script writes

| Script | Reads | Writes |
|---|---|---|
| `import_catalog.py` | the export, `index.html` (ids of featured products) | `assets/catalog.json`, new photos in `assets/catalog/` |
| `build_pages.mjs` | `index.html` (featured products), `assets/catalog.json` | `p/*.html`, `catalogo/*.html`, `sitemap.xml` |

## Editing by hand

- **Featured products** are the `PRODUCTS` list in `index.html`. Each has the `id` of its MercadoLibre listing;
  `import_catalog.py` leaves those listings out of `catalog.json` so they are not shown twice.
- **Category, brand or name of one product**: edit its row in `assets/catalog.json`
  (`[id, name, price, category, brand, MercadoLibre address]`) and run `build_pages.mjs`. A later import
  overwrites manual edits, so lasting fixes belong in the rules at the top of `import_catalog.py`.
- **Categories** are `herramientas`, `repuestos`, `electricos`, `hogar`, `construccion` and `seguridad`. Adding one
  needs a filter button and a category card in `index.html` and an entry in `CATEGORIES` in `build_pages.mjs`.

Files in `p/` and `catalogo/` are generated: do not edit them, they are rewritten on every build.
