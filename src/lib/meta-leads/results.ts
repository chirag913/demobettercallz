import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CallRecord } from "@/lib/types";
import type { DemoLead } from "@/lib/demo-leads/extract";
export const META_SHEET_COLUMNS = ["created_at","source","meta_lead_id","name","phone","email","company","industry","business_description","lead_source","monthly_leads","current_process","crm_or_tool","sales_team","follow_up_speed","pain_point","bettercallz_use_case","interest_level","buying_intent","preferred_next_step","call_id","call_status","called_at","call_completed_at","call_summary","notes","attempt_count","last_call_status","last_attempt_at","next_retry_at","retry_status","retry_reason"] as const;
export function metaSheetValues(call: CallRecord, lead: DemoLead, record: {created_at:string;meta_lead_id:string;called_at:string|null}) {
  const values: Record<typeof META_SHEET_COLUMNS[number],string> = {
    created_at:record.created_at,source:"meta_lead_campaign",meta_lead_id:record.meta_lead_id,
    name:lead.name,phone:lead.phone,email:lead.email,company:lead.company,industry:lead.industry,business_description:lead.business_description,
    lead_source:lead.lead_sources,monthly_leads:lead.monthly_lead_volume,current_process:lead.current_lead_process,crm_or_tool:lead.crm_or_tool,
    sales_team:lead.sales_team,follow_up_speed:lead.follow_up_speed,pain_point:lead.pain_points,bettercallz_use_case:lead.bettercallz_use_case,
    interest_level:lead.interest_level,buying_intent:lead.buying_intent,preferred_next_step:lead.preferred_next_step,
    call_id:call.id,call_status:call.status,called_at:record.called_at||"",call_completed_at:call.endedAt||"",call_summary:lead.call_summary,notes:lead.notes,
    attempt_count:"",last_call_status:"",last_attempt_at:"",next_retry_at:"",retry_status:"",retry_reason:"",
  };
  return META_SHEET_COLUMNS.map(k=>values[k]);
}
export async function prepareMetaSheet(call: CallRecord, lead: DemoLead) {
  const admin=getSupabaseAdmin();
  if (!admin) throw new Error("Storage unavailable");
  const result=await admin.from("meta_lead_request").select().eq("call_id",call.id).single();
  if(result.error || !result.data) throw new Error("Campaign record unavailable");
  const record=result.data;
  if(!record.sheet_payload) {
    const saved=await admin.from("meta_lead_request").update({sheet_payload:metaSheetValues(call,lead,record)}).eq("call_id",call.id).is("sheet_payload",null);
    if(saved.error) throw new Error("Could not queue Sheet output");
  }
  return record;
}

export function campaignSheetSnapshot(record: Record<string, unknown>) {
  const payload = record.payload as Record<string, string>;
  const values = Array.isArray(record.sheet_payload) ? [...record.sheet_payload] : Array(32).fill("");
  Object.assign(values, {0:record.created_at,1:"meta_lead_campaign",2:record.meta_lead_id,3:values[3] || payload.name || "",4:payload.phone,5:values[5] || payload.email || "",6:values[6] || payload.company || "",20:record.call_id,21:record.call_status,22:record.called_at || "",23:record.call_completed_at || "",26:String(record.attempt_count),27:record.last_call_status,28:record.last_attempt_at || "",29:record.next_retry_at || "",30:record.retry_status,31:record.retry_reason || ""});
  return values;
}
