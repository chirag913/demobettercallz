import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PublicDemo } from "@/components/public-demo";
import { WhatsAppLink } from "@/components/whatsapp-link";
import { getSarvamConfig } from "@/lib/sarvam/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "BetterCallz — From lead to sales conversation",
  description: "BetterCallz calls your leads, handles the first sales conversation, and gives your sales team useful context. Experience a live call. No signup required.",
};

const steps = [
  ["Lead comes in", "Meta, website, CRM, existing database or API."],
  ["BetterCallz calls", "Start the conversation while the intent is fresh."],
  ["AI has the conversation", "Listen, adapt, answer and understand what the lead actually wants."],
  ["Conversation becomes context", "Requirement. Budget. Timeline. Intent. Objections. Next action."],
  ["Sales takes over", "Your team speaks to the people worth speaking to."],
];

export default function Home() {
  const available = !!getSarvamConfig(true) && isSupabaseConfigured();
  return <AppShell>
    <WhatsAppLink />
    <section id="demo" className="mx-auto max-w-6xl scroll-mt-32 px-6 pb-16 pt-10 md:scroll-mt-24 md:pb-20 md:pt-16">
      <div className="mb-8 text-center md:mb-10">
        <p className="text-xs font-semibold tracking-[0.16em]">BETTERCALLZ</p>
        <h1 className="mx-auto mt-5 max-w-5xl text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">Your leads are already coming in.<br className="hidden sm:block" /> What happens next?</h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted)] md:text-lg">BetterCallz calls your leads, has the first sales conversation, qualifies what they want, and gives your sales team the conversations worth pursuing.</p>
      </div>
      <PublicDemo available={available} />
    </section>

    <section aria-label="From lead to sales team" className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
      <ol className="flex flex-col items-center gap-3 border-y border-[var(--border)] py-8 sm:flex-row sm:justify-between sm:gap-2">
        {["Lead received", "AI calls", "Conversation", "Qualified", "Sales team"].map((step, index) => <li key={step} className="flex flex-col items-center gap-3 sm:contents">
          {index > 0 && <ArrowDown aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--muted)] sm:-rotate-90" />}
          <span className="text-xs font-medium uppercase tracking-[0.08em]">{step}</span>
        </li>)}
      </ol>
      <p className="mx-auto mt-9 max-w-3xl text-center text-2xl font-medium leading-snug tracking-tight text-balance md:text-3xl">The AI handles the first conversation.<br /><span className="text-[var(--muted)]">Your salesperson handles the opportunity.</span></p>
    </section>

    <section className="border-y border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:gap-20 md:py-24">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">You already paid for the lead.<br /><span className="text-[var(--muted)]">Make sure someone calls it.</span></h2>
        <div className="self-end"><p className="max-w-md text-lg leading-relaxed">The ad works. The form fills. The lead comes in.</p><p className="mt-4 max-w-md leading-relaxed text-[var(--muted)]">What happens in the minutes after that is where the opportunity can disappear.</p><p className="mt-6 max-w-md leading-relaxed text-[var(--muted)]">BetterCallz gives that lead a first conversation — and turns what happened on the call into context your sales team can actually use.</p></div>
      </div>
    </section>

    <section id="how-it-works" className="mx-auto grid max-w-6xl scroll-mt-32 gap-10 px-6 py-16 md:grid-cols-[0.85fr_1.15fr] md:gap-20 md:py-24">
      <div><h2 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight md:text-5xl">From lead to sales conversation.</h2><p className="mt-5 max-w-xs text-sm leading-relaxed text-[var(--muted)]">Lead sources connect through your configured workflow or API.</p></div>
      <ol>
        {steps.map(([title, copy], index) => <li key={title} className="grid grid-cols-[2rem_1fr] gap-4 border-t border-[var(--border)] py-6 first:border-[var(--border-strong)] first:pt-5">
          <span className="pt-1 text-xs font-medium tabular-nums text-[var(--muted)]">0{index + 1}</span>
          <div><h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3><p className="mt-2 max-w-md leading-relaxed text-[var(--muted)]">{copy}</p></div>
        </li>)}
      </ol>
    </section>

    <section className="border-y border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-20 md:py-24">
        <div><h2 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Not another lead.<br />A sales-ready conversation.</h2><p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--muted)]">Every conversation becomes structured context your team can act on.</p><Button href="#demo" variant="link" className="mt-7 whitespace-normal text-left">See what it understands from your call <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Button></div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--background)] p-6 sm:p-8">
          <div className="border-b border-[var(--border-strong)] pb-5"><h3 className="font-semibold">Conversation brief</h3><p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">Illustrative example · Real estate<br />Not a customer result or your live call.</p></div>
          <dl className="grid grid-cols-2 gap-x-6">
            {[["Intent", "High"], ["Requirement", "3 BHK"], ["Budget", "₹2–2.5 Cr"], ["Timeline", "1–2 months"], ["Key concern", "Possession"]].map(([label, value]) => <div key={label} className="border-b border-[var(--border)] py-5"><dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</dt><dd className="mt-2 text-lg font-medium tabular-nums">{value}</dd></div>)}
            <div className="col-span-2 pt-6"><dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Next action</dt><dd className="mt-2 flex items-center justify-between gap-4 text-xl font-medium">Schedule site visit <ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0" /></dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section aria-label="Two core use cases" className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:gap-20 md:py-24">
      <div><p className="text-xs font-medium tracking-wide text-[var(--muted)]">NEW LEADS · INSTANT LEAD CALLING</p><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">Call while intent is fresh.</h2><p className="mt-5 max-w-md leading-relaxed text-[var(--muted)]">A lead submits their number. BetterCallz starts the first conversation before the opportunity goes cold.</p><Button href="/contact" variant="link" className="mt-6">Talk about your new leads <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Button></div>
      <div className="border-t border-[var(--border)] pt-10 md:border-t-0 md:pt-0"><p className="text-xs font-medium tracking-wide text-[var(--muted)]">OLD LEADS · LEAD RECOVERY</p><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">Find the opportunities you already paid for.</h2><p className="mt-5 max-w-md leading-relaxed text-[var(--muted)]">Revisit dormant leads, understand what changed, and surface the people who are still worth pursuing.</p><Button href="/contact" variant="link" className="mt-6">Talk about your existing leads <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Button></div>
    </section>

    <section className="border-y border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:items-center md:gap-20 md:py-24">
        <h2 className="max-w-md text-5xl font-semibold leading-tight tracking-tight md:text-6xl">Now try<br />to break it.</h2>
        <div><p className="max-w-md text-xl leading-relaxed">Interrupt it. Switch to Hindi. Change the subject. Ask something unexpected. Ask if it’s AI.</p><p className="mt-5 max-w-md leading-relaxed text-[var(--muted)]">If you’re going to put AI on your leads, you should know how it actually behaves in a conversation.</p><p className="mt-4 text-sm text-[var(--muted)]">Ask directly, and it will tell you it’s an AI sales agent.</p><Button href="#demo" size="lg" className="mt-7">LET IT CALL ME <ArrowRight aria-hidden="true" className="h-4 w-4" /></Button></div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <h2 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Built around the way sales teams already work.</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center md:gap-8">
        <div className="border-t border-[var(--border-strong)] py-6"><h3 className="text-xs font-semibold uppercase tracking-wide">Lead sources</h3><ul className="mt-5 space-y-2 text-lg text-[var(--muted)]">{["Meta", "Website", "CRM", "Existing database", "API"].map(item => <li key={item}>{item}</li>)}</ul></div>
        <ArrowDown aria-hidden="true" className="h-5 w-5 text-[var(--muted)] md:-rotate-90" />
        <div className="border-y border-[var(--foreground)] py-6"><h3 className="text-xs font-semibold uppercase tracking-wide">BetterCallz</h3><ul className="mt-5 space-y-2 text-lg">{["Call", "Conversation", "Qualification", "Context"].map(item => <li key={item}>{item}</li>)}</ul></div>
        <ArrowDown aria-hidden="true" className="h-5 w-5 text-[var(--muted)] md:-rotate-90" />
        <div className="border-t border-[var(--border-strong)] py-6"><h3 className="text-xs font-semibold uppercase tracking-wide">Sales</h3><ul className="mt-5 space-y-2 text-lg text-[var(--muted)]">{["CRM", "Salesperson", "WhatsApp", "Follow-up"].map(item => <li key={item}>{item}</li>)}</ul></div>
      </div>
      <p className="mt-7 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">Conceptual workflow. Sources and destinations depend on your workflow/API setup; the services shown are not all native integrations.</p>
    </section>

    <section className="bg-[var(--foreground)] text-[var(--surface)]"><div className="mx-auto max-w-6xl px-6 py-16 md:py-24"><h2 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">Put BetterCallz on your next batch of leads.</h2><p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">Start with the conversation. See what your sales team gets back.</p><div className="mt-8 flex flex-wrap gap-4"><Button href="#demo" className="bg-white text-black hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-black" size="lg">TRY THE LIVE CALL <ArrowRight aria-hidden="true" className="h-4 w-4" /></Button><Button href="/contact" variant="link" className="text-white focus-visible:ring-white focus-visible:ring-offset-black">Talk to BetterCallz <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Button></div></div></section>
  </AppShell>;
}
