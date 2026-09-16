import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCallByProviderCallId, updateCall } from "@/lib/db/repository";
import type { CallState, TranscriptTurn } from "@/lib/types";

/**
 * Handles Sarvam's Instant Outbound completion webhook
 * (https://docs.sarvam.ai/api-reference/instant-outbound/webhook-payload).
 * Sarvam does not document a signature/HMAC header for verifying webhook
 * authenticity, so this endpoint additionally supports an optional shared
 * secret via ?secret= — set SARVAM_WEBHOOK_SECRET and pass the same value
 * when registering the webhook URL with Sarvam if you want that check
 * enforced (see README "Sarvam setup").
 */

const payloadSchema = z.object({
  attempt_id: z.string(),
  status: z.enum(["connected", "no_answer", "busy", "failed"]),
  duration: z.number().nullable().optional(),
  interaction_id: z.string().nullable().optional(),
  failure_reason: z.string().nullable().optional(),
  final_agent_variables: z.record(z.string(), z.unknown()).nullable().optional(),
  webhook_config: z
    .object({ metadata: z.record(z.string(), z.unknown()).optional() })
    .nullable()
    .optional(),
  interaction_transcript: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
});

function mapStatus(sarvamStatus: string): CallState {
  return sarvamStatus === "connected" ? "completed" : "failed";
}

function mapTranscript(raw: Record<string, unknown>[] | null | undefined): TranscriptTurn[] | null {
  if (!raw || raw.length === 0) return null;
  const turns: TranscriptTurn[] = [];
  raw.forEach((turn, idx) => {
    const roleRaw = String(turn.role ?? turn.speaker ?? "").toLowerCase();
    const speaker: TranscriptTurn["speaker"] =
      roleRaw.includes("agent") || roleRaw.includes("bot") || roleRaw.includes("assistant") ? "agent" : "prospect";
    const text = String(turn.text ?? turn.message ?? turn.content ?? "");
    if (!text) return;
    const timestampSeconds = typeof turn.timestamp === "number" ? turn.timestamp : idx * 3;
    turns.push({ speaker, text, timestampSeconds });
  });
  return turns.length > 0 ? turns : null;
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.SARVAM_WEBHOOK_SECRET;
  if (configuredSecret) {
    const provided = request.nextUrl.searchParams.get("secret");
    if (provided !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  let payload: z.infer<typeof payloadSchema>;
  try {
    payload = payloadSchema.parse(await request.json());
  } catch (err) {
    console.error("Sarvam webhook: invalid payload", err);
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const metadataCallId = payload.webhook_config?.metadata?.callId;
  const call =
    (await getCallByProviderCallId(payload.attempt_id)) ??
    (typeof metadataCallId === "string" ? await getCallByProviderCallId(metadataCallId) : null);

  if (!call) {
    console.error("Sarvam webhook: no matching call for attempt_id", payload.attempt_id);
    // Acknowledge with 200 so Sarvam does not retry indefinitely for a call we will never find.
    return NextResponse.json({ ok: true, matched: false });
  }

  // Idempotency: a terminal call that already recorded this attempt is left untouched.
  if ((call.status === "completed" || call.status === "failed") && call.providerCallId === payload.attempt_id) {
    return NextResponse.json({ ok: true, matched: true, duplicate: true });
  }

  await updateCall(call.id, {
    status: mapStatus(payload.status),
    durationSeconds: payload.duration ?? null,
    interactionId: payload.interaction_id ?? call.interactionId,
    failureReason: payload.status !== "connected" ? (payload.failure_reason ?? payload.status) : null,
    transcript: mapTranscript(payload.interaction_transcript),
    endedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, matched: true });
}
