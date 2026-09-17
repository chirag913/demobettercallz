/**
 * System prompt + strict JSON schema for Conversation Intelligence
 * extraction. The model is only ever asked to report what is explicitly
 * supported by the transcript — see types.ts RawExtraction for why scoring
 * and temperature are deliberately absent from this schema.
 */

export const EXTRACTION_SYSTEM_PROMPT = `You are a sales conversation intelligence engine for a real-estate sales organization.

Analyze ONLY the supplied conversation transcript between an AI property expert and a prospective buyer. You are also given the project's approved knowledge base — use it only to judge whether the AI's answers were supported, never as a source of facts about the buyer.

Extract facts explicitly supported by the conversation. Do not infer facts that were not stated. If a field is not known from the transcript, return null for it (or "unknown" for the enum fields that have an unknown option). Never fabricate budget, location, configuration, timeline, purchase purpose, inventory, or intent.

The transcript may contain Hindi, Hinglish, and English, often code-mixed within a single sentence. Understand it naturally and return normalized, English, structured data.

For every extracted requirement, include a short verbatim or near-verbatim evidence quote from the transcript where one exists. If no clear quote supports a field, leave its evidence null — do not paraphrase into something that looks like a quote.

For each question the prospect asked that relates to the project (price, RERA, possession, amenities, inventory, location, payment plan, etc.), report:
- the question,
- a short topic label,
- knowledgeStatus: "verified" if the approved knowledge base has a verified fact covering it and the AI's answer matches, "unverified" if only an unverified fact covers it, "restricted" if it's a restricted topic, "not_covered" if the knowledge base has nothing on it,
- answeredAppropriately: true if the AI's answer matches the knowledge status (used the verified/unverified fact correctly, or correctly refused for restricted/not_covered topics), false if the AI appears to have given a concrete answer despite the topic being restricted or not_covered.

Identify explicit buying signals (short phrases like "Budget confirmed", "Asked about pricing", "Requested a site visit") and objections (concerns or hesitations the prospect raised, in their own words where possible).

Report the following as plain booleans, based only on what was explicitly said — do not guess:
- strongBuyingIntent: the prospect expressed clear, strong intent to purchase soon
- pricingQuestionAsked: the prospect asked about price or cost
- explicitlyNotInterested: the prospect explicitly said they are not interested
- wrongPerson: the prospect indicated they are not the right person / this was a wrong number or misdirected call
- justBrowsingNoTimeline: the prospect said they are just browsing/researching with no purchase timeline
- requestedCallback: the prospect asked to be called back later

Return strict JSON matching the supplied schema. Do not include any text outside the JSON.`;

export function buildExtractionUserPrompt(input: {
  projectName: string;
  knowledgeBrief: string;
  transcriptText: string;
}): string {
  return [
    `PROJECT: ${input.projectName}`,
    ``,
    `APPROVED PROJECT KNOWLEDGE (use only to judge answer support, not as buyer facts):`,
    input.knowledgeBrief,
    ``,
    `CONVERSATION TRANSCRIPT (AI = property expert, PROSPECT = buyer):`,
    input.transcriptText,
  ].join("\n");
}

const evidencedValueSchema = {
  type: "object",
  properties: {
    value: { type: ["string", "null"] },
    evidence: { type: ["string", "null"] },
  },
  required: ["value", "evidence"],
  additionalProperties: false,
};

export const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    leadName: { type: ["string", "null"] },
    summary: { type: "string" },
    requirements: {
      type: "object",
      properties: {
        budget: evidencedValueSchema,
        configuration: evidencedValueSchema,
        preferredLocation: evidencedValueSchema,
        purchasePurpose: evidencedValueSchema,
        purchaseTimeline: evidencedValueSchema,
        siteVisitInterest: {
          type: "string",
          enum: ["interested", "maybe", "not_interested", "unknown"],
        },
      },
      required: [
        "budget",
        "configuration",
        "preferredLocation",
        "purchasePurpose",
        "purchaseTimeline",
        "siteVisitInterest",
      ],
      additionalProperties: false,
    },
    buyingSignals: { type: "array", items: { type: "string" } },
    objections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          evidence: { type: ["string", "null"] },
        },
        required: ["text", "evidence"],
        additionalProperties: false,
      },
    },
    questionsAsked: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          topic: { type: "string" },
          knowledgeStatus: {
            type: "string",
            enum: ["verified", "unverified", "restricted", "not_covered"],
          },
          answeredAppropriately: { type: "boolean" },
        },
        required: ["question", "topic", "knowledgeStatus", "answeredAppropriately"],
        additionalProperties: false,
      },
    },
    signals: {
      type: "object",
      properties: {
        strongBuyingIntent: { type: "boolean" },
        pricingQuestionAsked: { type: "boolean" },
        explicitlyNotInterested: { type: "boolean" },
        wrongPerson: { type: "boolean" },
        justBrowsingNoTimeline: { type: "boolean" },
        requestedCallback: { type: "boolean" },
      },
      required: [
        "strongBuyingIntent",
        "pricingQuestionAsked",
        "explicitlyNotInterested",
        "wrongPerson",
        "justBrowsingNoTimeline",
        "requestedCallback",
      ],
      additionalProperties: false,
    },
  },
  required: ["leadName", "summary", "requirements", "buyingSignals", "objections", "questionsAsked", "signals"],
  additionalProperties: false,
} as const;
