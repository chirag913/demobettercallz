import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PublicDemo } from "@/components/public-demo";
import { getSarvamConfig } from "@/lib/sarvam/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function Home() {
  const available = !!getSarvamConfig(true) && isSupabaseConfigured();
  return <AppShell>
    <section id="demo" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="mb-10 text-center">
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.04] tracking-[-0.035em] sm:text-7xl md:text-8xl">Can you tell<br />if it’s AI?</h1>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[var(--muted)]">BetterCallz calls your phone and has a real sales conversation with you.</p>
      </div>
      <PublicDemo available={available} />
      <div className="mt-7 text-center"><Button href="#how-it-works" variant="link">See how it works <ArrowRight aria-hidden="true" className="h-4 w-4" /></Button></div>
    </section>
    <section className="border-y border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:gap-20 md:py-24">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">You already paid<br />for the lead.<br /><span className="text-[var(--muted)]">Make sure someone calls it.</span></h2>
        <div className="self-end"><p className="max-w-md text-lg leading-relaxed text-[var(--muted)]">The form fills. The ad works. The interest is there. What happens next is the conversation that matters.</p><p className="mt-6 max-w-md leading-relaxed">BetterCallz turns that first conversation into context your sales team can use: what the person needs, what matters to them, and what to do next.</p></div>
      </div>
    </section>
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
      <h2 className="max-w-2xl text-4xl font-semibold tracking-tight">One conversation.<br />A clearer next step.</h2>
      <ol className="mt-12 grid gap-6 sm:grid-cols-5">
        {[["Lead", "A person shows interest."], ["Call", "BetterCallz starts a conversation."], ["Conversation", "The AI listens and adapts."], ["Qualification", "Their needs become clearer."], ["Sales opportunity", "Your team gets useful context."]].map(([title, copy]) => <li key={title} className="border-t border-[var(--border-strong)] pt-5"><h3 className="font-semibold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{copy}</p></li>)}
      </ol>
    </section>
    <section className="border-y border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2 className="text-4xl font-semibold tracking-tight">New interest. Unfinished conversations.</h2>
        <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-20">
          <div><h3 className="text-2xl font-semibold tracking-tight">Instant Lead Calling</h3><p className="mt-4 max-w-md leading-relaxed text-[var(--muted)]">Start the conversation while the interest is fresh. Understand what a new lead needs before your salesperson follows up.</p><Button href="/contact" variant="link" className="mt-6">Talk about your new leads <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Button></div>
          <div><h3 className="text-2xl font-semibold tracking-tight">Lead Recovery</h3><p className="mt-4 max-w-md leading-relaxed text-[var(--muted)]">Give old leads a new conversation. Find out what changed, whether the need is still there, and which conversations deserve another look.</p><Button href="/contact" variant="link" className="mt-6">Talk about your existing leads <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Button></div>
        </div>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
      <h2 className="text-5xl font-semibold leading-tight tracking-tight md:text-6xl">Go on.<br />Try to break it.</h2>
      <div><p className="max-w-md text-lg leading-relaxed text-[var(--muted)]">Interrupt. Switch to Hindi. Change the subject. Ask if it’s really AI. A natural conversation should have room for all of that.</p><p className="mt-4 text-sm text-[var(--muted)]">It will tell you the truth: it’s an AI sales agent.</p><Button href="#demo" size="lg" className="mt-7">Let it call me <ArrowRight aria-hidden="true" className="h-4 w-4" /></Button></div>
    </section>
    <section className="bg-[var(--foreground)] text-[var(--surface)]"><div className="mx-auto max-w-6xl px-6 py-16 md:py-24"><h2 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">Put BetterCallz<br />on your leads.</h2><p className="mt-6 max-w-md text-lg leading-relaxed text-white/70">Start with the conversation. Then let’s explore where it fits in your business.</p><div className="mt-8 flex flex-wrap gap-4"><Button href="#demo" className="bg-white text-black hover:bg-white/90" size="lg">Try the live AI demo</Button><Button href="/contact" variant="link" className="text-white">Talk to BetterCallz <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Button></div></div></section>
    <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:py-20"><div><h2 className="text-2xl font-semibold tracking-tight">Built around the conversation.</h2><p className="mt-4 text-sm text-[var(--muted)]">Chirag Sharma · Founder, BetterCallz</p></div><div><p className="max-w-md leading-relaxed text-[var(--muted)]">The idea behind BetterCallz is simple: a lead deserves a useful conversation, and a salesperson deserves the context to continue it.</p><Button href="/contact" variant="link" className="mt-6">Contact the BetterCallz team <ArrowRight aria-hidden="true" className="h-4 w-4" /></Button></div></section>
  </AppShell>;
}
