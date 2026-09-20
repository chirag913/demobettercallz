import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function notifier(fetch, env = { RESEND_API_KEY: "test-key", CONTACT_EMAIL_FROM: "BetterCallz <contact@example.com>", CONTACT_EMAIL_TO: "team@example.com" }) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync("src/lib/contact/notify.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: () => ({}), process: { env }, fetch, AbortSignal });
  return exports.notifyContactTeam;
}
const inquiry = { name: "Test <Person>", email: "visitor@example.com", phone: "+12025550147", company: "Test company", website: "", leadVolume: "Under 100", interest: "Both", message: "A test message" };

test("Resend receives a fixed recipient, reply-to and all inquiry fields as plain text", async () => {
  let payload;
  const send = notifier(async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.headers["Idempotency-Key"], "contact-inquiry/test-id");
    payload = JSON.parse(options.body);
    return Response.json({ id: "email-id" });
  });
  assert.equal(await send(inquiry, "test-id"), true);
  assert.deepEqual(payload.to, ["team@example.com"]);
  assert.equal(payload.reply_to, inquiry.email);
  assert.equal(payload.html, undefined);
  for (const value of Object.values(inquiry).filter(Boolean)) assert.ok(payload.text.includes(value));
});

test("missing config, provider rejection, malformed responses and network failure never claim acceptance", async () => {
  assert.equal(await notifier(() => { throw new Error("must not send"); }, {})(inquiry, "id"), false);
  for (const fetch of [
    async () => Response.json({ message: "rejected" }, { status: 403 }),
    async () => Response.json({}),
    async () => new Response("not json"),
    async () => { throw new Error("timeout"); },
  ]) assert.equal(await notifier(fetch)(inquiry, "id"), false);
});
