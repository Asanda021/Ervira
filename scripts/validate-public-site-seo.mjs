import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("public");
const pages = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".html")) pages.push(full);
  }
}
walk(root);
const publicPages = pages.filter(file => {
  const rel = path.relative(root, file).replaceAll(path.sep, "/");
  const html = fs.readFileSync(file, "utf8");
  return rel !== "404.html" && rel !== "about.html" && !rel.startsWith("concept/") && /<meta\s+name="robots"\s+content="index,follow"/i.test(html);
});
const canonicalByFile = new Map();
const canonicalFiles = new Map();
for (const file of publicPages) {
  const rel = path.relative(root, file).replaceAll(path.sep, "/");
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /<html\b[^>]*lang="fa"[^>]*dir="rtl"|<html\b[^>]*dir="rtl"[^>]*lang="fa"/i, `${rel}: Persian RTL document declaration is required`);
  assert.match(html, /<title>[^<]{5,200}<\/title>/i, `${rel}: missing page title`);
  assert.match(html, /<meta\s+name="description"\s+content="[^"]{5,320}"/i, `${rel}: missing page description`);
  const canonical = html.match(/<link\s+rel="canonical"\s+href="(https:\/\/ervira\.ir\/[^"]*)"/i)?.[1];
  assert.ok(canonical, `${rel}: missing ERVIRA canonical URL`);
  assert.equal(canonicalFiles.has(canonical), false, `Duplicate canonical URL ${canonical}`);
  canonicalByFile.set(file, canonical);
  canonicalFiles.set(canonical, rel);
  for (const property of ["og:type", "og:site_name", "og:locale", "og:title", "og:description", "og:url"])
    assert.match(html, new RegExp(`<meta\\s+property="${property.replace(":", "\\:")}"`), `${rel}: missing ${property}`);
  assert.match(html, /<meta\s+name="twitter:card"/, `${rel}: missing Twitter card`);
}

const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
assert.match(robots, /Sitemap:\s*https:\/\/ervira\.ir\/sitemap\.xml/i);
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(locs.length, canonicalFiles.size, "Sitemap and indexable route counts must match");
assert.equal(new Set(locs).size, locs.length, "Sitemap must not duplicate routes");
for (const url of locs) {
  assert.ok(canonicalFiles.has(url), `Sitemap URL has no indexable page: ${url}`);
  const pathname = new URL(url).pathname;
  let local = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  if (local.endsWith("/")) local += "index.html";
  else if (!path.extname(local)) local += ".html";
  assert.ok(fs.existsSync(path.join(root, local)), `Sitemap points to missing Pages output: ${url}`);
}
assert.doesNotMatch(sitemap, /ervira\.ir\/(?:products\/|account\.html|pricing\.html|checkout\.html|dashboard\.html|product-family\.html)/i);
assert.doesNotMatch(sitemap, /ervira\.ir\/(?:about\.html|concept\/)/i);
assert.match(fs.readFileSync(path.join(root, "about.html"), "utf8"), /<meta\s+name="robots"\s+content="noindex,nofollow"/i);
assert.doesNotMatch(fs.readFileSync(path.join(root, "index.html"), "utf8"), /StructuralPro|mailto:/i);
for (const file of pages) assert.doesNotMatch(fs.readFileSync(file, "utf8"), /mailto:hello@ervira\.ir/i, `${path.relative(root, file)}: unverified contact address`);

const pagesWorkflow = fs.readFileSync(path.resolve(".github/workflows/pages.yml"), "utf8");
assert.match(pagesWorkflow, /push:\s*\n\s*branches:\s*\[main\]/, "Pages must deploy from main only");
assert.doesNotMatch(pagesWorkflow, /^\s*pull_request:/m, "Pull requests must not deploy Pages");
console.log(`PASS: ${publicPages.length} public routes, canonical metadata, sitemap truth, private draft exclusion and main-only Pages deployment.`);
