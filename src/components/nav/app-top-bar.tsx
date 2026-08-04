import Link from "next/link";

// Slim brand bar shown on mobile/tablet only — gives the standalone PWA a
// persistent identity above the safe-area/status bar. Desktop uses the
// sidebar wordmark in FloatingNav instead (see nav/floating-nav.tsx).
export function AppTopBar() {
  return (
    <header className="glass-panel sticky top-0 z-40 rounded-none border-x-0 border-t-0 pt-[calc(0.75rem+var(--safe-top))] lg:hidden">
      <div className="flex items-center gap-2 px-4 pb-3">
        <Link href="/actu" className="flex items-center gap-2 rounded-lg focus-visible:outline-offset-4">
          <span className="gradient-accent glow-accent grid size-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold text-accent-ink">
            GM
          </span>
          <span className="text-sm font-extrabold tracking-tight text-foreground">Galsen Match</span>
        </Link>
      </div>
    </header>
  );
}
