"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactSchema, interests, leadVolumes, type ContactInput } from "@/lib/contact/schema";

type Errors = Partial<Record<keyof ContactInput, string[]>>;
const controlClass = "min-h-12 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-base outline-none focus:border-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2";

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notificationIssue, setNotificationIssue] = useState(false);
  const lock = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (submitted) successRef.current?.focus(); }, [submitted]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const parsed = contactSchema.safeParse(Object.fromEntries(new FormData(form)));
    setError("");
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      const first = parsed.error.issues[0]?.path[0];
      if (first) (form.elements.namedItem(String(first)) as HTMLElement | null)?.focus();
      return;
    }
    setErrors({});
    lock.current = true;
    setPending(true);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const result = await response.json();
      if (!response.ok || result.submitted !== true) {
        setErrors(result.fields ?? {});
        setError(result.error ?? "We couldn’t confirm your inquiry. Please try again.");
        return;
      }
      setNotificationIssue(result.emailAccepted === false);
      setSubmitted(true);
    } catch {
      setError("We couldn’t confirm your inquiry. Check your connection and try again.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  if (submitted) return (
    <div ref={successRef} tabIndex={-1} role="status" className="flex min-h-96 flex-col justify-center border-y border-[var(--border-strong)] py-12 outline-none">
      <Check aria-hidden="true" className="mb-6 h-9 w-9 text-[var(--verified)]" strokeWidth={1.5} />
      <h2 className="text-4xl font-semibold tracking-tight">Got it. We’ll be in touch.</h2>
      <p className="mt-4 max-w-sm leading-relaxed text-[var(--muted)]">Your inquiry is with BetterCallz. We’ll follow up using the details you shared.</p>
      {notificationIssue && <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted)]">Your inquiry was saved, but we couldn’t confirm the team’s email notification. You don’t need to submit it again.</p>}
      <Button href="/" variant="link" className="mt-8 self-start">Back to BetterCallz <ArrowRight aria-hidden="true" className="h-4 w-4" /></Button>
    </div>
  );

  function field(name: keyof ContactInput, label: string, options: { type?: string; autoComplete?: string; maxLength?: number; optional?: boolean } = {}) {
    return <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium">{label}{options.optional && <span className="font-normal text-[var(--muted)]"> (optional)</span>}</label>
      <Input id={name} name={name} type={options.type ?? "text"} autoComplete={options.autoComplete} maxLength={options.maxLength ?? 160} required={!options.optional} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} className="text-base focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2" />
      {errors[name] && <p id={`${name}-error`} className="mt-2 text-sm text-[var(--restricted)]">{errors[name]?.[0]}</p>}
    </div>;
  }

  return (
    <form onSubmit={submit} noValidate aria-busy={pending}>
      <fieldset disabled={pending} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <legend className="sr-only">Tell BetterCallz about your leads</legend>
        {field("name", "Name", { autoComplete: "name", maxLength: 120 })}
        {field("email", "Work email", { type: "email", autoComplete: "email", maxLength: 254 })}
        {field("phone", "Phone", { type: "tel", autoComplete: "tel", maxLength: 30 })}
        {field("company", "Company", { autoComplete: "organization" })}
        <div className="sm:col-span-2">{field("website", "Website", { autoComplete: "url", optional: true, maxLength: 300 })}</div>
        {([ ["leadVolume", "Approximate monthly lead volume", leadVolumes], ["interest", "Interest", interests] ] as const).map(([name, label, choices]) => (
          <div key={name} className="sm:col-span-2">
            <label htmlFor={name} className="mb-2 block text-sm font-medium">{label}</label>
            <select id={name} name={name} defaultValue="" required aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} className={controlClass}>
              <option value="" disabled>Select an option</option>
              {choices.map((choice) => <option key={choice}>{choice}</option>)}
            </select>
            {errors[name] && <p id={`${name}-error`} className="mt-2 text-sm text-[var(--restricted)]">{errors[name]?.[0]}</p>}
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-2 block text-sm font-medium">Message</label>
          <textarea id="message" name="message" rows={3} required maxLength={3000} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : "message-hint"} className={`${controlClass} resize-y py-3`} />
          <p id="message-hint" className="mt-2 text-sm text-[var(--muted)]">Where do your leads come from, and what happens next?</p>
          {errors.message && <p id="message-error" className="mt-2 text-sm text-[var(--restricted)]">{errors.message[0]}</p>}
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending} size="lg" className="w-full">{pending ? <>Sending your inquiry <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /></> : <>Talk to BetterCallz <ArrowRight aria-hidden="true" className="h-4 w-4" /></>}</Button>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">We’ll use these details to respond to your inquiry.</p>
        </div>
      </fieldset>
      {error && <p role="alert" className="mt-4 text-sm leading-relaxed text-[var(--restricted)]">{error}</p>}
    </form>
  );
}
