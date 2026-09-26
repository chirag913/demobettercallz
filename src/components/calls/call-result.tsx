"use client";
import { SOLAR_DEMO_ID } from '@/data/solarDemo';
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, PhoneMissed, PhoneOutgoing } from "lucide-react";
import {
  ConversationIntelligenceError,
  ConversationIntelligenceLoading,
  ConversationIntelligenceView,
} from "@/components/calls/conversation-intelligence";
import type { CallRecord, CallState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BusinessReveal } from "@/components/calls/business-reveal";
import { PUBLIC_DEMO_ID } from "@/data/publicDemo";

const STATE_MESSAGE: Record<CallState, string> = {
  created: "CONNECTING TO AI SALES AGENT...",
  initiating: "CONNECTING TO AI SALES AGENT...",
  ringing: "CALLING...",
  connected: "CALL IN PROGRESS",
  in_progress: "CALL IN PROGRESS",
  completed: "CALL COMPLETE",
  failed: "CALL FAILED",
};

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function CallResult({ callId, onTryAgain }: { callId: string; onTryAgain?: () => void }) {
  const [call, setCall] = useState<CallRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pollError, setPollError] = useState(false);
  const [intelligenceStatus, setIntelligenceStatus] = useState<"idle" | "loading" | "error">("idle");
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null);
  const intelligenceRequestedRef = useRef(false);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  async function runIntelligenceAnalysis(id: string, options?: { regenerate?: boolean }) {
    intelligenceRequestedRef.current = true;
    setIntelligenceStatus("loading");
    setIntelligenceError(null);
    try {
      const res = await fetch(`/api/calls/${id}/intelligence${options?.regenerate ? "?regenerate=true" : ""}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setIntelligenceError(data.error ?? "Conversation intelligence is temporarily unavailable.");
        setIntelligenceStatus("error");
        return;
      }
      setCall((prev) => (prev ? { ...prev, conversationIntelligence: data.intelligence } : prev));
      setIntelligenceStatus("idle");
    } catch {
      setIntelligenceError("Conversation intelligence is temporarily unavailable.");
      setIntelligenceStatus("error");
    }
  }

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const res = await fetch(`/api/calls/${callId}`, { signal: AbortSignal.timeout(12000) });
        if (!active) return;
        if (res.status === 404) {
          setNotFound(true);
        } else if (!res.ok) {
          setPollError(true);
        } else {
          const data = await res.json();
          if (!active) return;
          setNotFound(false);
          setPollError(false);
          setCall((previous) => ({ ...data.call, conversationIntelligence: data.call.conversationIntelligence ?? (previous?.id === data.call.id ? previous?.conversationIntelligence : null) }));
          if (data.call.status === "completed" || data.call.status === "failed") return;
        }
      } catch {
        if (!active) return;
        setPollError(true);
      }
      if (active) timeout = setTimeout(poll, 2000);
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [callId]);

  useEffect(() => {
    if (!call || call.projectId === SOLAR_DEMO_ID) return;
    if (call.status !== "completed") return;
    if (call.conversationIntelligence) return;
    if (intelligenceRequestedRef.current) return;
    runIntelligenceAnalysis(call.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.id, call?.status, call?.conversationIntelligence]);

  if (notFound) {
    return <p className="text-[var(--muted)]">This call could not be found.</p>;
  }

  if (!call) {
    return (
      <div className="flex items-center gap-2 text-[var(--muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> {pollError ? "Connection interrupted. Retrying…" : "Loading call…"}
      </div>
    );
  }

  const isTerminal = call.status === "completed" || call.status === "failed";

  if (call.projectId === PUBLIC_DEMO_ID && call.status === "completed") {
    return <BusinessReveal call={call} error={intelligenceError} onRetry={() => runIntelligenceAnalysis(call.id, { regenerate: true })} onTryAgain={onTryAgain} />;
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {call.status === "failed" ? (
          <PhoneMissed className="h-5 w-5 text-[var(--restricted)]" strokeWidth={1.5} />
        ) : (
          <PhoneOutgoing className="h-5 w-5" strokeWidth={1.5} />
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{STATE_MESSAGE[call.status]}</h1>
        <Badge variant={call.mode === "real" ? "live" : "outline"}>{call.mode === "real" ? "Real Call" : "Demo Call"}</Badge>
      </div>

      <div className="mt-8 grid grid-cols-3 divide-x divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
        <div className="px-6 py-5">
          <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Duration</div>
          <div className="mt-1.5 text-[15px] font-medium font-tabular">{formatDuration(call.durationSeconds)}</div>
        </div>
        <div className="px-6 py-5">
          <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Language</div>
          <div className="mt-1.5 text-[15px] font-medium capitalize">{call.language ?? "—"}</div>
        </div>
        <div className="px-6 py-5">
          <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Outcome</div>
          <div className="mt-1.5 text-[15px] font-medium">
            {call.status === "completed"
              ? "Connected"
              : call.status === "failed"
                ? (call.failureReason ?? "Not connected")
                : "In progress"}
          </div>
        </div>
      </div>

      {isTerminal && (
        <>
          <div className="mt-10" ref={transcriptRef}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Transcript</h2>
            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-6">
              {call.transcript && call.transcript.length > 0 ? (
                <div className="space-y-4">
                  {call.transcript.map((turn, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-16 shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
                        {turn.speaker === "agent" ? "AI" : "Prospect"}
                      </div>
                      <div className="text-[15px]">{turn.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--muted)]">No transcript is available for this call.</p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Call Recording</h2>
            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-6">
              {call.recordingUrl ? (
                <audio controls src={call.recordingUrl} className="w-full" />
              ) : (
                <p className="text-[var(--muted)]">Recording unavailable for this call.</p>
              )}
            </div>
          </div>

          {call.status === "completed" && call.projectId !== SOLAR_DEMO_ID &&
            (call.conversationIntelligence ? (
              <ConversationIntelligenceView
                intelligence={call.conversationIntelligence}
                onScrollToTranscript={() => transcriptRef.current?.scrollIntoView({ behavior: "smooth" })}
              />
            ) : intelligenceStatus === "error" ? (
              <ConversationIntelligenceError
                message={intelligenceError ?? "Conversation intelligence is temporarily unavailable."}
                onRetry={() => runIntelligenceAnalysis(call.id, { regenerate: true })}
              />
            ) : (
              <ConversationIntelligenceLoading />
            ))}
          {call.status === "completed" && (
            <section className="mt-12 border-t border-[var(--border)] pt-10">
              <h2 className="text-3xl font-semibold tracking-tight">Imagine this happening to every lead.</h2>
              <p className="mt-3 text-[var(--muted)]">Every Meta lead. Every missed call. Every old lead sitting in your CRM.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href={`/projects/${call.projectId}/agent`}>Try another call</Button>
                <Button href="/contact" variant="secondary">Build this for my business</Button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
