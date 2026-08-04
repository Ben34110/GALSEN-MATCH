import { FloatingNav } from "@/components/nav/floating-nav";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

// Chrome (nav) shared by every tab (/actu, /live, /fantasy, /chat, /profil).
// No top bar — main handles its own safe-area-top clearance directly since
// there's no header to push content below the notch/status bar anymore.
// The splash screen at "/" sits outside this group so it renders full-bleed,
// without the tab bar, before the user has entered the app.
export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenu"
        className={[
          "fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-accent px-4 py-2",
          "text-sm font-semibold text-accent-ink transition-transform duration-[var(--duration-base)]",
          "focus-visible:translate-y-0",
        ].join(" ")}
      >
        Aller au contenu principal
      </a>

      <div className="mx-auto flex w-full max-w-6xl lg:gap-10 lg:px-8">
        <FloatingNav />
        <main
          id="contenu"
          className={[
            "w-full min-w-0 flex-1 px-4 pb-[calc(6rem+var(--safe-bottom))] pt-[calc(1.25rem+var(--safe-top))]",
            "sm:px-6 lg:max-w-3xl lg:px-0 lg:pb-16 lg:pt-10",
          ].join(" ")}
        >
          <OnboardingGate>{children}</OnboardingGate>
        </main>
      </div>
    </>
  );
}
