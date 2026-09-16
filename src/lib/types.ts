// Core domain types shared across the app, API routes, and the Sarvam provider layer.

export type VerificationStatus = "verified" | "unverified" | "restricted";

export type KnowledgeCategory = "project" | "pricing" | "amenities" | "inventory";

export interface KnowledgeFact {
  id: string;
  projectId: string;
  category: KnowledgeCategory;
  field: string;
  label: string;
  value: string;
  verificationStatus: VerificationStatus;
  source: string;
  sourceType: string;
  confidence: number; // 0-100
  verifiedAt: string | null;
  /** True for facts seeded from placeholder/demo values rather than a real client-provided source. */
  isDemoValue: boolean;
}

export interface ProjectRecord {
  id: string;
  name: string;
  developer: string;
  location: string;
  status: "active" | "draft";
  tagline: string;
  configurations: string;
  possession: string;
  rera: string;
  projectType: string;
  heroDescription: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryStatus = "available" | "limited" | "sold_out";

export interface InventoryUnit {
  id: string;
  projectId: string;
  configuration: string;
  areaSqft: string;
  priceRange: string;
  status: InventoryStatus;
  verificationStatus: VerificationStatus;
}

export type CallState =
  | "created"
  | "initiating"
  | "ringing"
  | "connected"
  | "in_progress"
  | "completed"
  | "failed";

export type CallLanguage = "hindi" | "hinglish" | "english";

export interface LeadRecord {
  id: string;
  projectId: string;
  name: string | null;
  phone: string;
  createdAt: string;
}

export interface TranscriptTurn {
  speaker: "agent" | "prospect";
  text: string;
  timestampSeconds: number;
}

export type CallMode = "demo" | "real";
export type CallProvider = "sarvam" | "demo";

export interface CallRecord {
  id: string;
  leadId: string;
  projectId: string;
  provider: CallProvider;
  mode: CallMode;
  providerCallId: string | null;
  interactionId: string | null;
  status: CallState;
  durationSeconds: number | null;
  transcript: TranscriptTurn[] | null;
  recordingUrl: string | null;
  language: CallLanguage | null;
  failureReason: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeStatusCounts {
  verified: number;
  unverified: number;
  restricted: number;
  total: number;
}
