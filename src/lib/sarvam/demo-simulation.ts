import type { CallLanguage, CallState, TranscriptTurn } from "@/lib/types";
import type { ProjectContext } from "./types";
import { AGENT_REFUSAL_LINE } from "./agent-prompt";

/**
 * Demo Mode call simulation. There is no real telephony here — instead the
 * call's state is derived purely from elapsed time since `startedAt`, so it
 * works identically on a stateless serverless invocation as it does in
 * local dev. The generated transcript is built from the SAME project
 * knowledge brief the real Sarvam agent would receive, and it deliberately
 * demonstrates the anti-hallucination refusal so the demo proves the point
 * live rather than just describing it.
 */

const RINGING_UNTIL = 2;
const CONNECTED_UNTIL = 4;
const COMPLETED_AT = 34;

export function simulateDemoCallState(
  startedAt: string,
): { status: CallState; durationSeconds: number | null } {
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  if (elapsed < RINGING_UNTIL) return { status: "ringing", durationSeconds: null };
  if (elapsed < CONNECTED_UNTIL) return { status: "connected", durationSeconds: null };
  if (elapsed < COMPLETED_AT) return { status: "in_progress", durationSeconds: null };
  return { status: "completed", durationSeconds: Math.round(COMPLETED_AT - CONNECTED_UNTIL) };
}

function findFactValue(context: ProjectContext, label: string): string | null {
  const line = context.knowledgeBrief.split("\n").find((l) => l.startsWith(`- ${label}:`));
  if (!line) return null;
  return line.replace(`- ${label}:`, "").replace("[unverified]", "").trim();
}

export function buildDemoTranscript(context: ProjectContext): TranscriptTurn[] {
  const configurations = findFactValue(context, "Configurations") ?? context.configurations;
  const startingPrice = findFactValue(context, "Starting Price");
  const possession = findFactValue(context, "Possession");

  const priceLine = startingPrice && !/request/i.test(startingPrice)
    ? `${startingPrice} se starting hai — exact configuration ke hisaab se price vary karega.`
    : "Abhi current pricing ki verified information available nahi hai — main aapko humare sales team se confirm karwa doon?";
  const possessionLine = possession && !/request/i.test(possession) ? ` Possession ${possession} hai.` : "";

  const turns: TranscriptTurn[] = [
    { speaker: "agent", text: `Namaste! Main ${context.projectName} ki AI property expert bol rahi hoon. Kaise madad kar sakti hoon aaj?`, timestampSeconds: 0 },
    { speaker: "prospect", text: "Hi, mujhe thoda sa project ke baare mein jaanna tha.", timestampSeconds: 3 },
    { speaker: "agent", text: `Bilkul! ${context.projectName} ${context.developer} ka project hai, located at ${context.location}. Yahan ${configurations} available hain.`, timestampSeconds: 6 },
    { speaker: "prospect", text: "Price kya hai iska?", timestampSeconds: 12 },
    { speaker: "agent", text: `${priceLine}${possessionLine}`, timestampSeconds: 15 },
    { speaker: "prospect", text: "Is there a private golf course inside the project?", timestampSeconds: 20 },
    { speaker: "agent", text: AGENT_REFUSAL_LINE + " Main aapko is par humare sales team se confirm karwa doon?", timestampSeconds: 22 },
    { speaker: "prospect", text: "Sure, that works. Thanks!", timestampSeconds: 27 },
    { speaker: "agent", text: "Perfect, main note kar leti hoon. Hamara sales expert aapko jaldi hi contact karega. Have a great day!", timestampSeconds: 29 },
  ];
  return turns;
}

export const DEMO_CALL_LANGUAGE: CallLanguage = "hinglish";
