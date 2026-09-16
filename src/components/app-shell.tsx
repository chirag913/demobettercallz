import Link from "next/link";
import { isRealMode } from "@/lib/sarvam";
import { cn } from "@/lib/utils";

function ModeIndicator() {
  const real = isRealMode();
  return (
    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide">
      <span className={cn("h-1.5 w-1.5 rounded-full", real ? "bg-emerald-600" : "bg-black/40")} />
      <span className="text-[var(--muted)]">{real ? "Real Mode" : "Demo Mode"}</span>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-[15px] font-semibold tracking-tight">
            bettercallz<span className="text-[var(--muted)]">.</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-[var(--muted)] md:flex">
            <Link href="/" className="hover:text-[var(--foreground)]">Overview</Link>
            <Link href="/projects" className="hover:text-[var(--foreground)]">Projects</Link>
            <Link href="/projects/godrej-arden" className="hover:text-[var(--foreground)]">Demo</Link>
          </nav>
          <ModeIndicator />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto max-w-6xl px-6 text-[13px] text-[var(--muted-2)]">
          BetterCallz AI — Phase 1 MVP. Demo dataset, not real project data.
        </div>
      </footer>
    </div>
  );
}
