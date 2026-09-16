import { randomUUID } from "crypto";
import type { CallStatusResult, CreateCallParams, CreateCallResult, TranscriptResult, VoiceProvider } from "./types";
import { buildDemoTranscript, simulateDemoCallState, DEMO_CALL_LANGUAGE } from "./demo-simulation";

/**
 * Simulated provider used when Sarvam credentials are not configured. It
 * implements the exact same VoiceProvider interface as SarvamVoiceProvider
 * so the rest of the app (API routes, UI) is identical in both modes — only
 * the call actually being placed differs. See demo-simulation.ts for how
 * call state and transcript are derived from elapsed time.
 */
export class DemoVoiceProvider implements VoiceProvider {
  readonly name = "demo" as const;

  async createCall(_params: CreateCallParams): Promise<CreateCallResult> {
    return {
      providerCallId: `demo_${randomUUID()}`,
      interactionId: `demo_interaction_${randomUUID()}`,
      status: "initiating",
    };
  }

  async getCallStatus(_providerCallId: string): Promise<CallStatusResult | null> {
    return null; // status is derived from startedAt by the caller, see demo-simulation.ts
  }

  async getTranscript(_providerCallId: string): Promise<TranscriptResult | null> {
    return null;
  }

  async getRecording(_providerCallId: string): Promise<string | null> {
    return null;
  }
}

export { buildDemoTranscript, simulateDemoCallState, DEMO_CALL_LANGUAGE };
