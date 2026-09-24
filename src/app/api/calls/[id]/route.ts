import { NextRequest, NextResponse } from "next/server";
import { getCallWithLiveStatus } from "@/lib/calls/service";
import { getCall } from "@/lib/db/repository";
import { META_PROJECT_ID } from "@/lib/meta-leads/constants";
import { isMetaAuthorized } from "@/lib/meta-leads/input";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const stored = await getCall(id);
    if(stored?.projectId === META_PROJECT_ID && !isMetaAuthorized(request.headers.get("authorization"))) return NextResponse.json({error:"Call not found."},{status:404});
    const call = await getCallWithLiveStatus(id);
    if (!call) return NextResponse.json({ error: "Call not found." }, { status: 404 });
    return NextResponse.json({ call });
  } catch (err) {
    console.error("GET /api/calls/[id] failed", err);
    return NextResponse.json({ error: "Call information is temporarily unavailable." }, { status: 500 });
  }
}
