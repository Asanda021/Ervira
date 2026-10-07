import fs from "node:fs";
import path from "node:path";

const ids = Array.from({ length: 10 }, (_, i) => "p" + (i + 41));
for (const id of ids) {
  const d = JSON.parse(fs.readFileSync(path.join("website", "data", "structuralpro-" + id + ".json"), "utf8"));
  if (d.product_id !== "structuralpro" ||
      d.parent_platform !== "ERVIRA" ||
      d.version !== "0.1.0" ||
      d.runtime_status !== "implemented" ||
      d.release_ready !== false) {
    throw new Error("License governance mismatch " + id);
  }
}
console.log("P41-P50 license parity PASS");
