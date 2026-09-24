import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isMetaAuthorized } from "@/lib/meta-leads/input";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deliverDemoLeadWithRetry } from "@/lib/demo-leads/deliver";
export const maxDuration=180;

// n8n polls this durable output queue, never a Sheet. Row allocation makes writes idempotent.
export async function GET(request: NextRequest) {
  if(!isMetaAuthorized(request.headers.get("authorization"))) return NextResponse.json({error:"Unauthorized"},{status:401});
  const admin=getSupabaseAdmin();
  if(!admin) return NextResponse.json({error:"Unavailable"},{status:503});
  const now=new Date().toISOString();
  const retry=await admin.from("meta_lead_pending_delivery").select("call_id").lte("next_delivery_attempt_at",now).order("next_delivery_attempt_at").limit(2);
  if(retry.error) return NextResponse.json({error:"Unavailable"},{status:503});
  for(const row of retry.data||[]) {
    const claimed=await admin.from("meta_lead_request").update({next_delivery_attempt_at:new Date(Date.now()+300000).toISOString()}).eq("call_id",row.call_id).lte("next_delivery_attempt_at",now).select("call_id").maybeSingle();
    if(claimed.data) after(()=>deliverDemoLeadWithRetry(row.call_id));
  }
  const results=await admin.from("meta_lead_request").select("meta_lead_id,call_id,sheet_row,sheet_payload").not("sheet_payload","is",null).is("sheet_delivered_at",null).order("sheet_row").limit(50);
  if(results.error) return NextResponse.json({error:"Unavailable"},{status:503});
  return NextResponse.json({results:results.data}, {headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:NextRequest) {
  if(!isMetaAuthorized(request.headers.get("authorization"))) return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=z.object({call_id:z.uuid(),sheet_row:z.number().int().min(2)}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:"Invalid acknowledgement"},{status:400});
  const admin=getSupabaseAdmin();
  if(!admin) return NextResponse.json({error:"Unavailable"},{status:503});
  const result=await admin.from("meta_lead_request").update({sheet_delivered_at:new Date().toISOString()}).eq("call_id",parsed.data.call_id).eq("sheet_row",parsed.data.sheet_row).not("sheet_payload","is",null).select("call_id").maybeSingle();
  return result.error||!result.data ? NextResponse.json({error:"Not acknowledged"},{status:409}):NextResponse.json({ok:true});
}
