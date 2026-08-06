"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlayerPill } from "@/components/fantasy/player-pill";
import { cn } from "@/lib/utils";
import { writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { FANTASY_LINEUP_STORAGE_KEY } from "@/lib/fantasy-lineup";
import { positionCode, searchAfricanPlayers } from "@/lib/data/african-players";
import { calculateRealLineupPoints, computeSeasonPoints } from "@/services/real-player-scoring";
import { isCompositionComplete } from "@/services/fantasy-scoring";
import type { AfricanPlayer, LineupSlot, PlayerPosition } from "@/types";

const DEFAULT_PER_GROUP = 15;

const POSITION_LABELS: Record<PlayerPosition, string> = {
  G: "Gardien",
  D: "Défenseurs",
  M: "Milieux",
  A: "Attaquant",
};

const POSITION_REQUIRED: Record<PlayerPosition, number> = { G: 1, D: 2, M: 2, A: 1 };
const POSITION_ORDER: PlayerPosition[] = ["G", "D", "M", "A"];

interface LineupBuilderProps {
  pool: AfricanPlayer[];
  journee: number;
  initialSelectedIds?: string[];
  initialCaptainId?: string | null;
  onSaved?: () => void;
}

export function LineupBuilder({
  pool,
  journee,
  initialSelectedIds = [],
  initialCaptainId = null,
  onSaved,
}: LineupBuilderProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [captainId, setCaptainId] = useState<string | null>(initialCaptainId);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  const positionById = useMemo(() => {
    const map = new Map<string, PlayerPosition>();
    for (const player of pool) {
      const code = positionCode(player.position);
      if (code) map.set(String(player.id), code);
    }
    return map;
  }, [pool]);

  const selectedPlayers = pool.filter((player) => selectedIds.includes(String(player.id)));

  // Selected players always stay visible in their group even while
  // searching for someone else — otherwise typing a query would make an
  // already-picked player seem to vanish.
  const poolByPosition = useMemo(() => {
    const byPosition: Record<PlayerPosition, AfricanPlayer[]> = { G: [], D: [], M: [], A: [] };
    for (const player of pool) {
      const code = positionById.get(String(player.id));
      if (code) byPosition[code].push(player);
    }

    const query = search.trim();
    const result: Record<PlayerPosition, AfricanPlayer[]> = { G: [], D: [], M: [], A: [] };
    for (const position of POSITION_ORDER) {
      const groupSelected = byPosition[position].filter((player) => selectedIds.includes(String(player.id)));
      const groupRest = byPosition[position].filter((player) => !selectedIds.includes(String(player.id)));
      const sortedRest = [...groupRest].sort((a, b) => b.appearances + b.goals - (a.appearances + a.goals));
      result[position] = query
        ? [...groupSelected, ...searchAfricanPlayers(sortedRest, query)]
        : [...groupSelected, ...sortedRest.slice(0, DEFAULT_PER_GROUP)];
    }
    return result;
  }, [pool, positionById, search, selectedIds]);

  const slots: LineupSlot[] = selectedPlayers.map((player) => ({
    playerId: String(player.id),
    position: positionById.get(String(player.id)) ?? "A",
  }));

  const scoringEntries = selectedPlayers.map((player) => ({
    player,
    position: positionById.get(String(player.id)) ?? ("A" as PlayerPosition),
  }));

  const totalPoints = isCompositionComplete(slots) ? calculateRealLineupPoints(scoringEntries, captainId) : null;

  function countForPosition(position: PlayerPosition): number {
    return selectedPlayers.filter((player) => positionById.get(String(player.id)) === position).length;
  }

  function toggle(player: AfricanPlayer) {
    const id = String(player.id);
    const position = positionById.get(id);
    if (!position) return;
    setSaved(false);
    setSelectedIds((current) => {
      if (current.includes(id)) {
        if (captainId === id) setCaptainId(null);
        return current.filter((pid) => pid !== id);
      }
      if (countForPosition(position) >= POSITION_REQUIRED[position]) return current;
      return [...current, id];
    });
  }

  function complete() {
    setSaved(true);
    writeLocalStorageValue(
      FANTASY_LINEUP_STORAGE_KEY,
      JSON.stringify({ selectedIds, captainId, matchday: journee })
    );
    // Let the "Enregistré ✓" confirmation flash briefly before switching to
    // the pitch view, instead of navigating away the instant it appears.
    setTimeout(() => onSaved?.(), 700);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Chercher un joueur, un pays, un club…"
          className={cn(
            "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground",
            "placeholder:text-muted focus:border-accent focus:outline-none"
          )}
        />
      </div>

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
                  points={computeSeasonPoints(player, position)}
                  selected={selectedIds.includes(String(player.id))}
                  isCaptain={captainId === String(player.id)}
                  disabled={
                    !selectedIds.includes(String(player.id)) && countForPosition(position) >= POSITION_REQUIRED[position]
                  }
                  onToggle={() => toggle(player)}
                  onSetCaptain={() => setCaptainId(String(player.id))}
                />
              ))}
              {poolByPosition[position].length === 0 && (
                <p className="py-3 text-center text-xs text-muted">Aucun joueur trouvé pour cette recherche.</p>
              )}
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
    </div>
  );
}
