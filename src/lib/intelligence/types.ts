// Conversation Intelligence: turns a completed call transcript into a
// structured buyer profile, buying signals, objections, a Knowledge Guard
// read, and a next-best-action recommendation.
//
// Design split (see extractConversationIntelligence.ts for why this matters):
// the LLM only ever EXTRACTS evidence already present in the transcript
// (RawExtraction) — it never assigns a lead temperature or score. Scoring is
// deterministic, centralized in scoreLead.ts, and computed from the raw
// extraction in code, so the "intent" number is auditable and can't be
// talked into a higher score by conversational tone alone.

export type SiteVisitInterest = "interested" | "maybe" | "not_interested" | "unknown";

export type KnowledgeQuestionStatus = "verified" | "unverified" | "restricted" | "not_covered";

export type LeadTemperature = "HOT" | "WARM" | "COLD" | "NOT_INTERESTED" | "CALLBACK" | "UNKNOWN";

/** A single extracted fact paired with the transcript line that supports it, when one exists. */
export interface EvidencedValue {
  value: string | null;
  evidence: string | null;
}

export interface ObjectionEntry {
  text: string;
  evidence: string | null;
}

export interface QuestionEntry {
  question: string;
  /** Short topic label, e.g. "RERA number", "Current inventory". */
  topic: string;
  knowledgeStatus: KnowledgeQuestionStatus;
  /**
   * True when the agent's answer was appropriate for the knowledge status —
   * i.e. it used verified/unverified facts correctly, or correctly refused
   * on a restricted/not_covered topic. False flags an unsupported claim.
   */
  answeredAppropriately: boolean;
}

/**
 * What the LLM is allowed to produce: evidence extracted from the
 * transcript, never a score or a temperature label.
 */
export interface RawExtraction {
  leadName: string | null;
  summary: string;
  requirements: {
    budget: EvidencedValue;
    configuration: EvidencedValue;
    preferredLocation: EvidencedValue;
    purchasePurpose: EvidencedValue;
    purchaseTimeline: EvidencedValue;
    siteVisitInterest: SiteVisitInterest;
  };
  buyingSignals: string[];
  objections: ObjectionEntry[];
  questionsAsked: QuestionEntry[];
  /** Deterministic scoring inputs — booleans the model reports, not a score. */
  signals: {
    strongBuyingIntent: boolean;
    pricingQuestionAsked: boolean;
    explicitlyNotInterested: boolean;
    wrongPerson: boolean;
    justBrowsingNoTimeline: boolean;
    requestedCallback: boolean;
  };
}

export interface KnowledgeGuardResult {
  verifiedQuestionsAnswered: number;
  unsupportedQuestions: { topic: string; question: string }[];
  hallucinationAvoided: boolean;
}

export interface LeadScoreResult {
  score: number;
  temperature: LeadTemperature;
  /** Human-readable breakdown for debugging — never rendered prominently in the UI. */
  reasons: string[];
}

export interface ConversationIntelligence {
  business?: BusinessIntelligence;
  leadName: string | null;
  leadTemperature: LeadTemperature;
  leadScore: number;
  summary: string;

  requirements: {
    budget: string | null;
    budgetEvidence: string | null;
    configuration: string | null;
    configurationEvidence: string | null;
    preferredLocation: string | null;
    preferredLocationEvidence: string | null;
    purchasePurpose: string | null;
    purchaseTimeline: string | null;
    purchaseTimelineEvidence: string | null;
    siteVisitInterest: SiteVisitInterest;
  };

  buyingSignals: string[];
  objections: ObjectionEntry[];
  questionsAsked: QuestionEntry[];
  knowledgeGuard: KnowledgeGuardResult;
  nextBestAction: string;

  analyzedAt: string;
  model: string;
  provider: string;
}

export interface BusinessIntelligence {
  industry: EvidencedValue;
  leadSource: EvidencedValue;
  salesProcess: EvidencedValue;
  mainProblem: EvidencedValue;
  qualification: EvidencedValue;
  intent: EvidencedValue;
  context: EvidencedValue;
}
