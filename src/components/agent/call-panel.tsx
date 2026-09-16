"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import type { CallRecord, CallState } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATE_MESSAGE: Record<CallState, string> = {
  created: "CONNECTING TO AI SALES AGENT...",
  initiating: "CONNECTING TO AI SALES AGENT...",
  ringing: "CALLING...",
  connected: "CALL IN PROGRESS",
  in_progress: "CALL IN PROGRESS",
  completed: "CALL COMPLETE",
  failed: "CALL FAILED",
};

const TERMINAL: CallState[] = ["completed", "failed"];

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function CallPanel({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [call, setCall] = useState<CallRecord | null>(null);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  async function handleCallMe() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Call could not be started.");
        setSubmitting(false);
        return;
      }

      const pollCall = async (id: string) => {
        const r = await fetch(`/api/calls/${id}`);
        const d = await r.json();
        if (r.ok) {
          setCall(d.call);
          if (TERMINAL.includes(d.call.status)) {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      };

      await pollCall(data.callId);
      pollRef.current = setInterval(() => pollCall(data.callId), 1500);

      tickRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    } catch {
      setError("We couldn't connect the call. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEndCall() {
    setEnded(true);
    if (pollRef.current) clearInterval(pollRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    if (call) router.push(`/calls/${call.id}`);
  }

  if (!call) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
          +91
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            inputMode="tel"
            className="flex-1"
          />
          <Button onClick={handleCallMe} disabled={submitting || phone.trim().length < 8} size="lg">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "CALL ME"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-[var(--restricted)]">{error}</p>}
        <p className="mt-4 text-[13px] text-[var(--muted-2)]">
          Enter a number you have permission to call for this demonstration.
        </p>
      </div>
    );
  }

  const message = STATE_MESSAGE[call.status];
  const inProgress = call.status === "connected" || call.status === "in_progress";
  const isTerminal = TERMINAL.includes(call.status);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <Badge variant={call.mode === "real" ? "live" : "outline"}>
          {call.mode === "real" ? "Real Call" : "Demo Call"}
        </Badge>
        {!isTerminal && (
          <span className={cn("h-2 w-2 rounded-full bg-emerald-600", !ended && "pulse-dot")} />
        )}
      </div>

      <div className="mt-6 text-center">
        <div className="text-[13px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
          {projectName}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{message}</div>
        {inProgress && <div className="mt-2 font-tabular text-lg text-[var(--muted)]">{formatTimer(elapsed)}</div>}
        {call.status === "failed" && call.failureReason && (
          <div className="mt-2 text-sm text-[var(--restricted)]">{call.failureReason}</div>
        )}
        {call.language && (
          <div className="mt-1 text-[12px] uppercase tracking-wide text-[var(--muted-2)]">
            Language: {call.language}
          </div>
        )}
      </div>

      {!isTerminal ? (
        <div className="mt-8">
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => setMuted((m) => !m)}>
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {muted ? "Unmute" : "Mute"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleEndCall}>
              <PhoneOff className="h-4 w-4" /> End Call
            </Button>
          </div>
          {call.mode === "real" && (
            <p className="mt-3 text-center text-[12px] text-[var(--muted-2)]">
              The conversation is live on the recipient&apos;s phone. These controls stop tracking it here —
              the AI agent ends the call naturally.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-8 flex justify-center">
          <Button href={`/calls/${call.id}`} size="lg">
            View Call Result
          </Button>
        </div>
      )}
    </div>
  );
}
