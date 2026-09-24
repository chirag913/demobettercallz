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
  // The claim is irreversible without operator reconciliation. A timeout must NEVER redial.
  const claimed = await admin.from("meta_lead_request").update({ dispatch_state: "dispatching", called_at: new Date().toISOString() })
    .eq("meta_lead_id", input.meta_lead_id).eq("dispatch_state", "reserved").select().maybeSingle();
  if (claimed.error) throw new Error("Could not claim Meta call");
  if (!claimed.data) return { callId: record.call_id, duplicate: true, dispatchState: record.dispatch_state, status: record.call_status };
  try {
    const call = await getCall(record.call_id);
    if (!call) throw new Error("Reserved call unavailable");
    const original = record.payload as MetaLeadInput;
    const result = await dispatchStoredCall(call, new SarvamVoiceProvider(), {
      callId: call.id, phoneNumber: original.phone!, userName: original.name,
      leadContext: JSON.stringify({ name: original.name, company: original.company, context: original.form_context, fields: original.additional_fields }),
      projectContext: { projectId: META_PROJECT_ID, projectName: "BetterCallz Meta campaign", developer: "BetterCallz", location: "", configurations: "", knowledgeBrief: "", restrictedTopics: [] },
    });
    const saved = await admin.from("meta_lead_request").update({ dispatch_state: "accepted", call_triggered: true }).eq("meta_lead_id", input.meta_lead_id);
    if (saved.error) throw new Error("Could not record dispatch acceptance");
    return { callId: call.id, duplicate: false, dispatchState: "accepted", status: result.status };
  } catch {
    await admin.from("meta_lead_request").update({ dispatch_state: "review", last_error: "Dispatch uncertain or failed. Reconcile with Sarvam; do not redial automatically." }).eq("meta_lead_id", input.meta_lead_id);
    return { callId: record.call_id, duplicate: false, dispatchState: "review", status: "review" };
  }
}
