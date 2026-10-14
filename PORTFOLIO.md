# ERVIRA portfolio transition

The canonical GitHub Pages website is now `public/`. The previous software storefront has been intentionally retained in the repository history/root for recovery, but is excluded from Pages deployment.

## Public pages
- `public/index.html` portfolio landing page.
- `public/works/dashboard.html` interactive fictional six-month data dashboard with CSV export.
- `public/works/invoice.html` editable fictional service estimate with discount/tax and CSV/print.
- `public/works/text.html` in-browser Persian text normalization, copy and TXT export.
- `public/works/presentation.html` four-slide fictional business report.

## Integrity
- Every example is marked as **educational / fictional**, not a paid-client commission.
- Data is processed in the browser; no form backend is implied.
- `hello@ervira.ir` is an email address already present in the old legal page, but delivery must be verified before promoting the website broadly.
- No StructuralPro release or license/payment claims.
- Publication is done by GitHub Pages when `main` changes. Changes to this feature branch do not publish automatically.
- Domain DNS / HTTPS reachability must be checked separately.

## Check list
1. Verify links on each page and mobile navigation.
2. Change filters and export dashboard CSV.
3. Change invoice quantities/rates; add and remove rows; test export and print.
4. Normalize Arabic yeh/kaf and English/Arabic numerals; test TXT export.
5. Navigate slides using buttons and keyboard.
6. Check Persian writing, RTL layout, semantics, focus ring and mobile breakpoints.
7. Test the mailto destination with a real inbox once owner confirms it is configured.
