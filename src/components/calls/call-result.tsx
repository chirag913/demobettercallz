"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, PhoneMissed, PhoneOutgoing } from "lucide-react";
import type { CallRecord, CallState } from "@/lib/types";

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

export function CallResult({ callId }: { callId: string }) {
  const [call, setCall] = useState<CallRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      const res = await fetch(`/api/calls/${callId}`);
      if (!active) return;
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setCall(data.call);
      if (data.call.status === "completed" || data.call.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }
    poll();
    pollRef.current = setInterval(poll, 1500);
    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [callId]);

  if (notFound) {
    return <p className="text-[var(--muted)]">This call could not be found.</p>;
  }

  if (!call) {
    return (
      <div className="flex items-center gap-2 text-[var(--muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading call…
      </div>
    );
  }

  const isTerminal = call.status === "completed" || call.status === "failed";

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
          <div className="mt-10">
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

          <div className="mt-10">
            <Button variant="secondary" disabled title="Coming in the next phase.">
              View Lead Intelligence →
            </Button>
            <p className="mt-2 text-[12px] text-[var(--muted-2)]">Coming in the next phase.</p>
          </div>
        </>
      )}
    </div>
  );
}
