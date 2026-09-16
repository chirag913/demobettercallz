import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { CallPanel } from "@/components/agent/call-panel";
import { getProject } from "@/lib/knowledge/service";
import { isRealMode } from "@/lib/sarvam";
import { Languages, BrainCircuit, MessagesSquare, ListChecks } from "lucide-react";

const capabilities = [
  { icon: BrainCircuit, label: "Project knowledge" },
  { icon: MessagesSquare, label: "Property questions" },
  { icon: ListChecks, label: "Requirement discovery" },
];

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const real = isRealMode();

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
          AI Sales Agent
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{project.name}</h1>
        <p className="mt-3 text-[var(--muted)]">Your project&apos;s AI property expert.</p>

        <div className="mt-6 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          <span className="text-[13px] font-medium uppercase tracking-wide">Ready to Call</span>
          <Badge variant={real ? "live" : "outline"} className="ml-2">
            {real ? "Real Mode" : "Demo Mode"}
          </Badge>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--muted-2)]">
              <Languages className="h-3.5 w-3.5" /> Languages
            </div>
            <div className="mt-2 flex gap-2 text-sm">
              <Badge variant="neutral">Hindi</Badge>
              <Badge variant="neutral">Hinglish</Badge>
              <Badge variant="neutral">English</Badge>
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
            <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Capabilities</div>
            <div className="mt-2 space-y-1.5">
              {capabilities.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-sm">
                  <c.icon className="h-3.5 w-3.5 text-[var(--muted)]" strokeWidth={1.5} />
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <CallPanel projectId={id} projectName={project.name} />
        </div>
      </section>
    </AppShell>
  );
}
