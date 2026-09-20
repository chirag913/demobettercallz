import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as zod from "zod";

const transcript = [{ speaker: "agent", text: "You probably use Meta." }, { speaker: "prospect", text: "I run a dental clinic. We use Google Ads." }];
const empty = () => ({ value: null, evidence: null });
function extractor(provider) {
  const exports = {};
  const dependencies = { "server-only": {}, zod, "./llm-provider": { getStructuredLLMProvider: () => provider }, "./extractConversationIntelligence": { IntelligenceError: Error } };
  const code = ts.transpileModule(fs.readFileSync("src/lib/intelligence/extractBusinessIntelligence.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name] });
  return exports.extractBusinessIntelligence;
}
test("rejects invented and agent-only evidence while retaining supported prospect facts", async () => {
  const extract = extractor({ name: "test", model: "test", extractJson: async () => ({ industry: { value: "Dental clinic", evidence: "I run a dental clinic." }, leadSource: { value: "Meta", evidence: "You probably use Meta." }, intent: { value: "High", evidence: "Ready to buy" }, salesProcess: empty(), mainProblem: empty(), qualification: empty(), context: empty() }) });
  const result = await extract(transcript);
  assert.equal(result.business.industry.value, "Dental clinic");
  assert.equal(result.business.leadSource.value, null);
  assert.equal(result.business.intent.value, null);
});
test("missing provider, missing transcript and malformed analysis fail honestly", async () => {
  await assert.rejects(extractor(null)(transcript));
  await assert.rejects(extractor(null)([]));
  await assert.rejects(extractor({ extractJson: async () => ({ industry: "fabricated" }) })(transcript));
});

test("bare null facts remain unknown for calls without business context", async () => {
  const extract = extractor({ name: "test", model: "test", extractJson: async () => ({ industry: null, leadSource: null, salesProcess: null, mainProblem: null, qualification: null, intent: null, context: null }) });
  const result = await extract([{ speaker: "prospect", text: "Please record your message." }]);
  assert.ok(Object.values(result.business).every((fact) => fact.value === null && fact.evidence === null));
  assert.equal(result.summary, "Not enough business context was shared in this call.");
});
