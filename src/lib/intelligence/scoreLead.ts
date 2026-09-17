import type { LeadScoreResult, LeadTemperature, RawExtraction } from "./types";

/**
 * Deterministic lead scoring. The LLM never assigns a score or temperature
 * (see types.ts) — it only reports the evidence in RawExtraction, and this
 * pure function turns that evidence into a number and a bucket. Centralized
 * here so the weights can be tuned without touching the extraction prompt
 * or the UI. Not exposed prominently in the UI — see conversation-
 * intelligence.tsx, which shows only the temperature label.
 */

const POSITIVE_WEIGHTS = {
  budgetConfirmed: 20,
  specificConfiguration: 15,
  preferredLocationConfirmed: 15,
  shortTimeline: 20,
  clearPurchasePurpose: 10,
  pricingQuestionAsked: 10,
  siteVisitInterest: 15,
  strongBuyingIntent: 10,
} as const;

const NEGATIVE_WEIGHTS = {
  explicitlyNotInterested: -30,
  wrongPerson: -20,
  justBrowsingNoTimeline: -15,
} as const;

const HOT_THRESHOLD = 70;
const WARM_THRESHOLD = 40;

/** Treats "1 month", "immediately", "2-3 months" etc. as short-term (first number <= 3 months). */
function isShortTimeline(timeline: string | null): boolean {
  if (!timeline) return false;
  const lower = timeline.toLowerCase();
  if (/immediat|asap|urgent|right away/.test(lower)) return true;
  const match = lower.match(/(\d+)\s*(?:-|to|–)?\s*\d*\s*month/);
  if (match) return parseInt(match[1], 10) <= 3;
  return false;
}

export function scoreLead(extraction: RawExtraction): LeadScoreResult {
  const reasons: string[] = [];
  let score = 0;

  function add(points: number, reason: string) {
    score += points;
    reasons.push(`${points > 0 ? "+" : ""}${points} ${reason}`);
  }

  if (extraction.requirements.budget.value) add(POSITIVE_WEIGHTS.budgetConfirmed, "budget confirmed");
  if (extraction.requirements.configuration.value) add(POSITIVE_WEIGHTS.specificConfiguration, "specific configuration");
  if (extraction.requirements.preferredLocation.value)
    add(POSITIVE_WEIGHTS.preferredLocationConfirmed, "preferred location confirmed");
  if (isShortTimeline(extraction.requirements.purchaseTimeline.value))
    add(POSITIVE_WEIGHTS.shortTimeline, "purchase timeline <= 3 months");
  if (extraction.requirements.purchasePurpose.value) add(POSITIVE_WEIGHTS.clearPurchasePurpose, "clear purchase purpose");
  if (extraction.signals.pricingQuestionAsked) add(POSITIVE_WEIGHTS.pricingQuestionAsked, "pricing question asked");
  if (extraction.requirements.siteVisitInterest === "interested")
    add(POSITIVE_WEIGHTS.siteVisitInterest, "site visit interest");
  if (extraction.signals.strongBuyingIntent) add(POSITIVE_WEIGHTS.strongBuyingIntent, "strong buying intent");

  if (extraction.signals.explicitlyNotInterested)
    add(NEGATIVE_WEIGHTS.explicitlyNotInterested, "explicitly not interested");
  if (extraction.signals.wrongPerson) add(NEGATIVE_WEIGHTS.wrongPerson, "wrong person");
  if (extraction.signals.justBrowsingNoTimeline)
    add(NEGATIVE_WEIGHTS.justBrowsingNoTimeline, "just browsing, no timeline");

  const clampedScore = Math.max(0, Math.min(100, score));

  let temperature: LeadTemperature;
  if (extraction.signals.explicitlyNotInterested) {
    temperature = "NOT_INTERESTED";
  } else if (extraction.signals.wrongPerson) {
    temperature = "UNKNOWN";
  } else if (extraction.signals.requestedCallback && clampedScore < WARM_THRESHOLD) {
    temperature = "CALLBACK";
  } else if (clampedScore >= HOT_THRESHOLD) {
    temperature = "HOT";
  } else if (clampedScore >= WARM_THRESHOLD) {
    temperature = "WARM";
  } else if (clampedScore > 0) {
    temperature = "COLD";
  } else {
    temperature = "UNKNOWN";
  }

  return { score: clampedScore, temperature, reasons };
}
