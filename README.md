# carbelec.co

Sitio de CARBELEC — Carbon Electric S.A.S. It is a static site served by GitHub Pages from `main`.

## Layout

| Path | What it is |
|---|---|
| `src/` | Page sources: `pages/home.html`, `pages/catalog.html` and the shared `partials/` (menu, footer) |
| `data/` | `featured.json` (hand-written featured products) and the MercadoLibre listing export |
| `assets/` | Styles (`site.css`), scripts (`js/`), icons, photos and the catalog data (`catalog*.json`) |
| `tools/` | `import_catalog.py` (export → catalog) and `build.mjs` (sources → pages) |
| `tests/` | Browser smoke tests |
| `index.html`, `404.html`, `catalogo/`, `p/`, `sitemap.xml` | **Generated** by `tools/build.mjs`. Do not edit by hand |
| `privacidad/` | Privacy policy, written by hand |

## Working on it

    npm install && npx playwright install chromium    # once
    npm run build                                     # after changing src/, data/ or assets/catalog.json
    npm run serve                                     # http://localhost:8080
    npm test

Pull requests run the build check and the tests automatically (`.github/workflows/pruebas.yml`).
`tools/README.md` explains how to update products and prices.
