import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ContactForm } from "@/components/contact/contact-form";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — BetterCallz",
  description: "Tell us how you’re generating leads today. Let’s explore where BetterCallz fits.",
};

export default function ContactPage() {
  return (
    <AppShell>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-14 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:py-24">
        <div>
          <h1 className="max-w-md text-5xl font-semibold leading-[1.08] tracking-[-0.035em] md:text-6xl">Let’s talk about your leads.</h1>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-[var(--muted)]">Tell us how you&apos;re generating leads today. We’ll show you where BetterCallz can fit into the process.</p>
          <div className="mt-10 max-w-sm border-t border-[var(--border-strong)] pt-7 md:mt-16">
            <h2 className="text-base font-medium">Hear it for yourself first.</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Try a conversation with the AI, then let’s talk about what it could do for your business.</p>
            <Button href="/#demo" className="mt-5">Try the AI demo <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Button>
          </div>
        </div>
        <ContactForm />
      </section>
    </AppShell>
  );
}
