import Image from "next/image";

// Full-viewport overlay (fixed + high z-index, so it covers the tab bar too
// regardless of where it's mounted in the tree — see
// components/onboarding/onboarding-gate.tsx, which shows this while it's
// still figuring out whether a profile exists in localStorage).
export function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
      <Image src="/icon-512.png" alt="" width={64} height={64} className="size-16 animate-pulse object-contain" unoptimized />
      <span className="font-serif text-base font-bold tracking-tight text-foreground">AfroLive</span>
    </div>
  );
}
