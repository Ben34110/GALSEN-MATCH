"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchTeamUpcomingMatches } from "@/app/(app)/live/actions";
import { getNationalityFlag } from "@/lib/data/nationality-flags";
import { searchAfricanPlayers } from "@/lib/data/african-players";
import { POSITION_LABELS_PLURAL } from "@/lib/fantasy-formation";
import type { AfricanPlayer, Match, PlayerPosition } from "@/types";

const DEFAULT_VISIBLE = 15;

// A player id absent from this map means "not fetched yet" (loading).
type OpponentState = Record<number, Match[] | "error">;

function opponentLabel(player: AfricanPlayer, state: Match[] | "error" | undefined): string {
  if (state === undefined) return "Chargement…";
  if (state === "error") return "Prochain match indisponible";
  const nextMatch = state[0];
  if (!nextMatch) return "Aucun match à venir programmé";
  const isHome = nextMatch.homeTeamId === String(player.teamId);
  const opponent = isHome ? nextMatch.awayTeam?.name : nextMatch.homeTeam?.name;
  return `${isHome ? "vs" : "@"} ${opponent ?? "adversaire inconnu"} cette semaine`;
}

interface PlayerPickerSheetProps {
  position: PlayerPosition;
  candidates: AfricanPlayer[]; // already filtered to this seat's position, excluding already-picked players
  currentPlayerId: string | null; // filled in this seat right now, if any
  onPick: (player: AfricanPlayer) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function PlayerPickerSheet({ position, candidates, currentPlayerId, onPick, onRemove, onClose }: PlayerPickerSheetProps) {
  const [search, setSearch] = useState("");
  const [opponents, setOpponents] = useState<OpponentState>({});

  const sorted = useMemo(
    () => [...candidates].sort((a, b) => b.appearances + b.goals - (a.appearances + a.goals)),
    [candidates]
  );
  const visible = search.trim() ? searchAfricanPlayers(sorted, search).slice(0, 30) : sorted.slice(0, DEFAULT_VISIBLE);

  useEffect(() => {
    for (const player of visible) {
      if (opponents[player.id] !== undefined) continue;
      const request = player.teamId ? fetchTeamUpcomingMatches(player.teamId) : Promise.resolve([]);
      request
        .then((matches) => setOpponents((current) => ({ ...current, [player.id]: matches })))
        .catch(() => setOpponents((current) => ({ ...current, [player.id]: "error" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when the visible set changes
  }, [visible.map((p) => p.id).join(",")]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-[calc(0.75rem+var(--safe-top))]">
        <h2 className="font-serif text-lg font-bold text-foreground">{POSITION_LABELS_PLURAL[position]}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-foreground"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="px-4 pb-2 pt-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Chercher un joueur, un pays, un club…"
            autoFocus
            className="min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        {currentPlayerId && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-2 min-h-9 w-full rounded-xl border border-accent-3/30 bg-accent-3/5 text-xs font-semibold text-accent-3 transition-colors hover:bg-accent-3/10"
          >
            Retirer ce joueur du siège
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+var(--safe-bottom))]">
        <div className="flex flex-col gap-1.5">
          {visible.map((player) => {
            const isCurrent = String(player.id) === currentPlayerId;
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => onPick(player)}
                aria-pressed={isCurrent}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                  isCurrent ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/40"
                )}
              >
                <span className="relative shrink-0">
                  <Image
                    src={player.photo}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-full bg-surface-2 object-cover"
                    unoptimized
                  />
                  <span
                    className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-surface text-[11px] shadow-sm"
                    aria-hidden
                  >
                    {getNationalityFlag(player.nationality)}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{player.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {player.nationality} · {player.teamName ?? "—"}
                  </span>
                  <span className="block truncate text-[11px] font-medium text-accent">
                    {opponentLabel(player, opponents[player.id])}
                  </span>
                </span>
              </button>
            );
          })}
          {visible.length === 0 && <p className="py-8 text-center text-sm text-muted">Aucun joueur trouvé.</p>}
        </div>
      </div>
    </div>
  );
}
