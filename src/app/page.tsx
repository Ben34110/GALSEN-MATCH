import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Full-bleed splash screen — lives outside the (app) route group, so it
// renders without the tab bar/top bar. The CTA always goes through
// /onboarding: first-time visitors complete the wizard, returning visitors
// (profile already in localStorage) are bounced straight to /actu by that
// page. Installed PWA users skip this screen entirely (manifest start_url).
export default function SplashPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))]">
      <div className="flex items-center gap-2">
        <span className="gradient-accent glow-accent grid size-9 place-items-center rounded-xl text-sm font-extrabold text-accent-ink">
          GM
        </span>
        <span className="font-serif text-lg font-bold tracking-tight text-foreground">Galsen Match</span>
      </div>

      <div className="relative mx-auto mt-10 w-full max-w-[17rem] flex-1 sm:mt-14 sm:max-w-xs">
        <div className="relative mx-auto aspect-square w-full max-w-xs">
          <div
            className="gradient-accent absolute inset-0 rounded-[42%_58%_63%_37%/45%_38%_62%_55%] shadow-lg"
            aria-hidden
          />
          <span className="absolute -right-1 top-8 size-9 rounded-full bg-accent-2 shadow-md sm:size-10" aria-hidden />
          <span className="absolute -left-2 bottom-12 size-6 rounded-full bg-accent-3 shadow-md sm:size-7" aria-hidden />

          <svg viewBox="0 0 200 200" className="absolute inset-0 size-full p-9" aria-hidden>
            <circle cx="100" cy="100" r="64" fill="#ffffff" opacity="0.14" />
            <circle cx="100" cy="100" r="64" fill="none" stroke="#ffffff" strokeWidth="6" />
            <path
              d="M100 58l22 16-8 26H86l-8-26zM100 58V34M136 74l28-6M100 116l-22 36M100 116l22 36M78 152l-18 24M122 152l18 24M78 74l-28-6"
              fill="none"
              stroke="#ffffff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="mt-10 text-center sm:mt-14">
        <h1 className="text-balance font-serif text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl">
          Suivez le football africain autrement
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-balance text-base leading-relaxed text-muted">
          Actu, scores en direct, ton Starting 6 et le chat de la communauté — tout Galsen Match dans ta poche.
        </p>
      </div>

      <Link
        href="/onboarding"
        className={[
          "group mt-10 flex min-h-14 items-center justify-center gap-2 rounded-full bg-foreground px-6",
          "text-base font-semibold text-background shadow-lg transition-transform",
          "duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-[0.98] sm:mt-14",
        ].join(" ")}
      >
        Explorer les matchs
        <ArrowRight
          size={18}
          className="transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] group-hover:translate-x-1"
          aria-hidden
        />
      </Link>
    </div>
  );
}
