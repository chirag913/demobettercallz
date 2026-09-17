"use client";

import { useState } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Quote, RefreshCw, ShieldCheck } from "lucide-react";
import type {
  ConversationIntelligence,
  KnowledgeQuestionStatus,
  LeadTemperature,
  SiteVisitInterest,
} from "@/lib/intelligence/types";

const TEMPERATURE_LABEL: Record<LeadTemperature, string> = {
  HOT: "Hot Lead",
  WARM: "Warm Lead",
  COLD: "Cold Lead",
  NOT_INTERESTED: "Not Interested",
  CALLBACK: "Requested Callback",
  UNKNOWN: "Unclear Intent",
};

const TEMPERATURE_VARIANT: Record<LeadTemperature, NonNullable<BadgeProps["variant"]>> = {
  HOT: "live",
  WARM: "verified",
  COLD: "outline",
  NOT_INTERESTED: "restricted",
  CALLBACK: "unverified",
  UNKNOWN: "neutral",
};

const SITE_VISIT_LABEL: Record<SiteVisitInterest, string> = {
  interested: "Interested in a site visit",
  maybe: "Open to a site visit",
  not_interested: "Not interested in a site visit",
  unknown: "Site visit interest unknown",
};

function RequirementChip({ label, value, evidence }: { label: string; value: string | null; evidence: string | null }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--border)] px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">{label}</div>
      <div className="mt-1 text-[15px] font-medium">{value ?? "Not mentioned"}</div>
      {evidence && <div className="mt-1.5 text-[12px] italic text-[var(--muted)]">&ldquo;{evidence}&rdquo;</div>}
    </div>
  );
}

function questionStatusDisplay(status: KnowledgeQuestionStatus, answeredAppropriately: boolean) {
  if (status === "verified") {
    return { variant: "verified" as const, label: "Verified knowledge used" };
  }
  if (status === "unverified") {
    return { variant: "unverified" as const, label: "Unverified information used" };
  }
  // restricted or not_covered
  if (answeredAppropriately) {
    return { variant: "unverified" as const, label: "Verification required — AI avoided unsupported claim" };
  }
  return { variant: "restricted" as const, label: "Needs review — possible unsupported claim" };
}

export function ConversationIntelligenceView({
  intelligence,
  onScrollToTranscript,
}: {
  intelligence: ConversationIntelligence;
  onScrollToTranscript: () => void;
}) {
  const [handedOff, setHandedOff] = useState(false);
  const hasRequirements =
    intelligence.requirements.budget ||
    intelligence.requirements.configuration ||
    intelligence.requirements.preferredLocation ||
    intelligence.requirements.purchaseTimeline;
  const hasSignal =
    hasRequirements || intelligence.buyingSignals.length > 0 || intelligence.objections.length > 0;

  return (
    <div className="mt-10">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Conversation Intelligence
      </h2>

      <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-6 py-5">
          <div>
            <div className="text-[17px] font-semibold tracking-tight">
              {intelligence.leadName ?? "Unidentified Caller"}
            </div>
            <div className="mt-1 text-[13px] text-[var(--muted)]">{SITE_VISIT_LABEL[intelligence.requirements.siteVisitInterest]}</div>
          </div>
          <Badge variant={TEMPERATURE_VARIANT[intelligence.leadTemperature]}>
            {TEMPERATURE_LABEL[intelligence.leadTemperature]}
          </Badge>
        </div>

        <div className="px-6 py-5">
          <p className="text-[15px] leading-relaxed">{intelligence.summary}</p>
        </div>

        {!hasSignal && (
          <div className="mx-6 mb-5 rounded-[var(--radius-sm)] border border-dashed border-[var(--border-strong)] px-4 py-3 text-[13px] text-[var(--muted)]">
            Not enough information was shared in this conversation to build a detailed buyer profile.
          </div>
        )}

        {hasRequirements && (
          <div className="grid grid-cols-2 gap-3 px-6 pb-6 sm:grid-cols-4">
            <RequirementChip
              label="Budget"
              value={intelligence.requirements.budget}
              evidence={intelligence.requirements.budgetEvidence}
            />
            <RequirementChip
              label="Configuration"
              value={intelligence.requirements.configuration}
              evidence={intelligence.requirements.configurationEvidence}
            />
            <RequirementChip
              label="Location"
              value={intelligence.requirements.preferredLocation}
              evidence={intelligence.requirements.preferredLocationEvidence}
            />
            <RequirementChip
              label="Timeline"
              value={intelligence.requirements.purchaseTimeline}
              evidence={intelligence.requirements.purchaseTimelineEvidence}
            />
          </div>
        )}

        {(intelligence.buyingSignals.length > 0 || intelligence.objections.length > 0) && (
          <div className="grid grid-cols-1 gap-6 border-t border-[var(--border)] px-6 py-6 sm:grid-cols-2">
            {intelligence.buyingSignals.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Buying Signals</div>
                <ul className="mt-3 space-y-2">
                  {intelligence.buyingSignals.map((signal, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[14px]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--verified)]" strokeWidth={1.5} />
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {intelligence.objections.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Objections</div>
                <ul className="mt-3 space-y-3">
                  {intelligence.objections.map((objection, idx) => (
                    <li key={idx} className="text-[14px]">
                      <div className="flex items-start gap-2">
                        <Quote className="mt-0.5 h-4 w-4 shrink-0 text-[var(--unverified)]" strokeWidth={1.5} />
                        <span>{objection.text}</span>
                      </div>
                      {objection.evidence && (
                        <div className="ml-6 mt-1 text-[12px] italic text-[var(--muted)]">
                          &ldquo;{objection.evidence}&rdquo;
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-[var(--border)] px-6 py-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
            <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Knowledge Guard</div>
          </div>

          {intelligence.questionsAsked.length === 0 ? (
            <p className="mt-3 text-[14px] text-[var(--muted)]">
              No project-specific questions were asked in this call.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-[13px] text-[var(--muted)]">
                {intelligence.knowledgeGuard.verifiedQuestionsAnswered} of {intelligence.questionsAsked.length} question
                {intelligence.questionsAsked.length === 1 ? "" : "s"} answered from verified project knowledge.
              </p>
              <ul className="space-y-2">
                {intelligence.questionsAsked.map((q, idx) => {
                  const display = questionStatusDisplay(q.knowledgeStatus, q.answeredAppropriately);
                  return (
                    <li
                      key={idx}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-4 py-3"
                    >
                      <span className="text-[14px]">{q.question}</span>
                      <Badge variant={display.variant}>{display.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] px-6 py-6">
          <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Next Best Action</div>
          <p className="mt-2 text-[15px] leading-relaxed">{intelligence.nextBestAction}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={onScrollToTranscript}>
              View Transcript
            </Button>
            <Button variant="primary" size="sm" disabled={handedOff} onClick={() => setHandedOff(true)}>
              {handedOff ? "Handed Off to Sales ✓" : "Hand Off to Sales"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConversationIntelligenceLoading() {
  return (
    <div className="mt-10">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Conversation Intelligence
      </h2>
      <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-[var(--muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analyzing conversation…
      </div>
    </div>
  );
}

export function ConversationIntelligenceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-10">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Conversation Intelligence
      </h2>
      <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-6 py-6">
        <p className="text-[14px] text-[var(--muted)]">{message}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry Analysis
        </Button>
      </div>
    </div>
  );
}
