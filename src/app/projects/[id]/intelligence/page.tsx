import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FactRow } from "@/components/knowledge/fact-row";
import { AntiHallucinationDemo } from "@/components/knowledge/anti-hallucination-demo";
import {
  getProject,
  getKnowledgeByCategory,
  getKnowledgeFacts,
  getKnowledgeStatusCounts,
} from "@/lib/knowledge/service";

const categoryMeta = {
  project: { title: "Project" },
  pricing: { title: "Pricing" },
  amenities: { title: "Amenities" },
  inventory: { title: "Inventory" },
} as const;

export default async function IntelligencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const counts = getKnowledgeStatusCounts(id);
  const byCategory = getKnowledgeByCategory(id);
  const allFacts = getKnowledgeFacts(id);

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
          Project Intelligence
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{project.name}</h1>
        <p className="mt-3 max-w-xl text-[var(--muted)]">
          The verified knowledge layer behind the AI sales agent.
        </p>

        <div className="mt-8 grid grid-cols-3 divide-x divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="px-6 py-5">
            <div className="flex items-center gap-2">
              <Badge variant="verified">Verified</Badge>
            </div>
            <div className="mt-3 text-3xl font-semibold font-tabular">{counts.verified}</div>
            <div className="text-[12px] text-[var(--muted-2)]">facts</div>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center gap-2">
              <Badge variant="unverified">Unverified</Badge>
            </div>
            <div className="mt-3 text-3xl font-semibold font-tabular">{counts.unverified}</div>
            <div className="text-[12px] text-[var(--muted-2)]">facts</div>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center gap-2">
              <Badge variant="restricted">Restricted</Badge>
            </div>
            <div className="mt-3 text-3xl font-semibold font-tabular">{counts.restricted}</div>
            <div className="text-[12px] text-[var(--muted-2)]">facts</div>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          {(Object.keys(categoryMeta) as (keyof typeof categoryMeta)[]).map((category) => {
            const facts = byCategory[category];
            if (facts.length === 0) return null;
            return (
              <Card key={category} className="overflow-hidden py-0">
                <CardHeader className="border-b border-[var(--border)] bg-black/[0.015] py-4">
                  <CardTitle className="text-[13px] uppercase tracking-wide text-[var(--muted)]">
                    {categoryMeta[category].title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {facts.map((fact) => (
                    <FactRow key={fact.id} fact={fact} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10">
          <AntiHallucinationDemo facts={allFacts} />
        </div>
      </section>
    </AppShell>
  );
}
