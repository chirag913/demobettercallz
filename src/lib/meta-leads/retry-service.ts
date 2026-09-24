import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { classifyMetaOutcome, shouldRetryCall } from "./retry-policy";

export async function finalizeMetaAttempt(callId: string, payload: Parameters<typeof classifyMetaOutcome>[0]) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Campaign storage unavailable");
  const outcome = classifyMetaOutcome(payload);
  const result = await admin.rpc("finish_meta_attempt", { p_call: callId, p_outcome: outcome });
  if (result.error) throw new Error("Could not finalize retry decision");
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (row?.meta_lead_id) console.info("[BetterCallz Retry]", { lead: row.meta_lead_id, attempt: row.attempt_count, status: row.last_call_status, action: row.retry_status, next_retry: row.next_retry_at, decision: shouldRetryCall(outcome, row.attempt_count).reason });
}
