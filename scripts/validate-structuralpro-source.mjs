import fs from "node:fs";
import https from "node:https";

const canonicalUrl = "https://raw.githubusercontent.com/Asanda021/StructuralPro/main/contracts/product-contract.json";
const mirrorPath = "website/data/structuralpro-product.json";

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "ERVIRA-product-source-gate" } }, res => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { body += chunk; });
      res.on("end", () => {
        if (res.statusCode !== 200) reject(new Error("Canonical contract HTTP " + res.statusCode));
        else resolve(body);
      });
    }).on("error", reject);
  });
}

const canonical = JSON.parse(await fetchText(canonicalUrl));
const mirror = JSON.parse(fs.readFileSync(mirrorPath, "utf8"));

const pick = value => ({
  schema_version: value.schema_version,
  product_id: value.product_id,
  product_name: value.product_name,
  parent_platform: value.parent_platform,
  product: value.product,
  capabilities: value.capabilities,
  editions: value.editions,
  release: value.release
});

if (JSON.stringify(pick(canonical)) !== JSON.stringify(pick(mirror))) {
  console.error("StructuralPro source-of-truth mismatch.");
  process.exit(1);
}

console.log("StructuralPro product contract parity: PASS");
