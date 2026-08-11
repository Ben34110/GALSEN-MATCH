"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Plus, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn, formatKickoff } from "@/lib/utils";
import { fetchTeamUpcomingMatches, fetchPlayerJourneeRating } from "@/app/(app)/live/actions";
import { getNationalityFlag } from "@/lib/data/nationality-flags";
import { positionCode } from "@/lib/data/african-players";
import { FORMATION_SEATS, type SeatDef, type SeatId } from "@/lib/fantasy-formation";
import { getJourneeWeekRange } from "@/lib/fantasy-gameweek";
import { ratingColor } from "@/lib/rating-color";
import { PlayerPickerSheet } from "@/components/fantasy/player-picker-sheet";
import type { AfricanPlayer, Match } from "@/types";
import type { SeatMap } from "@/lib/fantasy-lineup";
import type { PlayerJourneeRating } from "@/lib/data/fantasy-ratings";

// Shared by both tooltips below — clears the token stack under a seat (flag
// + photo + name label, ~92-100px depending on the sm: breakpoint's larger
// photo), sized to the desktop dimensions so mobile, with its smaller
// photo, only ever gets *extra* clearance rather than risking an overlap.
function tooltipPositionStyle(seat: SeatDef): CSSProperties {
  return { top: `calc(${seat.topPercent}% + 106px)`, left: `${seat.leftPercent}%` };
}

// A player id absent from this map means "not fetched yet" (loading).
type NextMatchState = Record<string, Match[] | "error">;
type RatingState = Record<string, PlayerJourneeRating>;

function EmptySeatToken({ seat, onTap }: { seat: SeatDef; onTap: () => void }) {
  const t = useTranslations("fantasy");
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={seat.position === "G" ? t("pitch.chooseGoalkeeper") : t("pitch.choosePlayer")}
      className="flex flex-col items-center gap-1 active:scale-95 transition-transform duration-[var(--duration-fast)]"
    >
      <span className="grid size-12 place-items-center rounded-full border-2 border-dashed border-white/70 bg-black/15 text-white sm:size-14">
        <Plus size={20} aria-hidden />
      </span>
      <span className="rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">{t("pitch.chooseLabel")}</span>
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
  rating,
}: {
  player: AfricanPlayer;
  isCaptain: boolean;
  editable: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSetCaptain: () => void;
  rating: PlayerJourneeRating | undefined;
}) {
  const t = useTranslations("fantasy");
  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={
          editable
            ? t("pitch.changePlayer", { name: player.name })
            : rating?.status === "rated" || rating?.status === "live"
              ? t("pitch.viewMoments", { name: player.name })
              : t("pitch.viewNextMatch", { name: player.name })
        }
        className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform duration-[var(--duration-fast)]"
      >
        <span className="text-lg leading-none" aria-hidden>
          {getNationalityFlag(player.nationality)}
        </span>
        {/* The photo circle clips to overflow-hidden (for the round crop) —
            badges live on this *outer* span instead of inside it, otherwise
            they get cut off at the circle's edge instead of sitting visibly
            above the photo. */}
        <span className="relative">
          <span
            className={cn(
              "grid size-12 place-items-center overflow-hidden rounded-full border-2 shadow-md sm:size-14",
              isCaptain ? "border-accent-2" : "border-white/80"
            )}
          >
            <Image src={player.photo} alt="" width={56} height={56} className="size-full object-cover" unoptimized />
          </span>
          {isCaptain && (
            <span
              className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-white bg-accent-2 text-[10px] font-extrabold text-foreground shadow-sm"
              aria-hidden
            >
              C
            </span>
          )}
          {rating?.status === "live" && (
            // Small dynamic "match in progress" indicator — a pinging ring
            // behind a solid dot, the common "LIVE" visual shorthand.
            // Independent of the rating badge below: shown even before the
            // player has an in-match rating yet (e.g. kickoff just
            // happened), which the rating badge alone can't convey.
            <span className="absolute -left-1 -top-1 flex size-3" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full border border-white bg-red-500" />
            </span>
          )}
          {(rating?.status === "rated" || rating?.status === "live") && rating.rating !== null && (
            <span
              className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-white text-[9px] font-extrabold text-white shadow-sm"
              style={{ backgroundColor: ratingColor(rating.rating) }}
              aria-label={
                rating.status === "live"
                  ? t("pitch.liveRatingAria", { rating: rating.rating.toFixed(1) })
                  : t("pitch.ratingAria", { rating: rating.rating.toFixed(1) })
              }
            >
              {rating.rating.toFixed(1).replace(".", ",")}
            </span>
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
          aria-label={isCaptain ? t("pitch.isCaptain", { name: player.name }) : t("pitch.setCaptain", { name: player.name })}
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
  const t = useTranslations("fantasy");
  const match = Array.isArray(nextMatch) ? nextMatch[0] : undefined;
  const isHome = match ? match.homeTeamId === String(player.teamId) : false;
  const opponent = match ? (isHome ? match.awayTeam : match.homeTeam) : undefined;

  return (
    <div
      role="tooltip"
      className="absolute z-30 w-44 -translate-x-1/2 rounded-xl border border-border bg-surface p-2.5 text-left shadow-lg"
      style={tooltipPositionStyle(seat)}
    >
      {nextMatch === undefined && <p className="text-xs text-muted">{t("common.loading")}</p>}
      {nextMatch === "error" && <p className="text-xs text-muted">{t("pitch.nextMatchUnavailable")}</p>}
      {Array.isArray(nextMatch) &&
        (match && opponent ? (
          <div className="flex items-center gap-2">
            {opponent.logo && (
              <Image src={opponent.logo} alt="" width={24} height={24} className="size-6 shrink-0 object-contain" unoptimized />
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{t("pitch.vsOpponent", { name: opponent.name })}</p>
              <p className="text-[10px] text-muted">{formatKickoff(match.kickoffAt)}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">{t("pitch.noUpcomingMatch")}</p>
        ))}
    </div>
  );
}

// Shown instead of NextMatchTooltip once a player's journée rating is in —
// there's no "next match" left to be curious about for a game that already
// happened, but there are real key moments to surface (goals, assists,
// cards, shots on target as the closest proxy API-Football offers to xG on
// this plan — see fantasy-ratings.ts).
function MatchMomentsTooltip({ seat, rating }: { seat: SeatDef; rating: PlayerJourneeRating }) {
  const t = useTranslations("fantasy");
  const moments = rating.moments;
  if (!moments) {
    return (
      <div
        role="tooltip"
        className="absolute z-30 w-48 -translate-x-1/2 rounded-xl border border-border bg-surface p-2.5 text-left shadow-lg"
        style={tooltipPositionStyle(seat)}
      >
        <p className="text-xs text-muted">{t("pitch.matchDetailsUnavailable")}</p>
      </div>
    );
  }

  const scoreLabel =
    moments.teamScore !== null && moments.opponentScore !== null
      ? moments.isHome
        ? `${moments.teamScore}-${moments.opponentScore}`
        : `${moments.opponentScore}-${moments.teamScore}`
      : null;

  const facts: string[] = [];
  if (moments.goals > 0) facts.push(t("pitch.goalsFact", { count: moments.goals }));
  if (moments.assists > 0) facts.push(t("pitch.assistsFact", { count: moments.assists }));
  if (moments.redCards > 0) facts.push(t("pitch.redCard"));
  else if (moments.yellowCards > 0) facts.push(t("pitch.yellowCard"));
  if (moments.shotsOnTarget !== null && moments.shotsTotal !== null) {
    facts.push(t("pitch.shotsOnTarget", { made: moments.shotsOnTarget, total: moments.shotsTotal }));
  }
  if (moments.duelsWon !== null && moments.duelsTotal !== null) {
    facts.push(t("pitch.duelsWon", { made: moments.duelsWon, total: moments.duelsTotal }));
  }

  return (
    <div
      role="tooltip"
      className="absolute z-30 w-52 -translate-x-1/2 rounded-xl border border-border bg-surface p-2.5 text-left shadow-lg"
      style={tooltipPositionStyle(seat)}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <Image src={moments.opponentLogo} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" unoptimized />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{t("pitch.vsOpponent", { name: moments.opponentName })}</p>
          {scoreLabel && <p className="text-[10px] text-muted">{scoreLabel}</p>}
        </div>
        {rating.status === "live" && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-500">
            <span className="size-1.5 rounded-full bg-red-500" aria-hidden />
            {t("pitch.live")}
          </span>
        )}
      </div>
      {moments.minutes !== null && (
        <p className="mb-1 text-[10px] text-muted">{t("pitch.minutesPlayed", { minutes: moments.minutes })}</p>
      )}
      {facts.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {facts.map((fact) => (
            <li key={fact} className="text-[11px] text-foreground">
              {fact}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-muted">{t("pitch.noHighlights")}</p>
      )}
    </div>
  );
}

interface PitchViewProps {
  pool: AfricanPlayer[];
  seats: SeatMap;
  captainId: string | null;
  editable: boolean;
  // Which journée's week to check for a finished match/rating — only
  // meaningful (and only fetched) once !editable, i.e. this squad is
  // locked. Optional since some callers (e.g. a bare preview) never lock.
  journee?: number;
  onAssign?: (seatId: SeatId, playerId: string) => void;
  onRemove?: (seatId: SeatId) => void;
  onSetCaptain?: (playerId: string) => void;
}

export function PitchView({ pool, seats, captainId, editable, journee, onAssign, onRemove, onSetCaptain }: PitchViewProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pickerSeatId, setPickerSeatId] = useState<SeatId | null>(null);
  const [nextMatches, setNextMatches] = useState<NextMatchState>({});
  const [ratings, setRatings] = useState<RatingState>({});

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

  // Mirrors `ratings` for the interval below to read fresh state without
  // needing `ratings` itself in the effect's deps — putting it there would
  // restart (and so never let 45s pass on) the interval every time a fetch
  // resolves.
  const ratingsRef = useRef<RatingState>({});
  useEffect(() => {
    ratingsRef.current = ratings;
  }, [ratings]);

  useEffect(() => {
    if (editable || journee === undefined) return; // only meaningful once locked
    const { start, end } = getJourneeWeekRange(journee);

    function fetchRating(player: AfricanPlayer) {
      if (!player.teamId) return;
      const id = String(player.id);
      fetchPlayerJourneeRating(player.id, player.teamId, start.toISOString(), end.toISOString())
        .then((result) => setRatings((current) => ({ ...current, [id]: result })))
        .catch(() => setRatings((current) => ({ ...current, [id]: { status: "pending", rating: null } })));
    }

    for (const player of filledPlayers) {
      if (ratingsRef.current[String(player.id)] === undefined) fetchRating(player);
    }

    // Keeps polling while any tracked player's match could still be moving
    // (not fetched yet, or currently live) — without this, a locked squad
    // page only ever showed whatever rating was in as of the moment it was
    // first opened, never updating while a match is actually being played.
    const interval = setInterval(() => {
      for (const player of filledPlayers) {
        const current = ratingsRef.current[String(player.id)];
        if (current === undefined || current.status === "pending" || current.status === "live") fetchRating(player);
      }
    }, 45_000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when the journée or player set changes; ratingsRef gives the interval fresh state without restarting it
  }, [editable, journee, filledPlayers.map((p) => p.id).join(",")]);

  const pickerSeat = pickerSeatId ? FORMATION_SEATS.find((s) => s.id === pickerSeatId) : undefined;
  const openSeat = openKey ? FORMATION_SEATS.find((s) => s.id === openKey) : undefined;
  const openPlayerId = openSeat ? seats[openSeat.id] : null;
  const openPlayer = openPlayerId ? pool.find((p) => String(p.id) === openPlayerId) : undefined;
  const openPlayerRating = openPlayer ? ratings[String(openPlayer.id)] : undefined;

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
                  rating={ratings[String(player.id)]}
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
          openPlayerRating?.status === "rated" || openPlayerRating?.status === "live" ? (
            <MatchMomentsTooltip seat={openSeat} rating={openPlayerRating} />
          ) : (
            <NextMatchTooltip seat={openSeat} player={openPlayer} nextMatch={nextMatches[String(openPlayer.id)]} />
          )
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
