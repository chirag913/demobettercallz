import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as zod from "zod";

// Run the real schema and route with only the database boundary replaced.
function load(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, URL, console: { error() {} } });
  return exports;
}
const schema = load("src/lib/contact/schema.ts", { zod });
const valid = { name: "Test Person", email: "test@example.com", phone: "+91 98765 43210", company: "Test Company", website: "", leadVolume: "Under 100", interest: "Both", message: "Test inquiry" };
function route(admin) {
  return load("src/app/api/contact/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/contact/schema": schema,
    "@/lib/supabase/admin": { getSupabaseAdmin: () => admin },
  }).POST;
}
function request(body, headers = {}) {
  return new Request("http://localhost:3000/api/contact", { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });
}
test("rejects malformed, invalid and oversized requests before saving", async () => {
  const post = route(null);
  for (const body of ["{", {}, { ...valid, email: "invalid" }, { ...valid, interest: "Unknown" }, { ...valid, phone: "abc1234567" }, { ...valid, website: "javascript:alert(1)" }]) {
    assert.equal((await post(request(body))).status, 400);
  }
  assert.equal((await post(request("x".repeat(16001)))).status, 413);
  assert.equal((await post(request(valid, { origin: "https://another-site.example" }))).status, 403);
});
test("missing configuration and database failure never report success", async () => {
  for (const admin of [null, { from: () => ({ insert: async () => ({ error: { message: "unavailable" } }) }) }, { from: () => { throw new Error("network"); } }]) {
    const response = await route(admin)(request(valid));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).submitted, undefined);
  }
});
test("success is returned only after confirmed persistence with correct fields", async () => {
  let saved;
  const response = await route({ from: (table) => {
    assert.equal(table, "contact_inquiry");
    return { insert: async (row) => { saved = row; return { error: null }; } };
  } })(request({ ...valid, name: " Test Person " }));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).submitted, true);
  assert.equal(saved.name, "Test Person");
  assert.equal(saved.website, null);
  assert.equal(saved.source, "/contact");
  assert.equal(saved.lead_volume, "Under 100");
});
