import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatKickoff } from "@/lib/utils";
import { getTeamById } from "@/lib/mock/teams";
import type { Match, TeamRef } from "@/types";

function TeamRow({
  teamId,
  teamRef,
  score,
  emphasize,
}: {
  teamId: string;
  teamRef?: TeamRef;
  score: number | null;
  emphasize: boolean;
}) {
  // Real (API) matches carry name+logo directly on the fixture — no lookup
  // needed. Mock matches fall back to the static team list.
  const mockTeam = teamRef ? undefined : getTeamById(teamId);
  const name = teamRef?.name ?? mockTeam?.name ?? "Équipe inconnue";
  const logo = teamRef?.logo;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {logo ? (
          <Image
            src={logo}
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-full bg-surface-2 object-contain p-1"
            unoptimized
          />
        ) : (
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-bold text-foreground">
            {mockTeam?.logoInitials ?? "?"}
          </span>
        )}
        <span className={cn("text-sm", emphasize ? "font-bold text-foreground" : "font-medium text-muted")}>
          {name}
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

  const content = (
    <Card interactive={match.source === "api"} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {match.competition} · {match.roundLabel ?? `J${match.matchday}`}
        </span>
        {match.status === "live" && (
          <Badge tone="live" aria-label={`En direct, ${match.liveLabel ?? `${match.minute} minutes`}`}>
            {match.liveLabel ?? `${match.minute}'`}
          </Badge>
        )}
        {match.status === "scheduled" && <Badge tone="neutral">{formatKickoff(match.kickoffAt)}</Badge>}
        {match.status === "finished" && <Badge tone="neutral">Terminé</Badge>}
      </div>

      <div className="flex flex-col gap-2">
        <TeamRow
          teamId={match.homeTeamId}
          teamRef={match.homeTeam}
          score={match.homeScore}
          emphasize={match.status !== "scheduled" && homeWinning}
        />
        <TeamRow
          teamId={match.awayTeamId}
          teamRef={match.awayTeam}
          score={match.awayScore}
          emphasize={match.status !== "scheduled" && awayWinning}
        />
      </div>
    </Card>
  );

  // Only real fixtures have a detail page to link to (see /live/match/[id]).
  if (match.source === "api" && match.apiFixtureId) {
    return (
      <Link href={`/live/match/${match.apiFixtureId}`} className="block rounded-2xl focus-visible:outline-offset-4">
        {content}
      </Link>
    );
  }

  return content;
}
