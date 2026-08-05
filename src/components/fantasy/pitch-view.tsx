"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { cn, formatKickoff } from "@/lib/utils";
import { fetchTeamUpcomingMatches } from "@/app/(app)/live/actions";
import type { AfricanPlayer, Match, PlayerPosition } from "@/types";

interface PitchSlot {
  player: AfricanPlayer;
  position: PlayerPosition;
}

interface PitchViewProps {
  slots: PitchSlot[];
  captainId: string | null;
}

// 1-2-2-1 read bottom (goalkeeper, own goal) to top (attacker) — matches how
// a half-pitch view reads on a phone screen.
const ROWS: { position: PlayerPosition; topPercent: number }[] = [
  { position: "A", topPercent: 8 },
  { position: "M", topPercent: 38 },
  { position: "D", topPercent: 64 },
  { position: "G", topPercent: 88 },
];

// A player id absent from the map means "not fetched yet" (loading).
type NextMatchState = Match[] | "error";

function PlayerToken({
  slot,
  isCaptain,
  isOpen,
  onToggle,
  nextMatch,
}: {
  slot: PitchSlot;
  isCaptain: boolean;
  isOpen: boolean;
  onToggle: () => void;
  nextMatch: NextMatchState | undefined;
}) {
  const { player } = slot;

  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={`Voir le prochain match de ${player.name}`}
        className="flex flex-col items-center gap-1 active:scale-95 transition-transform duration-[var(--duration-fast)]"
      >
        <span
          className={cn(
            "relative grid size-12 place-items-center overflow-hidden rounded-full border-2 shadow-md sm:size-14",
            isCaptain ? "border-accent-2" : "border-white/80"
          )}
        >
          <Image src={player.photo} alt="" width={56} height={56} className="size-full object-cover" unoptimized />
          {isCaptain && (
            <Star
              size={13}
              className="absolute -right-0.5 -top-0.5 rounded-full bg-accent-2 p-0.5 text-foreground"
              fill="currentColor"
              aria-hidden
            />
          )}
        </span>
        <span className="max-w-16 truncate rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:max-w-20">
          {player.name}
        </span>
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={cn(
            "absolute top-full z-20 mt-1.5 w-48 rounded-xl border border-border bg-surface p-2.5 text-left shadow-lg",
            "left-1/2 -translate-x-1/2"
          )}
        >
          {nextMatch === undefined && <p className="text-xs text-muted">Chargement…</p>}
          {nextMatch === "error" && <p className="text-xs text-muted">Prochain match indisponible.</p>}
          {Array.isArray(nextMatch) &&
            (nextMatch[0] ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wide text-accent">Prochain match</p>
                <p className="mt-0.5 text-xs font-semibold text-foreground">
                  {player.name} · {nextMatch[0].homeTeam?.name} vs {nextMatch[0].awayTeam?.name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">{formatKickoff(nextMatch[0].kickoffAt)}</p>
              </>
            ) : (
              <p className="text-xs text-muted">Aucun match à venir programmé.</p>
            ))}
        </div>
      )}
    </div>
  );
}

export function PitchView({ slots, captainId }: PitchViewProps) {
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);
  const [nextMatches, setNextMatches] = useState<Record<string, NextMatchState>>({});

  useEffect(() => {
    for (const { player } of slots) {
      const id = String(player.id);
      if (nextMatches[id] !== undefined) continue;
      const request = player.teamId ? fetchTeamUpcomingMatches(player.teamId) : Promise.resolve([]);
      request
        .then((matches) => setNextMatches((current) => ({ ...current, [id]: matches })))
        .catch(() => setNextMatches((current) => ({ ...current, [id]: "error" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when the actual set of players changes
  }, [slots.map((s) => s.player.id).join(",")]);

  return (
    <div
      className={cn(
        "relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl shadow-md",
        "bg-[repeating-linear-gradient(180deg,#2a8f52_0px,#2a8f52_40px,#278a4d_40px,#278a4d_80px)]"
      )}
    >
      <svg viewBox="0 0 300 400" className="absolute inset-0 size-full" aria-hidden>
        <rect x="6" y="6" width="288" height="388" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <circle cx="150" cy="6" r="55" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <rect x="80" y="316" width="140" height="78" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <rect x="115" y="360" width="70" height="34" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <circle cx="150" cy="330" r="2.5" fill="rgba(255,255,255,0.7)" />
        <path d="M 115 316 A 40 40 0 0 0 185 316" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      </svg>

      {ROWS.map(({ position, topPercent }) => {
        const rowSlots = slots.filter((slot) => slot.position === position);
        return (
          <div
            key={position}
            className="absolute inset-x-0 flex justify-center gap-8 sm:gap-14"
            style={{ top: `${topPercent}%` }}
          >
            {rowSlots.map((slot) => (
              <PlayerToken
                key={slot.player.id}
                slot={slot}
                isCaptain={captainId === String(slot.player.id)}
                isOpen={openPlayerId === String(slot.player.id)}
                onToggle={() =>
                  setOpenPlayerId((current) => (current === String(slot.player.id) ? null : String(slot.player.id)))
                }
                nextMatch={nextMatches[String(slot.player.id)]}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
