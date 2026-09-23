import "server-only";
import { HEADERS, type DemoLead } from "./extract";
export interface LeadEmail { from: string; to: string[]; subject: string; text: string }
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
