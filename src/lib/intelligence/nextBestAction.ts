import type { KnowledgeGuardResult, RawExtraction } from "./types";

/**
 * Rule-based next-best-action, not a second LLM call — keeps the
 * recommendation grounded in exactly the extracted facts and Knowledge
 * Guard result, and phrased as a recommendation ("Recommend...") rather
 * than a claim that something already happened.
 */
export function buildNextBestAction(extraction: RawExtraction, knowledgeGuard: KnowledgeGuardResult): string {
  const { signals, requirements } = extraction;

  if (signals.explicitlyNotInterested) {
    return "The prospect explicitly said they are not interested. No further action needed unless they reach out again.";
  }

  if (signals.wrongPerson) {
    return "This appears to be the wrong contact. Verify the lead's phone number before attempting another call.";
  }

  if (signals.requestedCallback) {
    return "Recommend calling the lead back as requested.";
  }

  const unverifiedTopics = knowledgeGuard.unsupportedQuestions.map((q) => q.topic);
  if (unverifiedTopics.length > 0) {
    const topics = [...new Set(unverifiedTopics)].slice(0, 3).join(" and ");
    return `Verify ${topics} with the sales desk before following up, then contact the lead.`;
  }

  if (requirements.siteVisitInterest === "interested") {
    return "Recommend scheduling a site visit.";
  }

  if (!requirements.budget.value || !requirements.configuration.value) {
    return "Follow up to understand the buyer's budget and configuration preference before recommending next steps.";
  }

  if (requirements.siteVisitInterest === "maybe") {
    return "Follow up to address remaining concerns and gauge interest in a site visit.";
  }

  return "Recommend a follow-up call to continue the conversation and confirm next steps.";
}
