import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startCall, CallServiceError } from "@/lib/calls/service";
import { isMetaAuthorized, metaLeadSchema } from "@/lib/meta-leads/input";
import { startMetaCall } from "@/lib/meta-leads/intake";
export const maxDuration = 60;

const bodySchema = z.object({
  projectId: z.string().min(1),
  phone: z.string().min(6).max(20),
  name: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    const text = await request.text();
    if (text.length > 16000) return NextResponse.json({ error: "Request too large." }, { status: 413 });
    const json = JSON.parse(text);
    if (json?.source === "meta_lead_campaign") {
      if (!isMetaAuthorized(request.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      const meta = metaLeadSchema.safeParse(json);
      if (!meta.success) return NextResponse.json({ error: "Invalid Meta lead." }, { status: 400 });
      try { return NextResponse.json(await startMetaCall(meta.data), { status: 202 }); }
      catch { return NextResponse.json({ error: "Meta intake unavailable." }, { status: 503 }); }
    }
    if (json?.source && json.source !== "website_demo") return NextResponse.json({ error: "Invalid source." }, { status: 400 });
    parsed = bodySchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const call = await startCall(parsed);
    return NextResponse.json({ callId: call.id, status: call.status, mode: call.mode });
  } catch (err) {
    if (err instanceof CallServiceError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("POST /api/calls failed", err);
    return NextResponse.json({ error: "Call could not be started." }, { status: 500 });
  }
}
