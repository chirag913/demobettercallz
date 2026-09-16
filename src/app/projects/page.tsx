import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { listProjects } from "@/lib/knowledge/service";

export default function ProjectsPage() {
  const projects = listProjects();

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">Projects</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Every project, one AI sales agent.</h1>
        <p className="mt-3 max-w-xl text-[var(--muted)]">
          Phase 1 ships with a single seeded demo project. Adding more projects follows the same
          Project → Intelligence → Agent pipeline.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">{project.name}</h2>
                  <Badge variant={project.status === "active" ? "live" : "outline"}>{project.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{project.developer}</p>
                <div className="mt-4 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {project.location}
                </div>
              </div>
              <div className="mt-6">
                <Button href={`/projects/${project.id}`} variant="secondary" className="w-full">
                  Open Project <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
