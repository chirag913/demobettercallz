import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startCall, CallServiceError } from "@/lib/calls/service";

const bodySchema = z.object({
  projectId: z.string().min(1),
  phone: z.string().min(6).max(20),
  name: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
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
