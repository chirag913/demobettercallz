import Link from "next/link";
import { DEMO_PROJECT_ID } from "@/data/demoProject";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-[15px] font-semibold tracking-tight">
            bettercallz<span className="text-[var(--muted)]">.</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-[var(--muted)] md:flex">
            <Link href="/#demo" className="hover:text-[var(--foreground)]">Live demo</Link>
            <Link href="/projects" className="hover:text-[var(--foreground)]">Projects</Link>
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link href="/contact" className="py-3 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">Contact</Link>
            <Button href="/#demo" size="sm">Try the live call</Button>
          </div>
        </div>
        <nav aria-label="Mobile navigation" className="flex items-center justify-center gap-8 border-t border-[var(--border)] px-6 text-sm text-[var(--muted)] md:hidden">
          <Link href="/#demo" className="py-3 hover:text-[var(--foreground)]">Live demo</Link>
          <Link href="/projects" className="py-3 hover:text-[var(--foreground)]">Projects</Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 text-[13px] text-[var(--muted)]">
          <div>
            <p>BetterCallz. Better conversations. Clearer next steps.</p>
            <Link href={`/projects/${DEMO_PROJECT_ID}/agent`} className="mt-3 inline-block underline underline-offset-4">Explore the property demo</Link>
          </div>
          <Link href="/contact" className="py-3 underline underline-offset-4 hover:text-[var(--foreground)]">Contact BetterCallz</Link>
        </div>
      </footer>
    </div>
  );
}
