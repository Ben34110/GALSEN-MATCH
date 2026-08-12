import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatKickoff } from "@/lib/utils";
import type { Match } from "@/types";

// Shared by the player and team profile pages (last/next 3 matches) — a
// simpler, un-highlighted cousin of upcoming/can-qualifiers-fixtures-list.tsx
// (no "is this the viewer's own nation" styling needed here). No "use
// client": nothing here is interactive beyond a plain Link, so it can be
// rendered from either a server or client parent.
export function MatchCompactList({
  matches,
  backHref,
  emptyLabel,
}: {
  matches: Match[];
  backHref: string;
  emptyLabel: string;
}) {
  if (matches.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">{emptyLabel}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {matches.map((match) => {
        const played = match.status === "finished" || match.status === "live";
        const href = match.apiFixtureId ? `/live/match/${match.apiFixtureId}?from=${encodeURIComponent(backHref)}` : null;

        const content = (
          <div className="flex flex-1 items-center gap-2">
            <div className="flex flex-1 items-center justify-end gap-2 text-right">
              <span className="truncate text-sm font-semibold text-foreground">{match.homeTeam?.name}</span>
              {match.homeTeam?.logo && (
                <Image
                  src={match.homeTeam.logo}
                  alt=""
                  width={22}
                  height={22}
                  className="size-[22px] shrink-0 object-contain"
                  unoptimized
                />
              )}
            </div>
            <span className="shrink-0 text-center text-[11px] font-semibold text-muted">
              {played ? (
                <span className="text-sm font-bold text-foreground">
                  {match.homeScore}-{match.awayScore}
                </span>
              ) : (
                formatKickoff(match.kickoffAt)
              )}
            </span>
            <div className="flex flex-1 items-center gap-2">
              {match.awayTeam?.logo && (
                <Image
                  src={match.awayTeam.logo}
                  alt=""
                  width={22}
                  height={22}
                  className="size-[22px] shrink-0 object-contain"
                  unoptimized
                />
              )}
              <span className="truncate text-sm font-semibold text-foreground">{match.awayTeam?.name}</span>
            </div>
          </div>
        );

        return (
          <Card key={match.id} interactive={Boolean(href)} className="p-3">
            {href ? (
              <Link href={href} className="flex items-center gap-2">
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-2">{content}</div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
