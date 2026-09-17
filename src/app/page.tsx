import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Building2,
  Database,
  MessageCircle,
  Brain,
  Target,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { DEMO_PROJECT_ID, demoProject } from "@/data/demoProject";
import { getKnowledgeStatusCounts } from "@/lib/knowledge/service";

const flowSteps = [
  { icon: Building2, label: "Project" },
  { icon: Database, label: "Knowledge" },
  { icon: MessageCircle, label: "Conversation" },
  { icon: Brain, label: "Understanding" },
  { icon: Target, label: "Action" },
];

const intelligenceChecks = [
  "Project identified",
  "Location verified",
  "Configuration information available",
  "RERA information available",
];

const intelligenceWarnings = [
  { label: "Current pricing", detail: "Starts from ₹1.6 Cr — exact pricing to verify with sales" },
  { label: "Current inventory", detail: "Not verified" },
];

const agentExample = [
  {
    speaker: "agent",
    text: "Namaste, main Investors Clinic se bol rahi hoon. Kya aap abhi koi property dekh rahe hain?",
  },
  { speaker: "prospect", text: "Greater Noida mein 3 BHK dekh raha hoon." },
  { speaker: "agent", text: "Bilkul. Aap investment ke liye dekh rahe hain ya self-use ke liye?" },
];

export default function Home() {
  const counts = getKnowledgeStatusCounts(DEMO_PROJECT_ID);

  return (
    <AppShell>
      {/* 1. HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline">AI Sales Intelligence for Investors Clinic</Badge>
          <span className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Powered by BetterCallz</span>
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
          Turn every lead conversation into sales intelligence.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--muted)]">
          An AI sales layer that understands your projects, speaks naturally with prospects, qualifies
          conversations and gives your sales team the intelligence to act.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button href={`/projects/${DEMO_PROJECT_ID}/agent`} size="lg" className="text-[13px] uppercase tracking-wide">
            Experience the AI <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            href={`/projects/${DEMO_PROJECT_ID}`}
            variant="secondary"
            size="lg"
            className="text-[13px] uppercase tracking-wide"
          >
            View Project
          </Button>
        </div>
      </section>

      {/* 2. NOT JUST AI CALLING */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">How it works</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Not Just AI Calling</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
            {flowSteps.map((step, idx) => (
              <div key={step.label} className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)]">
                  <step.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
                    Step {idx + 1}
                  </div>
                  <div className="text-sm font-medium">{step.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. F PREMIERE SHOWCASE */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">Demo Project</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{demoProject.name}</h2>
            <p className="mt-2 text-[var(--muted)]">{demoProject.tagline}</p>
            <div className="mt-4 flex items-center gap-1.5 text-sm text-[var(--muted)]">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} /> {demoProject.location}
            </div>
            <p className="mt-6 max-w-md text-[var(--muted)]">
              Every fact the AI sales agent relies on for {demoProject.name} is captured once, verified,
              and reused everywhere — the dashboard, the public landing page, and the agent itself all read
              from the same source, so it can never say something the project doesn&apos;t actually stand
              behind.
            </p>
          </div>
          <Card className="p-1">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Configurations</div>
                <div className="text-base font-semibold">{demoProject.configurations}</div>
              </div>
              <Badge variant="verified">Starting from ₹1.6 Cr</Badge>
            </div>
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">RERA</div>
              <div className="mt-1 text-[13px] font-medium">{demoProject.rera}</div>
            </div>
            <div className="p-5">
              <Button href={`/projects/${DEMO_PROJECT_ID}`} variant="link">
                View Project <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. PROJECT INTELLIGENCE EXAMPLE */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
                Project Intelligence
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Every project fact, verified once.</h2>
              <p className="mt-4 max-w-md text-[var(--muted)]">
                Before the AI ever picks up the phone, the project is turned into a verified knowledge
                layer — so what the agent says on a call is grounded in what&apos;s actually confirmed, not
                guessed.
              </p>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-2xl font-semibold font-tabular text-[var(--verified)]">{counts.verified}</span>
                <span className="text-[13px] text-[var(--muted-2)]">verified facts / {counts.total}</span>
              </div>
            </div>
            <Card className="p-6">
              <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Project Intelligence</div>
              <div className="mt-1 text-lg font-semibold">{demoProject.name}</div>
              <div className="mt-5 space-y-2.5">
                {intelligenceChecks.map((label) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--verified)]" strokeWidth={1.5} />
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-5">
                {intelligenceWarnings.map((w) => (
                  <div key={w.label} className="flex items-start gap-2.5 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--unverified)]" strokeWidth={1.5} />
                    <div>
                      <div className="font-medium">{w.label}</div>
                      <div className="text-[var(--muted)]">{w.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. AI SALES AGENT EXAMPLE */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
              AI Sales Agent
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Speaks the way your prospects speak.</h2>
            <p className="mt-4 max-w-md text-[var(--muted)]">
              Hindi, Hinglish, or English — the agent follows the prospect&apos;s lead naturally, asking the
              same qualifying questions a good sales executive would.
            </p>
            <div className="mt-6">
              <Button href={`/projects/${DEMO_PROJECT_ID}/agent`} variant="secondary">
                Talk to the AI Agent <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Card className="p-6">
            <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">
              Example conversation — not a real call
            </div>
            <div className="mt-4 space-y-4">
              {agentExample.map((turn, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-16 shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
                    {turn.speaker === "agent" ? "AI" : "Prospect"}
                  </div>
                  <div className="text-[15px]">{turn.text}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* 6. KNOWLEDGE GUARD */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <Card className="p-6 md:order-2">
              <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">
                Example conversation — not a real call
              </div>
              <div className="mt-4 space-y-4">
                <div className="flex gap-4">
                  <div className="w-16 shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
                    Prospect
                  </div>
                  <div className="text-[15px]">&ldquo;Abhi kaunsa flat available hai aur discount kitna hai?&rdquo;</div>
                </div>
                <div className="flex gap-4">
                  <div className="w-16 shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
                    AI
                  </div>
                  <div className="text-[15px]">
                    &ldquo;Mere paas current inventory aur discount ki verified information abhi available
                    nahi hai, isliye main aapko galat information nahi dena chahti.&rdquo;
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2 border-t border-[var(--border)] pt-5 text-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--verified)]" strokeWidth={1.5} /> No
                  unsupported claim
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--verified)]" strokeWidth={1.5} /> Project
                  knowledge respected
                </div>
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--unverified)]" strokeWidth={1.5} /> Sales
                  verification required
                </div>
              </div>
            </Card>
            <div className="md:order-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
                  Knowledge Guard
                </div>
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">The AI knows what it knows.</h2>
              <p className="mt-4 max-w-md text-[var(--muted)]">
                When a prospect asks something the verified knowledge layer doesn&apos;t cover, the agent
                says so — instead of guessing at a discount, an available unit, or a possession date it
                can&apos;t confirm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">See it on a real call.</h2>
        <p className="mt-3 text-[var(--muted)]">{demoProject.name} is live and ready — enter a number and press call.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button href={`/projects/${DEMO_PROJECT_ID}/agent`} size="lg" className="text-[13px] uppercase tracking-wide">
            Experience the AI <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            href={`/projects/${DEMO_PROJECT_ID}`}
            variant="secondary"
            size="lg"
            className="text-[13px] uppercase tracking-wide"
          >
            View Project
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
