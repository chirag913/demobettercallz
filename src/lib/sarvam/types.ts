import type { CallLanguage, CallState, TranscriptTurn } from "@/lib/types";

export interface ProjectContext {
  projectId: string;
  projectName: string;
  developer: string;
  location: string;
  configurations: string;
  knowledgeBrief: string;
  restrictedTopics: string[];
}

export interface CreateCallParams {
  /** Our internal call id — passed through as webhook metadata for correlation. */
  callId: string;
  phoneNumber: string;
  projectContext: ProjectContext;
  /** The lead's name, when the caller provided one. Never invented when absent. */
  userName?: string | null;
}

export interface CreateCallResult {
  providerCallId: string;
  interactionId: string | null;
  status: CallState;
}

export interface CallStatusResult {
  status: CallState;
  durationSeconds: number | null;
}

export interface TranscriptResult {
  turns: TranscriptTurn[];
  language: CallLanguage | null;
}

/**
 * Abstraction over an outbound voice calling provider. Sarvam is the only
 * implementation today (see sarvam-provider.ts); DemoVoiceProvider
 * simulates the same interface so the product works with zero credentials.
 */
export interface VoiceProvider {
  readonly name: "sarvam" | "demo";
  createCall(params: CreateCallParams): Promise<CreateCallResult>;
  getCallStatus(providerCallId: string): Promise<CallStatusResult | null>;
  getTranscript(providerCallId: string): Promise<TranscriptResult | null>;
  getRecording(providerCallId: string): Promise<string | null>;
}
