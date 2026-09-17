import "server-only";
import { createLead, createCall, getCall, updateCall } from "@/lib/db/repository";
import { getVoiceProvider, isRealMode, type ProjectContext } from "@/lib/sarvam";
import { buildAgentKnowledgeBrief, getProject, getRestrictedTopics } from "@/lib/knowledge/service";
import { normalizeIndianPhone } from "@/lib/phone";
import { buildDemoTranscript, simulateDemoCallState, DEMO_CALL_LANGUAGE } from "@/lib/sarvam/demo-provider";
import type { CallRecord } from "@/lib/types";

export class CallServiceError extends Error {}

function projectContextFor(projectId: string): ProjectContext | null {
  const project = getProject(projectId);
  if (!project) return null;
  return {
    projectId: project.id,
    projectName: project.name,
    developer: project.developer,
    location: project.location,
    configurations: project.configurations,
    knowledgeBrief: buildAgentKnowledgeBrief(project.id),
    restrictedTopics: getRestrictedTopics(project.id),
  };
}

/** Validates input, creates the lead + call record, then places the call via the active VoiceProvider (Sarvam or Demo). */
export async function startCall(input: { projectId: string; phone: string; name?: string }): Promise<CallRecord> {
  const project = getProject(input.projectId);
  if (!project) throw new CallServiceError("Project not found");

  const normalizedPhone = normalizeIndianPhone(input.phone);
  if (!normalizedPhone) throw new CallServiceError("Enter a valid Indian phone number, for example 98765 43210.");

  const lead = await createLead({ projectId: input.projectId, phone: normalizedPhone, name: input.name });

  const provider = getVoiceProvider();
  const mode: CallRecord["mode"] = isRealMode() ? "real" : "demo";

  let call = await createCall({
    leadId: lead.id,
    projectId: input.projectId,
    provider: provider.name,
    mode,
    status: "created",
    language: mode === "demo" ? DEMO_CALL_LANGUAGE : null,
  });

  const projectContext = projectContextFor(project.id);
  if (!projectContext) throw new CallServiceError("Project knowledge is temporarily unavailable.");

  try {
    const result = await provider.createCall({
      callId: call.id,
      phoneNumber: normalizedPhone,
      projectContext,
      userName: input.name,
    });
    const updated = await updateCall(call.id, {
      providerCallId: result.providerCallId,
      interactionId: result.interactionId,
      status: result.status,
      startedAt: new Date().toISOString(),
    });
    if (!updated) throw new CallServiceError("Call could not be started.");
    call = updated;
  } catch (err) {
    await updateCall(call.id, {
      status: "failed",
      failureReason: err instanceof Error ? err.message : "Unknown error",
    });
    throw new CallServiceError("We couldn't connect the call. Please try again.");
  }

  return call;
}

/**
 * Reads a call, advancing Demo Mode calls through their simulated state
 * machine purely based on elapsed time (see demo-simulation.ts). Real-mode
 * calls are never advanced here — their state only changes when the Sarvam
 * webhook lands (see app/api/webhooks/sarvam/route.ts).
 */
export async function getCallWithLiveStatus(id: string): Promise<CallRecord | null> {
  const call = await getCall(id);
  if (!call) return null;
  if (call.mode !== "demo" || !call.startedAt) return call;
  if (call.status === "completed" || call.status === "failed") return call;

  const sim = simulateDemoCallState(call.startedAt);
  if (sim.status === call.status) return call;

  const patch: Partial<CallRecord> = { status: sim.status };
  if (sim.status === "completed") {
    const projectContext = projectContextFor(call.projectId);
    patch.durationSeconds = sim.durationSeconds;
    patch.transcript = projectContext ? buildDemoTranscript(projectContext) : [];
    patch.endedAt = new Date().toISOString();
  }

  return (await updateCall(id, patch)) ?? call;
}
