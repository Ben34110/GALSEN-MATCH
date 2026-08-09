import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { LeaderboardView } from "@/components/fantasy/leaderboard-view";
import { getLeaderboard } from "@/lib/data/fantasy-leaderboard";
import { getGameweekInfo } from "@/lib/fantasy-gameweek";

export default async function FantasyLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ journee?: string }>;
}) {
  const { journee: journeeParam } = await searchParams;
  const { activeJournee } = getGameweekInfo();
  const journee = journeeParam ? Number(journeeParam) : activeJournee;
  const entries = await getLeaderboard(journee);

  return (
    <div>
      <Link
        href="/fantasy/xi"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        Retour
      </Link>

      <SectionHeader
        eyebrow="Fantasy"
        title={`Classement — Journée ${journee}`}
        subtitle="Tous les joueurs AfroLive, classés sur leur Starting XI. Points à 0 en attendant les vraies notes de la journée."
      />

      {entries === null ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          Classement indisponible pour l&apos;instant.
        </p>
      ) : (
        <LeaderboardView entries={entries} />
      )}
    </div>
  );
}
