"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import type { KnowledgeFact } from "@/lib/types";

const REFUSAL = "I don't have verified information confirming that, so I don't want to give you an incorrect answer.";
const RESTRICTED_REFUSAL = "I don't have verified information on that.";

export function AntiHallucinationDemo({ facts }: { facts: KnowledgeFact[] }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  function test(q: string) {
    const query = q.toLowerCase();
    if (!query.trim()) return;

    const STOPWORDS = new Set([
      "project",
      "there",
      "this",
      "that",
      "about",
      "inside",
      "private",
      "does",
      "have",
      "with",
      "what",
      "when",
      "where",
    ]);
    const significantWords = (label: string) =>
      label
        .toLowerCase()
        .split(/[\s&]+/)
        .filter((w) => w.length > 3 && !STOPWORDS.has(w));

    const restrictedHit = facts.find(
      (f) => f.verificationStatus === "restricted" && significantWords(f.label).some((w) => query.includes(w)),
    );
    if (restrictedHit) {
      setAnswer(RESTRICTED_REFUSAL);
      return;
    }

    const hit = facts.find((f) => significantWords(f.label).some((w) => query.includes(w)));

    if (hit && hit.verificationStatus !== "restricted") {
      setAnswer(
        `${hit.value}${hit.verificationStatus === "unverified" ? " — noted as unverified, our sales team will confirm this." : ""}`,
      );
      return;
    }

    setAnswer(REFUSAL);
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
        <h3 className="text-[15px] font-semibold tracking-tight">Test the AI</h3>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Ask something the project knowledge does not contain — for example,{" "}
        <button
          type="button"
          className="underline underline-offset-2 hover:opacity-70"
          onClick={() => {
            setQuestion("Is there a private golf course inside the project?");
            test("Is there a private golf course inside the project?");
          }}
        >
          &ldquo;Is there a private golf course inside the project?&rdquo;
        </button>
      </p>
      <div className="mt-4 flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && test(question)}
          placeholder="Ask a question about the project…"
        />
        <Button variant="secondary" onClick={() => test(question)}>
          Ask
        </Button>
      </div>
      {answer && (
        <div className="mt-4 animate-fade-in-up rounded-[var(--radius-sm)] border border-[var(--border)] bg-black/[0.02] p-4 text-sm">
          {answer}
        </div>
      )}
      <p className="mt-4 text-[12px] text-[var(--muted-2)]">
        This preview runs a lightweight keyword match against the same knowledge layer the AI agent uses —
        it demonstrates the rule, not the live model. The Sarvam agent enforces this same refusal in the
        actual phone call via its instructions (see Talk to AI Agent).
      </p>
    </div>
  );
}
