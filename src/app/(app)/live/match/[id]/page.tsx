import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TeamFavoriteButton } from "@/components/live/team-favorite-button";
import { MatchLineups } from "@/components/live/match-lineups";
import { getFixtureDetail, getMatchLineups } from "@/lib/data/live";
import { formatKickoff } from "@/lib/utils";
import type { TeamRef } from "@/types";

function TeamBlock({ team, score }: { team?: TeamRef; score: number | null }) {
  const teamId = team ? Number(team.id) : NaN;

  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      {team?.logo ? (
        <Image src={team.logo} alt="" width={48} height={48} className="size-12 object-contain" unoptimized />
      ) : (
        <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-sm font-bold text-foreground">
          {team?.name.slice(0, 2).toUpperCase() ?? "?"}
        </span>
      )}
      <span className="text-sm font-semibold text-foreground">{team?.name ?? "Équipe inconnue"}</span>
      <span className="text-2xl font-extrabold tabular-nums text-foreground">{score ?? "–"}</span>
      {team && Number.isFinite(teamId) && <TeamFavoriteButton teamId={teamId} teamName={team.name} />}
    </div>
  );
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixtureId = Number(id);
  if (!Number.isFinite(fixtureId)) notFound();

  const [match, lineups] = await Promise.all([getFixtureDetail(fixtureId), getMatchLineups(fixtureId)]);
  if (!match) notFound();

  return (
    <div>
      <Link
        href="/live"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        Retour
      </Link>

      <Card className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {match.competition} · {match.roundLabel}
          </span>
          {match.status === "live" && (
            <Badge tone="live">{match.liveLabel ?? `${match.minute}'`}</Badge>
          )}
          {match.status === "scheduled" && <Badge tone="neutral">{formatKickoff(match.kickoffAt)}</Badge>}
          {match.status === "finished" && <Badge tone="neutral">Terminé</Badge>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <TeamBlock team={match.homeTeam} score={match.homeScore} />
          <span className="px-1 text-lg font-bold text-muted">–</span>
          <TeamBlock team={match.awayTeam} score={match.awayScore} />
        </div>

        {match.halftimeScore && (match.halftimeScore.home !== null || match.halftimeScore.away !== null) && (
          <p className="text-center text-xs font-medium text-muted">
            Mi-temps : {match.halftimeScore.home ?? "–"} – {match.halftimeScore.away ?? "–"}
          </p>
        )}
      </Card>

      <div className="mt-4">
        <MatchLineups lineups={lineups} />
      </div>
    </div>
  );
}
