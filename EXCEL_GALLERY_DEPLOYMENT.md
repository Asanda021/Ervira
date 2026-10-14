# ERVIRA · Excel Portfolio Gallery Deployment

## Summary
- Branch: `feat/excel-portfolio-gallery-20261014`
- Public gallery: `public/excel/index.html`
- Ten unique pages: `sales, inventory, budget, attendance, costing, receivables, gantt, cleaning, survey, branches`.
- Gallery is available after merging and successful Pages deployment.

## Binary asset hand-off
The ten .xlsx workbooks and ten actual dashboard previews were generated in the ChatGPT working environment and verified structurally. The current GitHub connector writes UTF-8 text but does not take these conversation binary files as direct upload inputs. Do not claim they were uploaded to GitHub.

A ready archive named `ERVIRA_Excel_Website_Assets_READY.zip` was produced for import. **Extract it** to these relative paths beneath the repository's `public` directory:

- `public/excel/downloads/01_ERVIRA_Sales_Intelligence.xlsx` ... `10_ERVIRA_Branch_Performance.xlsx`
- `public/excel/previews/01_Dashboard_Preview.png` ... `10_Dashboard_Preview.png`

Do not upload the ZIP itself as a single file and expect GitHub Pages to extract it. The Pages workflow simply publishes `public/`.

The site intentionally keeps binary download links hidden until a real same-origin response is found; otherwise it displays an honest download-pending message. Gallery media uses a labeled CSS schematic fallback until a real PNG is available.

## Quality controls performed on text website
- JavaScript syntax valid
- 10/10 links and separate detail pages exist
- All gallery filters have matching cards
- Sitemap contains all 10 pages
- Homepage links to gallery
- Binary links remain gated while unavailable

## Further checks
- Upload binaries and verify all 20 paths.
- Test files in Microsoft Excel for Windows and validate all formula results.
- Inspect 320px / 768px / 1440px widths in browsers, RTL and links.
- Verify public HTTPS domain, Cloudflare delegation and GitHub Pages publication.
- Avoid client identity claims: all data are synthetic.
