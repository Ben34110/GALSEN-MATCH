import Image from "next/image";

// Full-viewport overlay (fixed + high z-index, so it covers the tab bar too
// regardless of where it's mounted in the tree — see
// components/onboarding/onboarding-gate.tsx, which shows this while it's
// still figuring out whether a profile exists in localStorage). On the web/
// PWA this is usually gone within a frame or two — no artificial delay is
// added there, keeping the app's "no forced startup wait" stance. Inside
// the native app, OnboardingGate holds it visible for a minimum duration so
// the branded moment is actually seen instead of flickering past.
export function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
      <Image src="/logo-mark.png" alt="" width={64} height={64} className="size-16 animate-pulse object-contain" />
      <span className="font-serif text-base font-bold tracking-tight text-foreground">AfroLive</span>
      <div className="mt-1 h-1 w-36 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label="Chargement">
        <div className="h-full rounded-full bg-accent animate-loading-sweep" />
      </div>
    </div>
  );
}
