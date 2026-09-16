import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, Database, Bot, PhoneCall } from "lucide-react";
import { DEMO_PROJECT_ID, demoProject } from "@/data/demoProject";
import { getKnowledgeStatusCounts } from "@/lib/knowledge/service";

const flowSteps = [
  { icon: Building2, label: "Project" },
  { icon: Database, label: "Intelligence" },
  { icon: Bot, label: "AI Sales Agent" },
  { icon: PhoneCall, label: "Real Conversation" },
];

export default function Home() {
  const counts = getKnowledgeStatusCounts(DEMO_PROJECT_ID);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <Badge variant="outline">AI Sales Intelligence</Badge>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
          AI Sales Intelligence for Real Estate
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--muted)]">
          Turn every real-estate project into an AI property expert.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button href={`/projects/${DEMO_PROJECT_ID}`} size="lg">
            Open Demo <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/projects" variant="secondary" size="lg">
            View Project
          </Button>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
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

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">One verified knowledge layer. Every channel.</h2>
            <p className="mt-4 max-w-md text-[var(--muted)]">
              Project facts are captured once, verified, and reused everywhere — the dashboard, the public
              landing page, and the AI sales agent all read from the same source, so the agent can never
              say something the project doesn&apos;t actually stand behind.
            </p>
          </div>
          <Card className="p-1">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Demo Project</div>
                <div className="text-base font-semibold">{demoProject.name}</div>
              </div>
              <Badge variant="live">Active</Badge>
            </div>
            <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
              <div className="px-5 py-4">
                <div className="text-2xl font-semibold font-tabular text-[var(--verified)]">{counts.verified}</div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Verified</div>
              </div>
              <div className="px-5 py-4">
                <div className="text-2xl font-semibold font-tabular text-[var(--unverified)]">{counts.unverified}</div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Unverified</div>
              </div>
              <div className="px-5 py-4">
                <div className="text-2xl font-semibold font-tabular text-[var(--restricted)]">{counts.restricted}</div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Restricted</div>
              </div>
            </div>
            <div className="border-t border-[var(--border)] p-5">
              <Button href={`/projects/${DEMO_PROJECT_ID}/intelligence`} variant="link">
                View Project Intelligence <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
