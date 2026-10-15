import fs from "node:fs";
import { resolveStructuralProContract } from "./resolve-structuralpro-contract.mjs";

const mirrorPath = "website/data/structuralpro-product.json";

const canonical = await resolveStructuralProContract();
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
