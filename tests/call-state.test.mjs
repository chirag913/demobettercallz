import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function repository(admin, memoryStore = {}) {
  const exports = {};
  const dependencies = { "server-only": {}, crypto: {}, "@/lib/supabase/admin": { getSupabaseAdmin: () => admin }, "./memory-store": { memoryStore } };
  const code = ts.transpileModule(fs.readFileSync("src/lib/db/repository.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name] });
  return exports;
}
test("early completion webhook survives later provider acknowledgement", async () => {
  const row = { id: "call-1", status: "completed", project_id: "bettercallz-live", conversation_intelligence: { summary: "Preserved" } };
  let guarded = false;
  const admin = { from: () => {
    let patch;
    const query = {
      update(value) { patch = value; return query; },
      eq() { return query; },
      not(column, operation, value) { guarded = column === "status" && operation === "in" && value === "(completed,failed)"; return query; },
      select() { return query; },
      async maybeSingle() {
        if (patch && guarded) return { data: null, error: null };
        if (patch) Object.assign(row, patch);
        return { data: row, error: null };
      },
    };
    return query;
  } };
  const result = await repository(admin).updateCall("call-1", { status: "ringing" }, true);
  assert.equal(guarded, true);
  assert.equal(result.status, "completed");
  assert.equal(result.conversationIntelligence.summary, "Preserved");
});
test("memory simulation likewise preserves terminal status", async () => {
  const current = { status: "completed" };
  let changed = false;
  const result = await repository(null, { getCall: () => current, updateCall: () => { changed = true; } }).updateCall("call", { status: "ringing" }, true);
  assert.equal(changed, false);
  assert.equal(result.status, "completed");
});
