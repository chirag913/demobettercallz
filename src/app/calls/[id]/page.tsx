import { AppShell } from "@/components/app-shell";
import { CallResult } from "@/components/calls/call-result";

export default async function CallResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-6 py-14">
        <CallResult callId={id} />
      </section>
    </AppShell>
  );
}
