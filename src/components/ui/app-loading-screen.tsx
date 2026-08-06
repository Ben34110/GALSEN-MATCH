// Full-viewport overlay (fixed + high z-index, so it covers the tab bar too
// regardless of where it's mounted in the tree — see
// components/onboarding/onboarding-gate.tsx, which shows this while it's
// still figuring out whether a profile exists in localStorage).
//
// TODO: swap the "GM" badge below for the real logo once provided — single
// spot to change, everything else (sizing, glow, pulse) stays as-is.
export function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
      <span
        className="gradient-accent glow-accent grid size-16 animate-pulse place-items-center rounded-2xl text-xl font-extrabold text-accent-ink"
        aria-hidden
      >
        GM
      </span>
      <span className="font-serif text-base font-bold tracking-tight text-foreground">Galsen Match</span>
    </div>
  );
}
