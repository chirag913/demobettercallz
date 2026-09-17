/**
 * System prompt + JSON shape instructions for Conversation Intelligence
 * extraction. The model is only ever asked to report what is explicitly
 * supported by the transcript — see types.ts RawExtraction for why scoring
 * and temperature are deliberately absent from this schema.
 *
 * The exact shape is spelled out here in the prompt rather than enforced via
 * an OpenAI-style strict json_schema response_format — see llm-provider.ts
 * for why (strict schema mode on this model gets stuck in a non-terminating
 * whitespace loop). Minor shape deviations are normalized before zod
 * validation in extractConversationIntelligence.ts.
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

Return ONLY a single JSON object matching the exact shape given in the user message. No markdown, no commentary, no text outside the JSON.`;

const JSON_SHAPE_INSTRUCTIONS = `Return JSON matching EXACTLY this shape (use null for unknown string fields, [] for empty arrays, and keep every key even when its value is null or empty — every "requirements" sub-field must always be an object with "value" and "evidence" keys, never a bare null):
{
  "leadName": string | null,
  "summary": string,
  "requirements": {
    "budget": { "value": string | null, "evidence": string | null },
    "configuration": { "value": string | null, "evidence": string | null },
    "preferredLocation": { "value": string | null, "evidence": string | null },
    "purchasePurpose": { "value": string | null, "evidence": string | null },
    "purchaseTimeline": { "value": string | null, "evidence": string | null },
    "siteVisitInterest": "interested" | "maybe" | "not_interested" | "unknown"
  },
  "buyingSignals": string[],
  "objections": [{ "text": string, "evidence": string | null }],
  "questionsAsked": [{ "question": string, "topic": string, "knowledgeStatus": "verified" | "unverified" | "restricted" | "not_covered", "answeredAppropriately": boolean }],
  "signals": {
    "strongBuyingIntent": boolean,
    "pricingQuestionAsked": boolean,
    "explicitlyNotInterested": boolean,
    "wrongPerson": boolean,
    "justBrowsingNoTimeline": boolean,
    "requestedCallback": boolean
  }
}
Return ONLY this JSON object, no other text.`;

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
    ``,
    JSON_SHAPE_INSTRUCTIONS,
  ].join("\n");
}
