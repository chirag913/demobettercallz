import "server-only";
import { z } from "zod";
import { getStructuredLLMProvider } from "./llm-provider";
import { EXTRACTION_JSON_SCHEMA, EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "./prompts";
import { scoreLead } from "./scoreLead";
import { buildNextBestAction } from "./nextBestAction";
import type { ConversationIntelligence, KnowledgeGuardResult, QuestionEntry, RawExtraction } from "./types";
import type { TranscriptTurn } from "@/lib/types";

export class IntelligenceError extends Error {}

const evidencedValueSchema = z.object({
  value: z.string().nullable(),
  evidence: z.string().nullable(),
});

const rawExtractionSchema: z.ZodType<RawExtraction> = z.object({
  leadName: z.string().nullable(),
  summary: z.string(),
  requirements: z.object({
    budget: evidencedValueSchema,
    configuration: evidencedValueSchema,
    preferredLocation: evidencedValueSchema,
    purchasePurpose: evidencedValueSchema,
    purchaseTimeline: evidencedValueSchema,
    siteVisitInterest: z.enum(["interested", "maybe", "not_interested", "unknown"]),
  }),
  buyingSignals: z.array(z.string()),
  objections: z.array(z.object({ text: z.string(), evidence: z.string().nullable() })),
  questionsAsked: z.array(
    z.object({
      question: z.string(),
      topic: z.string(),
      knowledgeStatus: z.enum(["verified", "unverified", "restricted", "not_covered"]),
      answeredAppropriately: z.boolean(),
    }),
  ),
  signals: z.object({
    strongBuyingIntent: z.boolean(),
    pricingQuestionAsked: z.boolean(),
    explicitlyNotInterested: z.boolean(),
    wrongPerson: z.boolean(),
    justBrowsingNoTimeline: z.boolean(),
    requestedCallback: z.boolean(),
  }),
});

function formatTranscript(transcript: TranscriptTurn[]): string {
  return transcript
    .map((turn) => `${turn.speaker === "agent" ? "AI" : "PROSPECT"}: ${turn.text}`)
    .join("\n");
}

function computeKnowledgeGuard(questionsAsked: QuestionEntry[]): KnowledgeGuardResult {
  const verifiedQuestionsAnswered = questionsAsked.filter((q) => q.knowledgeStatus === "verified").length;
  const unsupportedQuestions = questionsAsked
    .filter((q) => q.knowledgeStatus !== "verified")
    .map((q) => ({ topic: q.topic, question: q.question }));
  const riskyQuestions = questionsAsked.filter(
    (q) => q.knowledgeStatus === "restricted" || q.knowledgeStatus === "not_covered",
  );
  const hallucinationAvoided = riskyQuestions.every((q) => q.answeredAppropriately);
  return { verifiedQuestionsAnswered, unsupportedQuestions, hallucinationAvoided };
}

/**
 * Turns a completed call's transcript into a ConversationIntelligence
 * record. Throws IntelligenceError for every handled failure mode (no
 * provider configured, empty transcript, LLM/network failure, malformed
 * response) so the API route can surface one consistent, friendly error —
 * see app/api/calls/[id]/intelligence/route.ts.
 */
export async function extractConversationIntelligence(input: {
  transcript: TranscriptTurn[];
  projectName: string;
  knowledgeBrief: string;
}): Promise<ConversationIntelligence> {
  if (!input.transcript || input.transcript.length === 0) {
    throw new IntelligenceError("This call has no transcript to analyze.");
  }

  const provider = getStructuredLLMProvider();
  if (!provider) {
    throw new IntelligenceError(
      "Conversation intelligence is not configured. Set SARVAM_CHAT_API_KEY to enable it.",
    );
  }

  const userPrompt = buildExtractionUserPrompt({
    projectName: input.projectName,
    knowledgeBrief: input.knowledgeBrief,
    transcriptText: formatTranscript(input.transcript),
  });

  let raw: unknown;
  try {
    raw = await provider.extractJson({
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      userPrompt,
      jsonSchema: EXTRACTION_JSON_SCHEMA,
      schemaName: "conversation_intelligence_extraction",
    });
  } catch (err) {
    throw new IntelligenceError(err instanceof Error ? err.message : "Conversation analysis failed.");
  }

  const parsed = rawExtractionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new IntelligenceError("Conversation analysis returned an unexpected format.");
  }
  const extraction = parsed.data;

  const scoreResult = scoreLead(extraction);
  const knowledgeGuard = computeKnowledgeGuard(extraction.questionsAsked);
  const nextBestAction = buildNextBestAction(extraction, knowledgeGuard);

  return {
    leadName: extraction.leadName,
    leadTemperature: scoreResult.temperature,
    leadScore: scoreResult.score,
    summary: extraction.summary,
    requirements: {
      budget: extraction.requirements.budget.value,
      budgetEvidence: extraction.requirements.budget.evidence,
      configuration: extraction.requirements.configuration.value,
      configurationEvidence: extraction.requirements.configuration.evidence,
      preferredLocation: extraction.requirements.preferredLocation.value,
      preferredLocationEvidence: extraction.requirements.preferredLocation.evidence,
      purchasePurpose: extraction.requirements.purchasePurpose.value,
      purchaseTimeline: extraction.requirements.purchaseTimeline.value,
      purchaseTimelineEvidence: extraction.requirements.purchaseTimeline.evidence,
      siteVisitInterest: extraction.requirements.siteVisitInterest,
    },
    buyingSignals: extraction.buyingSignals,
    objections: extraction.objections,
    questionsAsked: extraction.questionsAsked,
    knowledgeGuard,
    nextBestAction,
    analyzedAt: new Date().toISOString(),
    model: provider.model,
    provider: provider.name,
  };
}
