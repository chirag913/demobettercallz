import { NextRequest, NextResponse } from "next/server";
import { getCallWithLiveStatus } from "@/lib/calls/service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const call = await getCallWithLiveStatus(id);
    if (!call) return NextResponse.json({ error: "Call not found." }, { status: 404 });
    return NextResponse.json({ call });
  } catch (err) {
    console.error("GET /api/calls/[id] failed", err);
    return NextResponse.json({ error: "Call information is temporarily unavailable." }, { status: 500 });
  }
}
