import { after, NextRequest, NextResponse } from "next/server";
import { deliverDemoLeadWithRetry, queueDemoLead } from "@/lib/demo-leads/deliver";
import { PUBLIC_DEMO_ID } from "@/data/publicDemo";
import { META_PROJECT_ID } from "@/lib/meta-leads/constants";
import { z } from "zod";
import { getCall, getCallByProviderCallId, updateCall } from "@/lib/db/repository";
import type { CallState, TranscriptTurn } from "@/lib/types";
export const maxDuration = 180;

/**
 * Handles Sarvam's Instant Outbound completion webhook
 * (https://docs.sarvam.ai/api-reference/instant-outbound/webhook-payload).
 * Sarvam does not document a signature/HMAC header for verifying webhook
 * authenticity, so this endpoint additionally supports an optional shared
 * secret via ?secret= — set SARVAM_WEBHOOK_SECRET and the outbound request
 * appends it to webhook_config.url automatically.
 */

const payloadSchema = z.object({
  attempt_id: z.string(),
  status: z.enum(["connected", "no_answer", "busy", "failed"]),
  duration: z.number().nullable().optional(),
  interaction_id: z.string().nullable().optional(),
  failure_reason: z.string().nullable().optional(),
  final_agent_variables: z.record(z.string(), z.unknown()).nullable().optional(),
  webhook_config: z
    .object({
      url: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    })
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
    // Current Instant Outbound docs: { role, en_text }. Keep older aliases as fallback.
    const text = String(turn.en_text ?? turn.text ?? turn.message ?? turn.content ?? "").trim();
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
    (typeof metadataCallId === "string" ? await getCall(metadataCallId) : null);

  if (!call) {
    console.error("Sarvam webhook: no matching call for attempt_id", payload.attempt_id);
    // Acknowledge with 200 so Sarvam does not retry indefinitely for a call we will never find.
    return NextResponse.json({ ok: true, matched: false });
  }

  // Idempotency: a terminal call that already recorded this attempt is left untouched.
  if ((call.status === "completed" || call.status === "failed") && call.providerCallId === payload.attempt_id) {
    // A delayed transcript can complete a prior webhook without overwriting existing turns.
    if (call.status === "completed" && !call.transcript?.length) {
      const transcript = mapTranscript(payload.interaction_transcript);
      if (transcript) await updateCall(call.id, { transcript });
    }
    if ((call.projectId === PUBLIC_DEMO_ID && call.status === "completed") || call.projectId === META_PROJECT_ID) {
      await queueDemoLead(call.id);
      after(() => deliverDemoLeadWithRetry(call.id));
    }
    return NextResponse.json({ ok: true, matched: true, duplicate: true });
  }

  const connectivityStatus = payload.status;
  const durationSeconds =
    payload.duration == null ? null : Math.round(payload.duration);

  await updateCall(call.id, {
    providerCallId: call.providerCallId ?? payload.attempt_id,
    status: mapStatus(payload.status),
    durationSeconds,
    interactionId: payload.interaction_id ?? call.interactionId,
    failureReason:
      payload.status !== "connected" ? (payload.failure_reason ?? connectivityStatus) : null,
    transcript: mapTranscript(payload.interaction_transcript),
    endedAt: new Date().toISOString(),
  });

  if ((call.projectId === PUBLIC_DEMO_ID && payload.status === "connected") || call.projectId === META_PROJECT_ID) {
    await queueDemoLead(call.id);
    after(() => deliverDemoLeadWithRetry(call.id));
  }

  return NextResponse.json({ ok: true, matched: true, connectivityStatus });
}
