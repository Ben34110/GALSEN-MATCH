"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlayerPill } from "@/components/fantasy/player-pill";
import { cn } from "@/lib/utils";
import { writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { FANTASY_LINEUP_STORAGE_KEY } from "@/lib/fantasy-lineup";
import {
  calculateLineupPoints,
  computePlayerPoints,
  isCompositionComplete,
} from "@/services/fantasy-scoring";
import type { LineupSlot, Player, PlayerMatchStat, PlayerPosition } from "@/types";

const CURRENT_MATCHDAY = 12;

const POSITION_LABELS: Record<PlayerPosition, string> = {
  G: "Gardien",
  D: "Défenseurs",
  M: "Milieux",
  A: "Attaquant",
};

const POSITION_REQUIRED: Record<PlayerPosition, number> = { G: 1, D: 2, M: 2, A: 1 };
const POSITION_ORDER: PlayerPosition[] = ["G", "D", "M", "A"];

interface LineupBuilderProps {
  pool: Player[];
  stats: Map<string, PlayerMatchStat>;
}

export function LineupBuilder({ pool, stats }: LineupBuilderProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const poolByPosition = useMemo(() => {
    const grouped: Record<PlayerPosition, Player[]> = { G: [], D: [], M: [], A: [] };
    for (const player of pool) grouped[player.position].push(player);
    return grouped;
  }, [pool]);

  const selectedPlayers = pool.filter((player) => selectedIds.includes(player.id));

  const slots: LineupSlot[] = selectedPlayers.map((player) => ({
    playerId: player.id,
    position: player.position,
  }));

  const totalPoints = isCompositionComplete(slots) ? calculateLineupPoints(slots, captainId, stats) : null;

  function countForPosition(position: PlayerPosition): number {
    return selectedPlayers.filter((player) => player.position === position).length;
  }

  function toggle(player: Player) {
    setSaved(false);
    setSelectedIds((current) => {
      if (current.includes(player.id)) {
        if (captainId === player.id) setCaptainId(null);
        return current.filter((id) => id !== player.id);
      }
      if (countForPosition(player.position) >= POSITION_REQUIRED[player.position]) return current;
      return [...current, player.id];
    });
  }

  function complete() {
    setSaved(true);
    writeLocalStorageValue(
      FANTASY_LINEUP_STORAGE_KEY,
      JSON.stringify({ selectedIds, captainId, matchday: CURRENT_MATCHDAY })
    );
  }

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:gap-y-5">
      {POSITION_ORDER.map((position) => (
        <section key={position}>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{POSITION_LABELS[position]}</h2>
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                countForPosition(position) === POSITION_REQUIRED[position] ? "text-accent" : "text-muted"
              )}
            >
              {countForPosition(position)}/{POSITION_REQUIRED[position]}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {poolByPosition[position].map((player) => (
              <PlayerPill
                key={player.id}
                player={player}
                points={computePlayerPoints(player.position, stats.get(player.id))}
                selected={selectedIds.includes(player.id)}
                isCaptain={captainId === player.id}
                disabled={
                  !selectedIds.includes(player.id) && countForPosition(position) >= POSITION_REQUIRED[position]
                }
                onToggle={() => toggle(player)}
                onSetCaptain={() => setCaptainId(player.id)}
              />
            ))}
          </div>
        </section>
      ))}

      <Card
        className={cn(
          "sticky bottom-[calc(6rem+var(--safe-bottom))] flex items-center justify-between gap-3",
          "border-accent/40 bg-surface/95 backdrop-blur lg:col-span-2 lg:bottom-6"
        )}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {totalPoints === null ? "Composition incomplète" : saved ? "Composition enregistrée" : "Points estimés"}
          </p>
          <p className="text-2xl font-extrabold tabular-nums text-foreground">
            {totalPoints === null ? `${selectedPlayers.length}/6` : totalPoints}
          </p>
        </div>
        <button
          type="button"
          onClick={complete}
          disabled={totalPoints === null}
          className={cn(
            "min-h-11 shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition-[color,background-color,transform] duration-[var(--duration-fast)]",
            totalPoints === null
              ? "cursor-not-allowed bg-surface-2 text-muted"
              : "bg-accent text-accent-ink hover:brightness-110 active:scale-95"
          )}
        >
          {saved ? (
            <span className="inline-flex items-center gap-1.5">
              <Check size={16} aria-hidden />
              Enregistré
            </span>
          ) : (
            "Valider l'équipe"
          )}
        </button>
      </Card>
    </div>
  );
}
