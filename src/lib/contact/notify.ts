import "server-only";
import type { ContactInput } from "./schema";

/** Acceptance by Resend is not a guarantee of inbox delivery. */
export async function notifyContactTeam(inquiry: ContactInput, inquiryId: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_EMAIL_FROM;
  const to = process.env.CONTACT_EMAIL_TO;
  if (!apiKey || !from || !to) return false;

  const text = [
    "New BetterCallz contact inquiry", `Reference: ${inquiryId}`, "",
    `Name: ${inquiry.name}`, `Work email: ${inquiry.email}`,
    `Phone: ${inquiry.phone}`, `Company: ${inquiry.company}`,
    `Website: ${inquiry.website || "Not provided"}`,
    `Monthly lead volume: ${inquiry.leadVolume}`, `Interest: ${inquiry.interest}`,
    "", "Message:", inquiry.message,
  ].join("\n");
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json",
        "Idempotency-Key": `contact-inquiry/${inquiryId}`,
      },
      body: JSON.stringify({ from, to: [to], reply_to: inquiry.email,
        subject: "New BetterCallz contact inquiry", text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    return typeof result === "object" && result !== null && "id" in result
      && typeof result.id === "string" && result.id.length > 0;
  } catch {
    return false;
  }
}
