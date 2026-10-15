/**
 * Resolve the StructuralPro contract without weakening ERVIRA's parity checks.
 * The historical URL is tried first. A narrowly scoped recovery repository is
 * permitted only on HTTP 404 and only if it identifies the original source.
 */
import https from "node:https";
const primary = "https://raw.githubusercontent.com/Asanda021/StructuralPro/main/contracts/product-contract.json";
const recovery = "https://raw.githubusercontent.com/Asanda021/StructuralPro-Recovery/main/contracts/product-contract.json";
const expectedSource = "Asanda021/StructuralPro";
const expectedPath = "contracts/product-contract.json";
const MAX_BYTES = 250_000;

function retrieve(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: { "User-Agent": "ERVIRA-StructuralPro-contract-validator", "Accept": "application/json" },
      timeout: 12000
    }, response => {
      const status = response.statusCode;
      if (status !== 200) {
        response.resume();
        reject(Object.assign(new Error(`Contract HTTP ${status} at ${url}`), { status }));
        return;
      }
      let bytes = 0;
      let body = "";
      response.setEncoding("utf8");
      response.on("data", chunk => {
        bytes += Buffer.byteLength(chunk, "utf8");
        if (bytes > MAX_BYTES) {
          response.destroy(new Error("Contract exceeds maximum allowed size"));
          return;
        }
        body += chunk;
      });
      response.on("end", () => resolve(body));
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("Contract request timed out")));
    request.on("error", reject);
  });
}

export function validateRecoveryIdentity(contract) {
  if (!contract || contract.product_id !== "structuralpro" ||
      contract.parent_platform !== "ERVIRA" ||
      contract.source_of_truth?.repository !== expectedSource ||
      contract.source_of_truth?.path !== expectedPath ||
      typeof contract.product?.current_version !== "string" ||
      !Array.isArray(contract.capabilities) || !Array.isArray(contract.editions)) {
    throw new Error("Untrusted recovery contract: source identity or required fields differ");
  }
  return contract;
}

export async function resolveStructuralProContract(fetchText = retrieve) {
  try {
    return JSON.parse(await fetchText(primary));
  } catch (error) {
    // Never use a fallback for network errors, invalid JSON, 403, 500, etc.
    if (error?.status !== 404) throw error;
    const recovered = validateRecoveryIdentity(JSON.parse(await fetchText(recovery)));
    console.warn("Historical StructuralPro contract returned 404; using validated Recovery contract.");
    return recovered;
  }
}
