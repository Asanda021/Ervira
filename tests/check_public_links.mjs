import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("public");
const htmlFiles = [];
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(full);
    else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(full);
  }
}
visit(root);
const failures = [];
let checked = 0;
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

for (const file of htmlFiles) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const source = fs.readFileSync(file, "utf8");
  for (const [, , raw] of source.matchAll(/\b(?:href|src)\s*=\s*(['"])(.*?)\1/gi)) {
    const value = raw.trim();
    if (!value || value.startsWith("#") || /^(?:https?:|mailto:|tel:|data:|javascript:|blob:)/i.test(value)) continue;
    let url;
    try { url = new URL(value, `https://ervira.ir/${relative}`); }
    catch { failures.push(`${relative}: malformed route ${value}`); continue; }
    if (url.hostname !== "ervira.ir") continue;
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { failures.push(`${relative}: malformed path encoding in ${value}`); continue; }
    let target = path.resolve(root, `.${pathname}`);
    if (pathname.endsWith("/")) target = path.join(target, "index.html");
    else if (!path.extname(pathname)) {
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
      else target += ".html";
    }
    checked += 1;
    if (!fs.existsSync(target)) {
      failures.push(`${relative}: missing ${value}`);
      continue;
    }
    if (url.hash && target.endsWith(".html")) {
      let fragment;
      try { fragment = decodeURIComponent(url.hash.slice(1)); }
      catch { failures.push(`${relative}: malformed fragment in ${value}`); continue; }
      if (!fragment) continue;
      const targetHTML = fs.readFileSync(target, "utf8");
      const anchor = new RegExp(`(?:id|name)=["']${escapeRegExp(fragment)}["']`);
      if (!anchor.test(targetHTML)) failures.push(`${relative}: missing fragment ${value}`);
    }
  }
}
assert.deepEqual(failures, [], `Broken internal public links:\n${failures.join("\n")}`);
console.log(`PASS: ${htmlFiles.length} published HTML pages and ${checked} local destinations/anchors verified.`);
