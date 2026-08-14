import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Shared chrome for /privacy and /terms — both live outside the (app) route
// group (no tab bar, no OnboardingGate) since they need to be reachable and
// fully readable without an onboarded profile or even JS: App Store
// Connect's review and a first-time visitor both need to open this URL cold.
// Plain prose styled by hand (no @tailwindcss/typography in this project)
// using the same tokens as the rest of the app (bg-background, text-muted,
// border-border, font-serif headings) so it doesn't look like a foreign page
// bolted onto the app.
export function LegalPageShell({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-[calc(1.5rem+var(--safe-top))] sm:px-6">
        <Link
          href="/profil"
          className="mb-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft size={18} aria-hidden />
          Retour
        </Link>

        <h1 className="mb-1 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mb-8 text-xs text-muted">Dernière mise à jour : {updatedAt}</p>

        <div className="flex flex-col gap-6 text-sm leading-relaxed text-foreground [&_h2]:mt-4 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_li]:text-muted [&_p]:text-muted [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
