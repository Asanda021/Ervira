import test from "node:test";
import assert from "node:assert/strict";
import { resolveStructuralProContract, validateRecoveryIdentity } from "../scripts/resolve-structuralpro-contract.mjs";

const valid = {
  schema_version: "1.0", product_id: "structuralpro", parent_platform: "ERVIRA",
  product: { current_version: "0.1.0" },
  capabilities: [{ id: "project", status: "available" }],
  editions: [{ id: "light", status: "planned" }],
  source_of_truth: { repository: "Asanda021/StructuralPro", path: "contracts/product-contract.json" }
};

test("canonical endpoint works without fallback", async () => {
  let requests = 0;
  const result = await resolveStructuralProContract(async () => { requests++; return JSON.stringify(valid); });
  assert.equal(requests, 1);
  assert.equal(result.product_id, "structuralpro");
});

test("HTTP 404 permits identity-validated recovery only", async () => {
  const urls = [];
  const result = await resolveStructuralProContract(async url => {
    urls.push(url);
    if (urls.length === 1) throw Object.assign(new Error("HTTP 404"), {status:404});
    return JSON.stringify(valid);
  });
  assert.equal(urls.length, 2);
  assert.match(urls[1], /StructuralPro-Recovery/);
  assert.equal(result.product.current_version, "0.1.0");
});

test("recovery with untrusted source is rejected", async () => {
  await assert.rejects(() => resolveStructuralProContract(async url => {
    if (!url.includes("Recovery")) throw Object.assign(new Error("HTTP 404"), {status:404});
    return JSON.stringify({...valid, source_of_truth:{repository:"attacker/other",path:"contracts/product-contract.json"}});
  }), /Untrusted recovery contract/);
});

test("transient failure must not permit fallback", async () => {
  let calls = 0;
  await assert.rejects(() => resolveStructuralProContract(async () => {
    calls++;
    throw Object.assign(new Error("HTTP 503"), {status:503});
  }), /HTTP 503/);
  assert.equal(calls, 1);
});

test("invalid primary JSON is a hard failure", async () => {
  let calls = 0;
  await assert.rejects(() => resolveStructuralProContract(async () => {
    calls++;
    return "{bad json";
  }), SyntaxError);
  assert.equal(calls, 1);
});

test("recovery required fields are verified", () => {
  assert.throws(() => validateRecoveryIdentity({...valid, capabilities:undefined}), /Untrusted/);
  assert.throws(() => validateRecoveryIdentity({...valid, product:{}}), /Untrusted/);
});
