"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Star } from "lucide-react";
import { cn, formatKickoff } from "@/lib/utils";
import { fetchTeamUpcomingMatches } from "@/app/(app)/live/actions";
import { getNationalityFlag } from "@/lib/data/nationality-flags";
import { positionCode } from "@/lib/data/african-players";
import { FORMATION_SEATS, type SeatDef, type SeatId } from "@/lib/fantasy-formation";
import { PlayerPickerSheet } from "@/components/fantasy/player-picker-sheet";
import type { AfricanPlayer, Match } from "@/types";
import type { SeatMap } from "@/lib/fantasy-lineup";

// A player id absent from this map means "not fetched yet" (loading).
type NextMatchState = Record<string, Match[] | "error">;

function EmptySeatToken({ seat, onTap }: { seat: SeatDef; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Choisir un ${seat.position === "G" ? "gardien" : "joueur"}`}
      className="flex flex-col items-center gap-1 active:scale-95 transition-transform duration-[var(--duration-fast)]"
    >
      <span className="grid size-12 place-items-center rounded-full border-2 border-dashed border-white/70 bg-black/15 text-white sm:size-14">
        <Plus size={20} aria-hidden />
      </span>
      <span className="rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">Choisir</span>
    </button>
  );
}

function FilledSeatToken({
  player,
  isCaptain,
  editable,
  isOpen,
  onToggle,
  onSetCaptain,
}: {
  player: AfricanPlayer;
  isCaptain: boolean;
  editable: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSetCaptain: () => void;
}) {
  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={editable ? `Changer ${player.name}` : `Voir le prochain match de ${player.name}`}
        className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform duration-[var(--duration-fast)]"
      >
        <span className="text-lg leading-none" aria-hidden>
          {getNationalityFlag(player.nationality)}
        </span>
        <span
          className={cn(
            "relative grid size-12 place-items-center overflow-hidden rounded-full border-2 shadow-md sm:size-14",
            isCaptain ? "border-accent-2" : "border-white/80"
          )}
        >
          <Image src={player.photo} alt="" width={56} height={56} className="size-full object-cover" unoptimized />
          {isCaptain && !editable && (
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

      {editable && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSetCaptain();
          }}
          aria-pressed={isCaptain}
          aria-label={isCaptain ? `${player.name} est capitaine` : `Désigner ${player.name} capitaine`}
          className={cn(
            "absolute right-0 top-3.5 grid size-5 place-items-center rounded-full shadow-sm transition-colors active:scale-90",
            isCaptain ? "bg-accent-2 text-foreground" : "bg-black/40 text-white hover:bg-black/55"
          )}
        >
          <Star size={11} fill={isCaptain ? "currentColor" : "none"} aria-hidden />
        </button>
      )}
    </div>
  );
}

// Rendered once, outside the per-seat loop, instead of nested inside each
// seat's own absolutely-positioned wrapper — nesting it there meant its
// z-index only won within that seat's own div, and a *later* seat in
// FORMATION_SEATS (no z-index of its own, so plain DOM-order stacking)
// still painted over it whenever their absolute positions visually
// overlapped. Being the pitch container's last child (plus an explicit
// z-index) puts it above every seat unconditionally.
function NextMatchTooltip({
  seat,
  player,
  nextMatch,
}: {
  seat: SeatDef;
  player: AfricanPlayer;
  nextMatch: NextMatchState[string] | undefined;
}) {
  const match = Array.isArray(nextMatch) ? nextMatch[0] : undefined;
  const isHome = match ? match.homeTeamId === String(player.teamId) : false;
  const opponent = match ? (isHome ? match.awayTeam : match.homeTeam) : undefined;

  return (
    <div
      role="tooltip"
      className="absolute z-30 w-44 -translate-x-1/2 rounded-xl border border-border bg-surface p-2.5 text-left shadow-lg"
      // Clears the token stack below it (flag + photo + name label, ~92-100px
      // depending on the sm: breakpoint's larger photo) — sized to the
      // desktop dimensions so mobile, with its smaller photo, only ever gets
      // *extra* clearance rather than risking an overlap.
      style={{ top: `calc(${seat.topPercent}% + 106px)`, left: `${seat.leftPercent}%` }}
    >
      {nextMatch === undefined && <p className="text-xs text-muted">Chargement…</p>}
      {nextMatch === "error" && <p className="text-xs text-muted">Prochain match indisponible.</p>}
      {Array.isArray(nextMatch) &&
        (match && opponent ? (
          <div className="flex items-center gap-2">
            {opponent.logo && (
              <Image src={opponent.logo} alt="" width={24} height={24} className="size-6 shrink-0 object-contain" unoptimized />
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">vs {opponent.name}</p>
              <p className="text-[10px] text-muted">{formatKickoff(match.kickoffAt)}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">Aucun match à venir programmé.</p>
        ))}
    </div>
  );
}

interface PitchViewProps {
  pool: AfricanPlayer[];
  seats: SeatMap;
  captainId: string | null;
  editable: boolean;
  onAssign?: (seatId: SeatId, playerId: string) => void;
  onRemove?: (seatId: SeatId) => void;
  onSetCaptain?: (playerId: string) => void;
}

export function PitchView({ pool, seats, captainId, editable, onAssign, onRemove, onSetCaptain }: PitchViewProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pickerSeatId, setPickerSeatId] = useState<SeatId | null>(null);
  const [nextMatches, setNextMatches] = useState<NextMatchState>({});

  const filledPlayerIds = Object.values(seats).filter((id): id is string => id !== null);
  const filledPlayers = filledPlayerIds
    .map((id) => pool.find((p) => String(p.id) === id))
    .filter((p): p is AfricanPlayer => Boolean(p));

  useEffect(() => {
    if (editable) return; // tooltip data only needed in the locked/view mode
    for (const player of filledPlayers) {
      const id = String(player.id);
      if (nextMatches[id] !== undefined) continue;
      const request = player.teamId ? fetchTeamUpcomingMatches(player.teamId) : Promise.resolve([]);
      request
        .then((matches) => setNextMatches((current) => ({ ...current, [id]: matches })))
        .catch(() => setNextMatches((current) => ({ ...current, [id]: "error" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when the actual set of players changes
  }, [editable, filledPlayers.map((p) => p.id).join(",")]);

  const pickerSeat = pickerSeatId ? FORMATION_SEATS.find((s) => s.id === pickerSeatId) : undefined;
  const openSeat = openKey ? FORMATION_SEATS.find((s) => s.id === openKey) : undefined;
  const openPlayerId = openSeat ? seats[openSeat.id] : null;
  const openPlayer = openPlayerId ? pool.find((p) => String(p.id) === openPlayerId) : undefined;

  return (
    <>
      <div className="relative mx-auto mb-9 aspect-[3/4] w-full max-w-sm">
        {/* Background + markings are clipped to the pitch shape; the row below
            (player tokens) is a sibling with no overflow-hidden of its own, so
            a token anchored near the bottom (goalkeeper) can render its name
            label past the pitch's bottom edge instead of being cut off. */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-2xl shadow-md",
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
        </div>

        {FORMATION_SEATS.map((seat) => {
          const playerId = seats[seat.id];
          const player = playerId ? pool.find((p) => String(p.id) === playerId) : undefined;
          return (
            <div
              key={seat.id}
              className="absolute -translate-x-1/2"
              style={{ top: `${seat.topPercent}%`, left: `${seat.leftPercent}%` }}
            >
              {player ? (
                <FilledSeatToken
                  player={player}
                  isCaptain={captainId === String(player.id)}
                  editable={editable}
                  isOpen={openKey === seat.id}
                  onToggle={() => {
                    if (editable) {
                      setPickerSeatId(seat.id);
                    } else {
                      setOpenKey((current) => (current === seat.id ? null : seat.id));
                    }
                  }}
                  onSetCaptain={() => onSetCaptain?.(String(player.id))}
                />
              ) : editable ? (
                <EmptySeatToken seat={seat} onTap={() => setPickerSeatId(seat.id)} />
              ) : (
                <span className="grid size-12 place-items-center rounded-full border-2 border-dashed border-white/40 sm:size-14" />
              )}
            </div>
          );
        })}

        {openSeat && openPlayer && (
          <NextMatchTooltip seat={openSeat} player={openPlayer} nextMatch={nextMatches[String(openPlayer.id)]} />
        )}
      </div>

      {editable && pickerSeat && (
        <PlayerPickerSheet
          position={pickerSeat.position}
          currentPlayerId={seats[pickerSeat.id]}
          candidates={pool.filter((p) => {
            if (positionCode(p.position) !== pickerSeat.position) return false;
            const id = String(p.id);
            // Available for this seat unless already sitting in a *different*
            // seat — the player currently in *this* seat still needs to show
            // up (highlighted) so re-opening the picker doesn't hide them.
            return id === seats[pickerSeat.id] || !filledPlayerIds.includes(id);
          })}
          onPick={(player) => {
            onAssign?.(pickerSeat.id, String(player.id));
            setPickerSeatId(null);
          }}
          onRemove={() => {
            onRemove?.(pickerSeat.id);
            setPickerSeatId(null);
          }}
          onClose={() => setPickerSeatId(null)}
        />
      )}
    </>
  );
}
