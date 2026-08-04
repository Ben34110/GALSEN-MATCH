import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatKickoff } from "@/lib/utils";
import { getTeamById } from "@/lib/mock/teams";
import type { Match } from "@/types";

function TeamRow({ teamId, score, emphasize }: { teamId: string; score: number | null; emphasize: boolean }) {
  const team = getTeamById(teamId);
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-[11px] font-bold text-foreground">
          {team?.logoInitials ?? "?"}
        </span>
        <span className={cn("text-sm", emphasize ? "font-bold text-foreground" : "font-medium text-muted")}>
          {team?.name ?? "Équipe inconnue"}
        </span>
      </div>
      <span className={cn("tabular-nums text-base font-extrabold", emphasize ? "text-foreground" : "text-muted")}>
        {score ?? "–"}
      </span>
    </div>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const homeWinning = (match.homeScore ?? 0) >= (match.awayScore ?? 0);
  const awayWinning = (match.awayScore ?? 0) >= (match.homeScore ?? 0);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {match.competition} · J{match.matchday}
        </span>
        {match.status === "live" && <Badge tone="live">● {match.minute}&apos;</Badge>}
        {match.status === "scheduled" && <Badge tone="neutral">{formatKickoff(match.kickoffAt)}</Badge>}
        {match.status === "finished" && <Badge tone="neutral">Terminé</Badge>}
      </div>

      <div className="flex flex-col gap-2">
        <TeamRow teamId={match.homeTeamId} score={match.homeScore} emphasize={match.status !== "scheduled" && homeWinning} />
        <TeamRow teamId={match.awayTeamId} score={match.awayScore} emphasize={match.status !== "scheduled" && awayWinning} />
      </div>
    </Card>
  );
}
