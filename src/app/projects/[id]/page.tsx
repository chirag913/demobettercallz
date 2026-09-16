import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Layers, Bot } from "lucide-react";
import { getProject, getKnowledgeStatusCounts } from "@/lib/knowledge/service";
import { isRealMode } from "@/lib/sarvam";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const counts = getKnowledgeStatusCounts(id);
  const real = isRealMode();

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
              {project.developer}
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{project.name}</h1>
            <div className="mt-3 flex items-center gap-1.5 text-[var(--muted)]">
              <MapPin className="h-4 w-4" strokeWidth={1.5} />
              {project.location}
            </div>
          </div>
          <Badge variant="live">{project.status === "active" ? "Active" : "Draft"}</Badge>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Developer</div>
            <div className="mt-1.5 text-[15px] font-medium">{project.developer}</div>
          </Card>
          <Card className="p-5">
            <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Configurations</div>
            <div className="mt-1.5 text-[15px] font-medium">{project.configurations}</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--muted-2)]">
              <Layers className="h-3.5 w-3.5" /> Knowledge Status
            </div>
            <div className="mt-1.5 flex items-baseline gap-2 text-[15px] font-medium">
              <span className="text-[var(--verified)]">{counts.verified} verified</span>
              <span className="text-[var(--muted-2)]">/ {counts.total}</span>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--muted-2)]">
              <Bot className="h-3.5 w-3.5" /> Agent Status
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[15px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Ready to Call
              <span className="ml-1 text-[12px] font-normal text-[var(--muted-2)]">
                ({real ? "Real Mode" : "Demo Mode"})
              </span>
            </div>
          </Card>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Button href={`/projects/${id}/intelligence`} variant="secondary" size="lg" className="justify-between">
            View Project Intelligence <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href={`/projects/${id}/preview`} variant="secondary" size="lg" className="justify-between">
            Preview Landing Page <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href={`/projects/${id}/agent`} size="lg" className="justify-between">
            Talk to AI Agent <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
