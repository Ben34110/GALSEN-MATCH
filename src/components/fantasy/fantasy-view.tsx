"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { PitchView } from "@/components/fantasy/pitch-view";
import { useFantasyStorage, saveSquadForJournee } from "@/hooks/use-saved-lineup";
import { useCountdown } from "@/hooks/use-countdown";
import { getGameweekInfo } from "@/lib/fantasy-gameweek";
import { formatCountdown } from "@/lib/countdown-format";
import { EMPTY_SEATS, filledCount, isSquadComplete, type SeatId } from "@/lib/fantasy-lineup";
import { calculateRealLineupPoints } from "@/services/real-player-scoring";
import { positionCode } from "@/lib/data/african-players";
import type { AfricanPlayer, PlayerPosition } from "@/types";

interface FantasyViewProps {
  pool: AfricanPlayer[];
}

const TOTAL_SEATS = 11;

export function FantasyView({ pool }: FantasyViewProps) {
  const { activeJournee, activeStarted, editableJournee, editableDeadline } = useMemo(() => getGameweekInfo(), []);
  const countdown = useCountdown(editableDeadline);
  const storage = useFantasyStorage();

  // Defaults to the active (locked-once-started) journée; a button switches
  // to preparing the next one instead of the two ever being conflated.
  const [viewingJournee, setViewingJournee] = useState(activeJournee);
  const isEditableView = viewingJournee === editableJournee && !(activeStarted && viewingJournee === activeJournee);

  const squad = storage[viewingJournee] ?? { seats: EMPTY_SEATS, captainId: null };
  const filled = filledCount(squad.seats);
  const complete = isSquadComplete(squad.seats);

  const entries = Object.values(squad.seats)
    .filter((id): id is string => id !== null)
    .map((id) => pool.find((p) => String(p.id) === id))
    .filter((p): p is AfricanPlayer => Boolean(p))
    .map((player) => ({ player, position: positionCode(player.position) ?? ("A" as PlayerPosition) }));
  const totalPoints = complete ? calculateRealLineupPoints(entries, squad.captainId) : null;

  function assign(seatId: SeatId, playerId: string) {
    saveSquadForJournee(storage, viewingJournee, { ...squad, seats: { ...squad.seats, [seatId]: playerId } });
  }

  function remove(seatId: SeatId) {
    const nextCaptainId = squad.captainId === squad.seats[seatId] ? null : squad.captainId;
    saveSquadForJournee(storage, viewingJournee, {
      seats: { ...squad.seats, [seatId]: null },
      captainId: nextCaptainId,
    });
  }

  const activeSquad = storage[activeJournee];
  const activeHasTeam = activeSquad && filledCount(activeSquad.seats) > 0;

  return (
    <div>
      <SectionHeader
        eyebrow="Starting XI"
        title={`Journée ${viewingJournee}`}
        subtitle={
          isEditableView
            ? countdown.expired
              ? "Les compositions sont closes pour cette journée."
              : `Compositions ouvertes jusqu'au coup d'envoi — ${formatCountdown(countdown)} restant(es).`
            : `La journée ${viewingJournee} a commencé — composition verrouillée.`
        }
      />

      {isEditableView && (
        <Card className="mb-5 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-2/15 text-accent-2">
            <Trophy size={20} aria-hidden />
          </span>
          <p className="text-sm leading-snug text-muted">
            Touche un poste vide pour choisir un joueur africain — 1 gardien, 4 défenseurs, 3 milieux, 3
            attaquants. {filled}/{TOTAL_SEATS} sélectionné{filled > 1 ? "s" : ""}.
          </p>
        </Card>
      )}

      <div className="flex flex-col items-center gap-4">
        <PitchView
          pool={pool}
          seats={squad.seats}
          captainId={squad.captainId}
          editable={isEditableView}
          onAssign={assign}
          onRemove={remove}
          onSetCaptain={(playerId) => saveSquadForJournee(storage, viewingJournee, { ...squad, captainId: playerId })}
        />

        {!isEditableView && !activeHasTeam && (
          <p className="text-center text-sm text-muted">Aucune équipe n&apos;a été sélectionnée pour cette journée.</p>
        )}

        {totalPoints !== null && (
          <Card className="flex w-full items-center justify-between gap-3 border-accent/40">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Points estimés</p>
              <p className="text-2xl font-extrabold tabular-nums text-foreground">{totalPoints}</p>
            </div>
          </Card>
        )}

        {viewingJournee === activeJournee && activeStarted && (
          <button
            type="button"
            onClick={() => setViewingJournee(editableJournee)}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-95"
          >
            Préparer la journée {editableJournee}
          </button>
        )}

        {viewingJournee === editableJournee && activeStarted && (
          <button
            type="button"
            onClick={() => setViewingJournee(activeJournee)}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-95"
          >
            Revenir à la journée {activeJournee}
          </button>
        )}
      </div>
    </div>
  );
}
