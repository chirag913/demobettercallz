import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCall } from "@/lib/db/repository";
import { dispatchStoredCall } from "@/lib/calls/service";
import { SarvamVoiceProvider } from "@/lib/sarvam/sarvam-provider";
import { getSarvamConfig } from "@/lib/sarvam/config";
import { META_PROJECT_ID } from "./constants";
import { type MetaLeadInput } from "./input";

export async function startMetaCall(input: MetaLeadInput) {
  const admin = getSupabaseAdmin();
  if (!admin || !getSarvamConfig(false,true)) {
    const required = ["SARVAM_API_KEY", "SARVAM_META_AGENT_ID", "SARVAM_PHONE_NUMBER", "SARVAM_ORG_ID", "SARVAM_WORKSPACE_ID", "SARVAM_CONNECTION_ID", "NEXT_PUBLIC_APP_URL", "SARVAM_META_APP_VERSION", "SARVAM_WEBHOOK_SECRET"];
    console.error("Meta campaign configuration unavailable", { storage: Boolean(admin), missing: required.filter(key => !process.env[key]), validVersion: /^[1-9]\d*$/.test(process.env.SARVAM_META_APP_VERSION || "") });
    throw new Error("Meta campaign is not configured");
  }
  const reserved = await admin.rpc("reserve_meta_lead", { p_id: input.meta_lead_id, p_payload: input });
  if (reserved.error || !reserved.data) {
    console.error("Meta reservation unavailable", { code: reserved.error?.code, hasData: Boolean(reserved.data) });
    throw new Error("Could not reserve Meta lead");
  }
  // PostgREST can represent a composite return as a one-row array.
  const record = Array.isArray(reserved.data) ? reserved.data[0] : reserved.data;
  if (!record?.call_id || record.meta_lead_id !== input.meta_lead_id) throw new Error("Invalid Meta reservation");
  const result = await dispatchMetaAttempt(input.meta_lead_id);
  return result || { callId: record.call_id, duplicate: true, dispatchState: record.dispatch_state, status: record.retry_status, nextRetryAt: record.next_retry_at };
}

export async function dispatchMetaAttempt(metaLeadId: string) {
  const admin = getSupabaseAdmin();
  if (!admin || !getSarvamConfig(false, true)) return null; // No claim consumed for missing configuration.
  const claim = await admin.rpc("claim_meta_attempt", { p_id: metaLeadId });
  if (claim.error) throw new Error("Could not claim Meta attempt");
  const record = Array.isArray(claim.data) ? claim.data[0] : claim.data;
  if (!record?.call_id) return null;
  const call = await getCall(record.call_id);
  if (!call) throw new Error("Prepared call unavailable"); // PREPARED is safely recoverable.
  const original = record.payload as MetaLeadInput;
  const begun = await admin.rpc("begin_meta_dispatch", { p_id: metaLeadId, p_call: call.id });
  if (begun.error) throw new Error("Could not begin Meta dispatch");
  if (begun.data !== true) return null;
  console.info("[BetterCallz Retry]", { lead: metaLeadId, attempt: record.attempt_count, previous_status: record.last_call_status, action: "CALLING" });
  try {
    const result = await dispatchStoredCall(call, new SarvamVoiceProvider(), {
      callId: call.id, phoneNumber: original.phone!, userName: original.name,
      leadContext: JSON.stringify({ name: original.name, company: original.company, context: original.form_context, fields: original.additional_fields }),
      projectContext: { projectId: META_PROJECT_ID, projectName: "BetterCallz Meta campaign", developer: "BetterCallz", location: "", configurations: "", knowledgeBrief: "", restrictedTopics: [] },
    });
    const saved = await admin.from("meta_lead_request").update({ dispatch_state: "accepted", call_triggered: true }).eq("meta_lead_id", metaLeadId).eq("call_id", call.id).eq("retry_status", "CALLING");
    if (saved.error) throw new Error("Could not record dispatch acceptance");
    return { callId: call.id, duplicate: false, dispatchState: "accepted", status: result.status };
  } catch {
    // No lease expiry may redispatch: provider acceptance may have happened before the error.
    await admin.from("meta_lead_request").update({ dispatch_state: "review", retry_status: "REVIEW", next_retry_at: null, last_call_status: "UNKNOWN", last_error: "Dispatch uncertain. Reconcile with Sarvam; do not redial automatically." }).eq("meta_lead_id", metaLeadId).eq("call_id", call.id).eq("retry_status", "CALLING");
    return { callId: call.id, duplicate: false, dispatchState: "review", status: "review" };
  }
}

/** Run by the existing n8n result poll. Racing polls are safe at the database boundary. */
export async function processDueMetaCalls() {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const due = await admin.from("meta_lead_request").select("meta_lead_id").in("retry_status", ["CALL_SCHEDULED", "RETRY_SCHEDULED", "PREPARED"]).lte("next_retry_at", new Date().toISOString()).order("next_retry_at").limit(5);
  if (due.error) throw new Error("Could not load scheduled calls");
  for (const row of due.data || []) {
    try { await dispatchMetaAttempt(row.meta_lead_id); }
    catch { console.error("[BetterCallz Retry]", { lead: row.meta_lead_id, action: "WORKER_ERROR" }); }
  }
}
