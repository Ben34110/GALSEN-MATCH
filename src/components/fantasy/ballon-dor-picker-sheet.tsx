"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { getNationalityFlag } from "@/lib/data/nationality-flags";
import { searchAfricanPlayers } from "@/lib/data/african-players";
import type { AfricanPlayer } from "@/types";

const DEFAULT_VISIBLE = 15;

interface BallonDorPickerSheetProps {
  candidates: AfricanPlayer[]; // full pool minus players already ranked
  onPick: (player: AfricanPlayer) => void;
  onClose: () => void;
}

// Trimmed fork of player-picker-sheet.tsx: same full-screen sheet, same
// search, same photo+flag+name+team row — but no position filter (a
// Ballon d'Or pick isn't seat-scoped) and no "next opponent" fetch (that's
// a Starting XI-specific concern, irrelevant to a season-long prediction).
export function BallonDorPickerSheet({ candidates, onPick, onClose }: BallonDorPickerSheetProps) {
  const [search, setSearch] = useState("");

  const sorted = useMemo(
    () => [...candidates].sort((a, b) => b.appearances + b.goals - (a.appearances + a.goals)),
    [candidates]
  );
  const visible = search.trim() ? searchAfricanPlayers(sorted, search).slice(0, 30) : sorted.slice(0, DEFAULT_VISIBLE);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-[calc(0.75rem+var(--safe-top))]">
        <h2 className="font-serif text-lg font-bold text-foreground">Ajouter un joueur</h2>
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
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+var(--safe-bottom))]">
        <div className="flex flex-col gap-1.5">
          {visible.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => onPick(player)}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-accent/40"
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
              </span>
            </button>
          ))}
          {visible.length === 0 && <p className="py-8 text-center text-sm text-muted">Aucun joueur trouvé.</p>}
        </div>
      </div>
    </div>
  );
}
