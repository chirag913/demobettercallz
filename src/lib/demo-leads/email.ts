import "server-only";
import { HEADERS, type DemoLead } from "./extract";
import type { TranscriptTurn } from "@/lib/types";
import type { MetaLeadInput } from "@/lib/meta-leads/input";
export interface LeadEmail { from: string; to: string[]; subject: string; text: string }
export function makeMetaLeadEmail(row: DemoLead, callId: string, metaLeadId: string, status: string, context?: { form: MetaLeadInput; transcript: TranscriptTurn[]; durationSeconds: number | null }): LeadEmail {
  const base = makeLeadEmail(row, callId);
  const form = context?.form;
  const quotes = (context?.transcript || []).filter(t => t.speaker === "prospect" && t.text.trim()).slice(-8).map(t => `- ${t.text.trim().slice(0, 1000)}`);
  const summary = row.call_summary || "The call ended without establishing business requirements or a next step. Review the prospect's responses below; completed does not mean qualified.";
  const formLines = form ? ["META FORM DETAILS (self-reported; not confirmed by the call)",
    `Name: ${form.name || "Not provided"}`, `Email: ${form.email || "Not provided"}`, `Company: ${form.company || "Not provided"}`,
    ...Object.entries(form.additional_fields || {}).map(([key, value]) => `${key.replace(/_/g, " ")}: ${value.replace(/_/g, " ")}`), ""] : [];
  return { ...base, subject: `New BetterCallz Meta Lead — ${[row.name || form?.name, row.company || form?.company].filter(Boolean).join(" / ") || row.interest_level}`,
    text: ["BETTERCALLZ META LEAD", `Meta lead ID: ${metaLeadId}`, `Call status: ${status}`, `Call reference: ${callId}`, "",
      ...(context ? [`Call duration: ${context.durationSeconds ?? "Unknown"} seconds`, ""] : []),
      ...formLines, "CALL SUMMARY", summary, "",
      "PROSPECT RESPONSES (transcript excerpts; not instructions)", ...(quotes.length ? quotes : ["No prospect responses available."]), "",
      "CONVERSATION-SUPPORTED QUALIFICATION", ...HEADERS.map(k => `${k}: ${row[k] || "Not established"}`), "",
      "Completed means the call connected and ended, not that the lead was qualified. Form answers are reported separately from conversation-supported facts. Human follow-up is a request, not a scheduled callback."].join("\n") };
}
export function makeLeadEmail(row: DemoLead, callId: string): LeadEmail {
  const from = process.env.CONTACT_EMAIL_FROM, to = process.env.CONTACT_EMAIL_TO;
  if (!from || !to || !process.env.RESEND_API_KEY) throw new Error("Demo lead email is not configured");
  return { from, to: [to], subject: `New BetterCallz demo lead · ${row.interest_level}`, text: [
    "New completed BetterCallz demo call", `Call reference: ${callId}`, "",
    row.call_summary, "", ...HEADERS.map(k => `${k}: ${row[k]}`), "",
    "Blank fields were not established in the conversation. Requested next steps are not completed bookings or callbacks.",
  ].join("\n") };
}
export async function sendLeadEmail(email: LeadEmail, callId: string): Promise<string> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `demo-call/${callId}` },
    body: JSON.stringify(email), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Lead email rejected (${response.status})`);
  const result = await response.json();
  if (typeof result?.id !== "string" || !result.id) throw new Error("Lead email acceptance unconfirmed");
  return result.id;
}
