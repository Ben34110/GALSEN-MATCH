"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PlayerPill } from "@/components/fantasy/player-pill";
import { cn } from "@/lib/utils";
import {
  calculateLineupPoints,
  computePlayerPoints,
  isCompositionComplete,
} from "@/services/fantasy-scoring";
import type { LineupSlot, Player, PlayerMatchStat, PlayerPosition } from "@/types";

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
  }

  return (
    <div className="flex flex-col gap-5">
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

      <Card className="sticky bottom-24 flex items-center justify-between border-accent/40 bg-surface/95 backdrop-blur">
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
            "rounded-full px-4 py-2 text-sm font-bold transition-colors",
            totalPoints === null
              ? "cursor-not-allowed bg-surface-2 text-muted"
              : "bg-accent text-accent-ink hover:brightness-110"
          )}
        >
          {saved ? "Enregistré ✓" : "Valider l'équipe"}
        </button>
      </Card>
    </div>
  );
}
