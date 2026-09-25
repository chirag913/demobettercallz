import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCall } from "@/lib/db/repository";
import { PUBLIC_DEMO_ID } from "@/data/publicDemo";
import { extractDemoLead, type DemoLead } from "./extract";
import { makeLeadEmail, makeMetaLeadEmail, sendLeadEmail, type LeadEmail } from "./email";
import { META_PROJECT_ID } from "@/lib/meta-leads/constants";
import { prepareMetaSheet } from "@/lib/meta-leads/results";
import type { MetaLeadInput } from "@/lib/meta-leads/input";

export async function queueDemoLead(callId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Durable lead delivery storage is unavailable");
  const queued = await admin.from("demo_lead_delivery").upsert({ call_id: callId }, { onConflict: "call_id", ignoreDuplicates: true });
  if (queued.error) throw new Error("Could not queue demo lead");
}

export async function deliverDemoLead(callId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Durable lead delivery storage is unavailable");
  const call = await getCall(callId);
  const meta = call?.projectId === META_PROJECT_ID;
  if (!call || (!meta && call.projectId !== PUBLIC_DEMO_ID) || call.mode !== "real" || call.status !== "completed") return;
  if (call.status === "completed" && !call.transcript?.length) throw new Error("Completed call transcript is not available yet");
  const table = () => admin.from("demo_lead_delivery");
  const inserted = await table().upsert({ call_id: callId }, { onConflict: "call_id", ignoreDuplicates: true });
  if (inserted.error) throw new Error("Could not queue demo lead");
  const now = new Date().toISOString(), token = randomUUID();
  const claim = await table().update({ status: "processing", lock_token: token, locked_until: new Date(Date.now() + 120000).toISOString(), updated_at: now })
    .eq("call_id", callId).in("status", ["pending", "failed", "processing"]).or(`locked_until.is.null,locked_until.lt.${now}`).select().maybeSingle();
  if (claim.error) throw new Error("Could not claim demo lead delivery");
  if (!claim.data) return; // Another worker owns it, it was sent, or needs review.
  const save = async (patch: Record<string, unknown>) => {
    const result = await table().update({ ...patch, updated_at: new Date().toISOString() }).eq("call_id", callId).eq("lock_token", token).select("call_id").maybeSingle();
    if (result.error || !result.data) throw new Error("Could not persist demo lead delivery");
  };
  try {
    const record = claim.data;
    // Resend idempotency expires after 24 hours. Do not blindly resend an ambiguous old attempt.
    if (record.first_send_at && Date.now() - Date.parse(record.first_send_at) > 23 * 3600000) {
      await save({ status: "review", last_error: "Old email attempt needs reconciliation with Resend", locked_until: null });
      return;
    }
    let data = record.lead_data as DemoLead | null;
    if (!data) {
      const lead = await admin.from("lead").select("phone").eq("id", call.leadId).single();
      if (lead.error || !lead.data?.phone) throw new Error("Original call phone is unavailable");
      data = await extractDemoLead(call.transcript || [], { phone: lead.data.phone, timestamp: call.startedAt || call.createdAt, ...(meta ? {source: "meta_lead_campaign" as const} : {}) });
      await save({ lead_data: data });
    }
    const campaign = meta ? await prepareMetaSheet(call, data) : null;
    const payload = (record.email_payload as LeadEmail | null) || (campaign ? makeMetaLeadEmail(data, callId, campaign.meta_lead_id, call.status, { form: campaign.payload as MetaLeadInput, transcript: call.transcript || [], durationSeconds: call.durationSeconds }) : makeLeadEmail(data, callId));
    // Save exact request before sending so retries use the identical idempotency payload.
    if (!record.email_payload) await save({ email_payload: payload });
    if (!record.first_send_at) await save({ first_send_at: new Date().toISOString() });
    const emailId = await sendLeadEmail(payload, callId);
    await save({ status: "sent", email_id: emailId, last_error: null, locked_until: null });
  } catch {
    await save({ status: "failed", last_error: "Extraction or delivery failed; retry required", locked_until: null });
    throw new Error("Demo lead delivery failed");
  }
}

export async function deliverDemoLeadWithRetry(callId: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { await deliverDemoLead(callId); return; }
    catch { if (attempt === 2) console.error("Post-call lead delivery needs retry", { callId }); else await new Promise(resolve => setTimeout(resolve, 2000)); }
  }
}
