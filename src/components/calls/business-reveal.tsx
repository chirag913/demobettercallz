import { Button } from "@/components/ui/button";
import type { CallRecord } from "@/lib/types";

export function BusinessReveal({ call, error, onRetry, onTryAgain }: { call: CallRecord; error: string | null; onRetry: () => void; onTryAgain?: () => void }) {
  const intelligence = call.conversationIntelligence;
  const business = intelligence?.business;
  return <section className="mx-auto max-w-4xl py-8">
    <h2 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Okay. Here’s what we understood.</h2>
    <p className="mt-4 text-[var(--muted)]">From your conversation. Anything you didn’t tell us stays unknown.</p>
    {business ? <>
      <dl className="mt-10 grid gap-x-10 sm:grid-cols-2">
        {([ ["Business / industry", business.industry], ["Lead source", business.leadSource], ["Current sales process", business.salesProcess], ["Main problem", business.mainProblem], ["Qualification signals", business.qualification], ["Buying intent", business.intent], ["Important context", business.context] ] as const).map(([label, fact]) => <div key={label} className="border-t border-[var(--border)] py-5">
          <dt className="text-sm text-[var(--muted)]">{label}</dt>
          <dd className="mt-2 text-lg font-medium">{fact.value ?? "Not shared"}</dd>
          {fact.evidence && <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">“{fact.evidence}”</dd>}
        </div>)}
      </dl>
      <section className="mt-12 border-t border-[var(--border-strong)] pt-10">
        <h3 className="max-w-xl text-3xl font-semibold tracking-tight">Your salesperson doesn’t need the whole conversation.</h3>
        <p className="mt-3 text-[var(--muted)]">This is what your sales team would have received.</p>
        <dl className="mt-6 space-y-5 rounded-[var(--radius-lg)] bg-[var(--foreground)] p-7 text-[var(--surface)]">
          {([ ["Who this person is", business.industry.value], ["Why they matter", business.qualification.value], ["What they said", business.context.value ?? business.leadSource.value], ["What they need", business.mainProblem.value], ["What to do next", intelligence.nextBestAction] ] as const).map(([label, value]) => <div key={label}><dt className="text-sm text-white/70">{label}</dt><dd className="mt-1 leading-relaxed">{value ?? "Not enough information shared"}</dd></div>)}
        </dl>
        <p className="mt-3 text-sm text-[var(--muted)]">Suggested next step for review. No salesperson has been notified automatically.</p>
      </section>
    </> : <div role="status" className="my-10 border-y border-[var(--border)] py-8">
      <p>{error ?? "Understanding your conversation…"}</p>
      {error && <Button onClick={onRetry} variant="secondary" className="mt-4">Try analysis again</Button>}
    </div>}
    <details className="mt-10 border-y border-[var(--border)] py-5">
      <summary className="cursor-pointer py-2 font-medium focus-visible:outline-2">See the conversation</summary>
      <p className="mt-4 text-sm text-[var(--muted)]">{call.durationSeconds == null ? "Duration unavailable" : `${call.durationSeconds} seconds`} · {call.language ?? "Language not reported"} · Call completed</p>
      <div className="mt-6 space-y-5">{call.transcript?.length ? call.transcript.map((turn, index) => <div key={index} className="grid grid-cols-[4rem_1fr] gap-3"><span className="text-sm text-[var(--muted)]">{turn.speaker === "agent" ? "AI" : "You"}</span><p className="min-w-0 break-words leading-relaxed">{turn.text}</p></div>) : <p>The call provider has not supplied a transcript.</p>}</div>
      {call.recordingUrl && <audio className="mt-6 w-full" controls src={call.recordingUrl} />}
    </details>
    <div className="mt-14">
      <h3 className="text-3xl font-semibold tracking-tight">Imagine this happening to every lead.</h3>
      <p className="mt-4 leading-relaxed text-[var(--muted)]">Every Meta lead. Every missed call.<br />Every old lead sitting in your CRM.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Button href={onTryAgain ? undefined : "/#demo"} onClick={onTryAgain}>Try another call</Button><Button href="/contact" variant="secondary">Build this for my business</Button></div>
    </div>
  </section>;
}
