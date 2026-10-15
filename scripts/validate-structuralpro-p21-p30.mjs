import fs from "node:fs";
import path from "node:path";
import { resolveStructuralProContract } from "./resolve-structuralpro-contract.mjs";

const root = process.cwd();
const ids = Array.from({length: 10}, (_, i) => "p" + String(i + 21).padStart(2, "0"));

function read(p) {
  return JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
}

const main = async () => {
  const contract = await resolveStructuralProContract();
  for (const id of ids) {
    const d = read("website/data/structuralpro-" + id + ".json");
    if (d.product_id !== contract.product_id || d.parent_platform !== "ERVIRA" || d.version !== contract.product.current_version || d.phase !== id.toUpperCase()) {
      throw Error("Parity mismatch " + id);
    }
  }
  const p26 = read("website/data/structuralpro-p26.json");
  if (p26.integrity.download_enabled !== false) throw Error("Download gate violated");
  const p30 = read("website/data/structuralpro-p30.json");
  if (p30.governance.release_ready) throw Error("Governance gate violated");
  console.log("P21-P30 parity PASS");
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
