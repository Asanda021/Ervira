#!/usr/bin/env python3
"""Complete factual crawl and social metadata for the actual GitHub Pages tree."""
from __future__ import annotations
import html
import re
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent / "public"
PRIVATE = {"about.html", "404.html"}

for path in ROOT.rglob("*.html"):
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith("concept/"):
        continue
    source = path.read_text(encoding="utf-8")
    title_match = re.search(r"<title>(.*?)</title>", source, re.I | re.S)
    description_match = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', source, re.I)
    title = html.unescape(re.sub(r"\s+", " ", title_match.group(1).strip())) if title_match else "ERVIRA | خدمات دیجیتال"
    description = html.unescape(description_match.group(1)) if description_match else "خدمات دیجیتال ERVIRA و نمونه‌کارهای مستقل و آموزشی قابل بررسی."
    canonical_match = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', source, re.I)
    if not canonical_match and rel not in PRIVATE:
        if rel == "index.html": url = "https://ervira.ir/"
        elif rel.endswith("/index.html"): url = "https://ervira.ir/" + rel[:-len("index.html")]
        else: url = "https://ervira.ir/" + rel
        tag = f'<link rel="canonical" href="{url}">'
        source = re.sub(r"</head>", f"  {tag}\n</head>", source, count=1, flags=re.I)
        canonical_match = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', source, re.I)
    if not re.search(r'<meta\s+name="robots"', source, re.I):
        directive = "noindex,nofollow" if rel in PRIVATE else "index,follow"
        source = re.sub(r"</head>", f'  <meta name="robots" content="{directive}">\n</head>', source, count=1, flags=re.I)
    if rel not in PRIVATE:
        canonical = canonical_match.group(1) if canonical_match else ""
        values = {
            "og:type": "website",
            "og:site_name": "ERVIRA",
            "og:locale": "fa_IR",
            "og:title": title,
            "og:description": description,
            "og:url": canonical,
            "twitter:card": "summary",
            "twitter:title": title,
            "twitter:description": description,
        }
        for key, value in values.items():
            attr = "property" if key.startswith("og:") else "name"
            if not re.search(fr'<meta\s+{attr}="{re.escape(key)}"', source, re.I):
                tag = f'<meta {attr}="{key}" content="{html.escape(value, quote=True)}">'
                source = re.sub(r"</head>", f"  {tag}\n</head>", source, count=1, flags=re.I)
    path.write_text(source, encoding="utf-8")

urls: list[str] = []
for path in sorted(ROOT.rglob("*.html")):
    rel = path.relative_to(ROOT).as_posix()
    if rel in PRIVATE or rel.startswith("concept/"):
        continue
    source = path.read_text(encoding="utf-8")
    if re.search(r'<meta\s+name="robots"\s+content="noindex,nofollow"', source, re.I):
        continue
    match = re.search(r'<link\s+rel="canonical"\s+href="(https://ervira\.ir/[^"]*)"', source, re.I)
    if match:
        urls.append(match.group(1))
if len(urls) != len(set(urls)):
    raise ValueError("Duplicate canonical URL in public Pages output.")
if any(re.match(r"https://ervira\.ir/(?:products/|account\.html|pricing\.html|checkout\.html|dashboard\.html|product-family\.html)", url) for url in urls):
    raise ValueError("Inactive product route must not appear in public sitemap.")
sitemap = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{escape(url)}</loc></url>\n" for url in urls)
    + "</urlset>\n"
)
(ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
print(f"Completed metadata for {len(urls)} public routes; sitemap excludes the owner draft.")
