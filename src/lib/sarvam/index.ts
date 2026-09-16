import "server-only";
import { isRealModeConfigured } from "./config";
import { SarvamVoiceProvider } from "./sarvam-provider";
import { DemoVoiceProvider } from "./demo-provider";
import type { VoiceProvider } from "./types";

/**
 * Returns the real Sarvam provider when SARVAM_* env vars are fully
 * configured, otherwise the Demo provider. This is the ONLY place that
 * decides Demo vs Real mode — API routes and UI should call isRealMode()
 * rather than re-checking env vars themselves.
 */
export function getVoiceProvider(): VoiceProvider {
  return isRealModeConfigured() ? new SarvamVoiceProvider() : new DemoVoiceProvider();
}

export function isRealMode(): boolean {
  return isRealModeConfigured();
}

export type { VoiceProvider, ProjectContext, CreateCallParams, CreateCallResult, CallStatusResult, TranscriptResult } from "./types";
