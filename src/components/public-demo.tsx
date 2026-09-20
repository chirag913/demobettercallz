"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CallResult } from "@/components/calls/call-result";
import { PUBLIC_DEMO_ID } from "@/data/publicDemo";
import type { CallRecord } from "@/lib/types";

export function PublicDemo({ available }: { available: boolean }) {
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [call, setCall] = useState<CallRecord | null>(null);
  const [error, setError] = useState("");
  const [pollError, setPollError] = useState(false);
  const lock = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!callId) return;
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch(`/api/calls/${callId}`, { signal: AbortSignal.timeout(12000) });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!active) return;
        setCall(data.call);
        setPollError(false);
        if (["completed", "failed"].includes(data.call.status)) return;
      } catch { if (active) setPollError(true); }
      if (active) timeout = setTimeout(poll, 2500);
    }
    void poll();
    return () => { active = false; clearTimeout(timeout); };
  }, [callId]);
  useEffect(() => { if (call?.status === "completed") resultRef.current?.focus(); }, [call?.status]);
  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError(""); lock.current = true; setPending(true);
    try {
      const response = await fetch("/api/calls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: PUBLIC_DEMO_ID, phone }) });
      const data = await response.json();
      if (!response.ok || !data.callId) throw new Error(data.error ?? "We couldn’t start the call. Please try again.");
      setCallId(data.callId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check your connection and try again."); }
    finally { lock.current = false; setPending(false); }
  }
  if (call?.status === "completed") return <div ref={resultRef} tabIndex={-1} className="outline-none"><CallResult callId={call.id} onTryAgain={() => { setCallId(null); setCall(null); setPhone(""); }} /></div>;
  if (callId) return <div className="mx-auto max-w-xl border-y border-[var(--border-strong)] py-12 text-center" role="status">
    <Phone aria-hidden="true" className="mx-auto mb-5 h-8 w-8" strokeWidth={1.5} />
    <h2 className="text-3xl font-semibold tracking-tight">{call?.status === "failed" ? "We couldn’t connect this time." : "Your phone is about to ring."}</h2>
    <p className="mt-4 leading-relaxed text-[var(--muted)]">{call?.status === "failed" ? "Check your number and try again when you’re ready." : "Pick up and talk naturally. Interrupt. Change the subject. Try another language. Keep this page open for the reveal."}</p>
    {call?.status !== "failed" && <p className="mt-6 text-sm text-[var(--muted)]">{pollError ? "Connection to the page interrupted. Reconnecting… Your phone call may continue." : "Waiting for the call provider’s result. Live speech is on your phone."}</p>}
    {call?.status === "failed" && <Button className="mt-6" onClick={() => { setCallId(null); setCall(null); }}>Try again</Button>}
    <Button href={`/calls/${callId}`} variant="link" className="mt-6">Open call result</Button>
  </div>;
  return <form onSubmit={start} className="mx-auto max-w-lg">
    <label htmlFor="demo-phone" className="mb-3 block text-left text-sm font-medium">Your phone number</label>
    <div className="flex min-h-16 items-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] focus-within:outline-2 focus-within:outline-offset-2">
      <span className="border-r border-[var(--border)] px-5 text-xl">+91</span>
      <input id="demo-phone" name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" autoComplete="tel-national" required maxLength={20} placeholder="98765 43210" aria-describedby="demo-phone-note" className="h-16 min-w-0 flex-1 bg-transparent px-4 text-xl outline-none placeholder:text-[var(--muted)]" />
    </div>
    <Button type="submit" size="lg" disabled={pending || !available} className="mt-3 h-16 w-full text-base">{pending ? <><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Starting your call…</> : <>LET IT CALL ME <ArrowRight aria-hidden="true" className="h-4 w-4" /></>}</Button>
    <p id="demo-phone-note" className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{available ? "Live AI voice demo · Takes about 60 seconds" : "Live calling is being connected. Contact us to arrange a demo."}</p>
    <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">Use your own number. Submitting requests one AI call; its transcript is used to show your sales summary.</p>
    {error && <p role="alert" className="mt-4 text-sm text-[var(--restricted)]">{error}</p>}
  </form>;
}
