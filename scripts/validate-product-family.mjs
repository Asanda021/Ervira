import fs from "node:fs";

const catalogPath = "data/structuralpro-product-family.json";
const pagePath = "product-family.html";
const data = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
if (data.product !== "structuralpro" || data.platform !== "ERVIRA") throw new Error("invalid catalog identity");
if (!Array.isArray(data.editions) || data.editions.length !== 4) throw new Error("expected four editions");

const allowedTypes = new Set(["Standalone", "Module", "Pack", "SDK / API"]);
const allowedStatus = new Set(["Part of StructuralPro", "Coming Soon", "Available", "Add-on"]);
const ids = new Set();

for (const category of data.categories) {
  if (!category.id || !category.name || !Array.isArray(category.items)) throw new Error("invalid category");
  for (const item of category.items) {
    if (item.length !== 4) throw new Error("invalid product tuple");
    if (ids.has(item[0])) throw new Error("duplicate product id " + item[0]);
    ids.add(item[0]);
    if (!allowedTypes.has(item[2])) throw new Error("invalid type " + item[2]);
    if (!allowedStatus.has(item[3])) throw new Error("invalid status " + item[3]);
  }
}
if (ids.size < 40) throw new Error("catalog unexpectedly small");

const page = fs.readFileSync(pagePath, "utf8");
for (const required of ["css/product-family.css", "js/product-family.js", catalogPath]) {
  if (!page.includes(required)) throw new Error("missing page wiring: " + required);
}

console.log("Product Family catalog valid:", ids.size, "items");
console.log("Product Family page wiring valid");
