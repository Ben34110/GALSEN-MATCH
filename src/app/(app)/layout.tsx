import { FloatingNav } from "@/components/nav/floating-nav";
import { AppTopBar } from "@/components/nav/app-top-bar";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

// Chrome (top bar + nav) shared by every tab (/actu, /live, /fantasy, /chat,
// /profil). The splash screen at "/" sits outside this group so it renders
// full-bleed, without the tab bar, before the user has entered the app.
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

      <AppTopBar />

      <div className="mx-auto flex w-full max-w-6xl lg:gap-10 lg:px-8">
        <FloatingNav />
        <main
          id="contenu"
          className={[
            "w-full min-w-0 flex-1 px-4 pb-[calc(6rem+var(--safe-bottom))] pt-5",
            "sm:px-6 lg:max-w-3xl lg:px-0 lg:pb-16 lg:pt-10",
          ].join(" ")}
        >
          <OnboardingGate>{children}</OnboardingGate>
        </main>
      </div>
    </>
  );
}
