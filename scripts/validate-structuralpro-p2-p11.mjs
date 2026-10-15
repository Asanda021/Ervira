import fs from "node:fs";
import path from "node:path";
import { resolveStructuralProContract } from "./resolve-structuralpro-contract.mjs";

const root = process.cwd();
const files = Array.from({length: 10}, (_, i) => "p" + String(i + 2).padStart(2, "0"));
function read(p) { return JSON.parse(fs.readFileSync(path.join(root, "website", "data", "structuralpro-" + p + ".json"), "utf8")); }
const main = async () => {
  const canonical = await resolveStructuralProContract();
  for (const id of files) {
    const local = read(id);
    if (local.product_id !== canonical.product_id || local.parent_platform !== "ERVIRA" || local.version !== canonical.product.current_version || local.phase !== "P" + Number(id.slice(1))) throw new Error("Parity mismatch: " + id);
  }
  const p2 = read("p02");
  const a = Object.fromEntries(canonical.capabilities.map(x => [x.id, x.status]));
  const b = Object.fromEntries(p2.capabilities.map(x => [x.id, x.status]));
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error("P2 capability mismatch");
  const p4 = read("p04");
  if (p4.release.download_enabled !== false || p4.release.artifact !== null || p4.release.sha256 !== null) throw new Error("P4 download gate violated");
  const p3 = read("p03");
  if (p3.editions.some(x => x.status !== "planned")) throw new Error("P3 edition gate violated");
  console.log("ERVIRA StructuralPro P2-P11 parity: PASS");
};
main().catch(err => { console.error(err); process.exit(1); });
