import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { getProject, getKnowledgeByCategory, getInventory, findFact } from "@/lib/knowledge/service";

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-[var(--border)] py-14">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">{eyebrow}</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

export default async function ProjectPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const byCategory = getKnowledgeByCategory(id);
  const inventory = getInventory(id);
  const startingPrice = findFact(id, "startingPrice");
  const priceRange = findFact(id, "priceRange");
  const paymentPlan = findFact(id, "paymentPlan");
  const rera = findFact(id, "rera");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-[13px]">
          <Link href={`/projects/${id}`} className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--foreground)]">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
          </Link>
          <span className="text-[var(--muted-2)]">Public preview — generated from Project Intelligence</span>
        </div>
      </div>

      {/* HERO */}
      <section className="mx-auto max-w-5xl px-6 pb-14 pt-16">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">
              {project.developer}
            </div>
            <h1 className="mt-3 text-5xl font-semibold leading-[1.05] tracking-tight">{project.name}</h1>
            <p className="mt-4 text-lg text-[var(--muted)]">{project.tagline}</p>
            <div className="mt-6 flex items-center gap-1.5 text-[var(--muted)]">
              <MapPin className="h-4 w-4" strokeWidth={1.5} />
              {project.location}
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button href={`/projects/${id}/agent`} size="lg">
                Talk to an AI Property Expert
              </Button>
              <Button href={`/projects/${id}`} variant="secondary" size="lg">
                View Project Details
              </Button>
            </div>
          </div>
          <div className="aspect-[4/3] rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[repeating-linear-gradient(135deg,rgba(0,0,0,0.03)_0px,rgba(0,0,0,0.03)_1px,transparent_1px,transparent_14px)] p-6">
            <div className="flex h-full flex-col justify-end">
              <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Configurations</div>
              <div className="text-xl font-semibold">{project.configurations}</div>
              <div className="mt-3 text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Starting Price</div>
              <div className="text-xl font-semibold">{startingPrice?.value ?? "On request"}</div>
            </div>
          </div>
        </div>
      </section>

      <Section id="overview" eyebrow="Overview" title={project.tagline}>
        <p className="max-w-2xl text-[var(--muted)]">{project.heroDescription}</p>
      </Section>

      {inventory.length > 0 && (
        <Section id="residences" eyebrow="Residences" title="Configurations">
          <div className="grid gap-4 sm:grid-cols-3">
            {inventory.map((unit) => (
              <div key={unit.id} className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
                <div className="text-base font-semibold">{unit.configuration}</div>
                <div className="mt-1 text-sm text-[var(--muted)]">{unit.areaSqft}</div>
                <div className="mt-3 text-sm font-medium">
                  {unit.verificationStatus === "restricted" ? "Price on request" : unit.priceRange}
                </div>
                <div className="mt-1 text-[12px] uppercase tracking-wide text-[var(--muted-2)]">
                  {unit.status === "available" ? "Available" : unit.status === "limited" ? "Limited availability" : "Sold out"}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {byCategory.amenities.length > 0 && (
        <Section id="amenities" eyebrow="Amenities" title="Designed for everyday living">
          <div className="grid gap-4 sm:grid-cols-2">
            {byCategory.amenities.map((fact) => (
              <div key={fact.id} className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
                <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">{fact.label}</div>
                <div className="mt-1.5 text-[15px]">{fact.value}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section id="location" eyebrow="Location" title={project.location}>
        <p className="max-w-2xl text-[var(--muted)]">
          {byCategory.amenities.find((f) => f.field.startsWith("connectivity"))?.value ??
            "Connectivity details available on request."}
        </p>
      </Section>

      <Section id="pricing" eyebrow="Pricing" title="Investment">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
            <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Price Range</div>
            <div className="mt-1.5 text-[15px] font-medium">{priceRange?.value ?? "On request"}</div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
            <div className="text-[11px] uppercase tracking-wide text-[var(--muted-2)]">Starting Price</div>
            <div className="mt-1.5 text-[15px] font-medium">{startingPrice?.value ?? "On request"}</div>
          </div>
        </div>
      </Section>

      <Section id="payment-plan" eyebrow="Payment Plan" title="Flexible payment options">
        <p className="max-w-2xl text-[var(--muted)]">{paymentPlan?.value ?? "Details available on request."}</p>
      </Section>

      <Section id="developer" eyebrow="Developer" title={project.developer}>
        <p className="max-w-2xl text-[var(--muted)]">{project.projectType}</p>
      </Section>

      <Section id="rera" eyebrow="RERA" title={rera?.value ?? "On request"}>
        <p className="max-w-2xl text-[13px] text-[var(--muted-2)]">
          RERA details shown above are demo placeholder values for this MVP and do not correspond to a real
          registered project.
        </p>
      </Section>

      <div className="border-t border-[var(--border)] py-10 text-center">
        <Button href={`/projects/${id}/agent`} size="lg">
          Talk to an AI Property Expert
        </Button>
      </div>
    </div>
  );
}
