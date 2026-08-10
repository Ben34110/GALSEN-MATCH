"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import type { MatchLineup, MatchLineupPlayer } from "@/types";

// API-Football's own position codes on a lineup entry (distinct from this
// app's internal G/D/M/A PlayerPosition used by Fantasy — this one uses "F"
// for forward, and isn't always present for every player).
const POSITION_ORDER = ["G", "D", "M", "F"];

function groupByPosition(players: MatchLineupPlayer[], positionLabels: Record<string, string>) {
  const groups = new Map<string, MatchLineupPlayer[]>();
  for (const player of players) {
    const key = player.position && positionLabels[player.position] ? player.position : "?";
    groups.set(key, [...(groups.get(key) ?? []), player]);
  }
  return POSITION_ORDER.filter((code) => groups.has(code)).map((code) => ({
    code,
    label: positionLabels[code],
    players: groups.get(code) ?? [],
  }));
}

function TeamLineup({ lineup, positionLabels, t }: { lineup: MatchLineup; positionLabels: Record<string, string>; t: ReturnType<typeof useTranslations> }) {
  const groups = groupByPosition(lineup.startXI, positionLabels);

  return (
    <div className="flex-1">
      <div className="mb-3 flex items-center gap-2">
        {lineup.team.logo ? (
          <Image src={lineup.team.logo} alt="" width={22} height={22} className="size-[22px] shrink-0 object-contain" unoptimized />
        ) : (
          <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-surface-2 text-[9px] font-bold text-muted">
            {lineup.team.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 truncate text-sm font-bold text-foreground">{lineup.team.name}</span>
        {lineup.formation && (
          <span className="ml-auto shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
            {lineup.formation}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.code}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">{group.label}</p>
            <ul className="flex flex-col gap-1">
              {group.players.map((player) => (
                <li key={player.id} className="flex items-center gap-1.5 text-sm text-foreground">
                  {player.number !== null && (
                    <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted">{player.number}</span>
                  )}
                  <span className="truncate">{player.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {lineup.substitutes.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-muted transition-colors hover:text-foreground">
            {t("lineups.substitutes", { count: lineup.substitutes.length })}
          </summary>
          <ul className="mt-1.5 flex flex-col gap-1">
            {lineup.substitutes.map((player) => (
              <li key={player.id} className="flex items-center gap-1.5 text-xs text-muted">
                {player.number !== null && <span className="w-4 shrink-0 text-right tabular-nums">{player.number}</span>}
                <span className="truncate">{player.name}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {lineup.coachName && <p className="mt-3 text-[11px] text-muted">{t("lineups.coach", { name: lineup.coachName })}</p>}
    </div>
  );
}

export function MatchLineups({ lineups }: { lineups: MatchLineup[] }) {
  const t = useTranslations("live");
  const positionLabels: Record<string, string> = {
    G: t("lineups.goalkeeper"),
    D: t("lineups.defenders"),
    M: t("lineups.midfielders"),
    F: t("lineups.forwards"),
  };

  if (lineups.length === 0) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-muted">{t("lineups.notAnnounced")}</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-muted">{t("lineups.title")}</h2>
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
        {lineups.map((lineup) => (
          <TeamLineup key={lineup.team.id} lineup={lineup} positionLabels={positionLabels} t={t} />
        ))}
      </div>
    </Card>
  );
}
