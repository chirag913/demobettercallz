import { Badge } from "@/components/ui/badge";
import type { KnowledgeFact } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusLabel: Record<KnowledgeFact["verificationStatus"], string> = {
  verified: "Verified",
  unverified: "Unverified",
  restricted: "Restricted",
};

export function FactRow({ fact }: { fact: KnowledgeFact }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] px-6 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">{fact.label}</div>
        <div
          className={cn(
            "mt-1 text-[15px] font-medium",
            fact.verificationStatus === "restricted" && "text-[var(--muted)]",
          )}
        >
          {fact.value}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
        <Badge variant={fact.verificationStatus}>{statusLabel[fact.verificationStatus]}</Badge>
        <div className="text-right text-[12px] text-[var(--muted-2)]">
          <div>Source: {fact.source}</div>
          <div>Confidence: {fact.confidence}%</div>
        </div>
      </div>
    </div>
  );
}
