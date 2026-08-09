"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Info, ListOrdered, Pencil, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { PitchView } from "@/components/fantasy/pitch-view";
import { GameRulesSheet } from "@/components/fantasy/game-rules-sheet";
import { useFantasyStorage, saveSquadForJournee } from "@/hooks/use-saved-lineup";
import { useCountdown } from "@/hooks/use-countdown";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { syncFantasySquad } from "@/app/actions/fantasy-sync";
import { getGameweekInfo } from "@/lib/fantasy-gameweek";
import { formatCountdown } from "@/lib/countdown-format";
import { EMPTY_SEATS, filledCount, isSquadComplete, type SeatId, type SeatMap } from "@/lib/fantasy-lineup";
import type { AfricanPlayer } from "@/types";

interface FantasyViewProps {
  pool: AfricanPlayer[];
}

const TOTAL_SEATS = 11;

export function FantasyView({ pool }: FantasyViewProps) {
  const { activeJournee, activeStarted, editableJournee, editableDeadline } = useMemo(() => getGameweekInfo(), []);
  const countdown = useCountdown(editableDeadline);
  const storage = useFantasyStorage();
  const profile = useOnboardingProfile();
  const [showRules, setShowRules] = useState(false);

  // Defaults to the active (locked-once-started) journée; a button switches
  // to preparing the next one instead of the two ever being conflated.
  const [viewingJournee, setViewingJournee] = useState(activeJournee);
  // The calendar deadline (kickoff) is the hard, un-overridable cutoff;
  // squad.locked is a *voluntary* lock the player sets by tapping
  // "Enregistrer l'équipe" before kickoff, so tapping a player shows their
  // next match instead of the picker — with an explicit "Modifier" button
  // to undo it, unlike the calendar deadline which nothing can undo.
  const calendarEditable = viewingJournee === editableJournee && !(activeStarted && viewingJournee === activeJournee);
  const squad = storage[viewingJournee] ?? { seats: EMPTY_SEATS, captainId: null, locked: false };
  const isEditableView = calendarEditable && !squad.locked;
  const filled = filledCount(squad.seats);
  const complete = isSquadComplete(squad.seats);

  // Best-effort background sync to Supabase so the leaderboard sees this
  // squad — never blocks the local save/UI (see docs/notifications.md's
  // same pattern for why: local state is the source of truth, the remote
  // copy is just for cross-device ranking).
  function syncRemote(seats: SeatMap, captainId: string | null) {
    if (!profile) return;
    syncFantasySquad(getOrCreateDeviceId(), viewingJournee, profile.username, seats, captainId);
  }

  function assign(seatId: SeatId, playerId: string) {
    const next = { ...squad, seats: { ...squad.seats, [seatId]: playerId } };
    saveSquadForJournee(storage, viewingJournee, next);
    syncRemote(next.seats, next.captainId);
  }

  function remove(seatId: SeatId) {
    const nextCaptainId = squad.captainId === squad.seats[seatId] ? null : squad.captainId;
    const next = { ...squad, seats: { ...squad.seats, [seatId]: null }, captainId: nextCaptainId };
    saveSquadForJournee(storage, viewingJournee, next);
    syncRemote(next.seats, next.captainId);
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
            : calendarEditable
              ? "Équipe enregistrée et verrouillée — appuie sur Modifier pour la changer avant le coup d'envoi."
              : `La journée ${viewingJournee} a commencé — composition verrouillée.`
        }
        action={
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRules(true)}
              aria-label="Comment ça marche"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground transition-transform duration-[var(--duration-fast)] active:scale-90"
            >
              <Info size={20} aria-hidden />
            </button>
            <Link
              href={`/fantasy/xi/leaderboard?journee=${activeJournee}`}
              aria-label="Classement général"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground transition-transform duration-[var(--duration-fast)] active:scale-90"
            >
              <ListOrdered size={20} aria-hidden />
            </Link>
          </div>
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
          onSetCaptain={(playerId) => {
            const next = { ...squad, captainId: playerId };
            saveSquadForJournee(storage, viewingJournee, next);
            syncRemote(next.seats, next.captainId);
          }}
        />

        {!isEditableView && !activeHasTeam && (
          <p className="text-center text-sm text-muted">Aucune équipe n&apos;a été sélectionnée pour cette journée.</p>
        )}

        {isEditableView && (
          <button
            type="button"
            disabled={!complete}
            onClick={() => {
              const next = { ...squad, locked: true };
              saveSquadForJournee(storage, viewingJournee, next);
              syncRemote(next.seats, next.captainId);
            }}
            className={cn(
              "flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-base font-bold",
              "transition-transform duration-[var(--duration-fast)]",
              complete ? "bg-accent text-accent-ink active:scale-[0.98]" : "cursor-not-allowed bg-surface-2 text-muted"
            )}
          >
            {complete ? `Enregistrer l'équipe pour la Journée ${viewingJournee}` : `Choisis tes ${TOTAL_SEATS} joueurs (${filled}/${TOTAL_SEATS})`}
          </button>
        )}

        {calendarEditable && squad.locked && (
          <button
            type="button"
            onClick={() => {
              const next = { ...squad, locked: false };
              saveSquadForJournee(storage, viewingJournee, next);
              syncRemote(next.seats, next.captainId);
            }}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 text-base font-bold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-[0.98]"
          >
            <Pencil size={16} aria-hidden />
            Modifier l&apos;équipe
          </button>
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

      {showRules && <GameRulesSheet onClose={() => setShowRules(false)} />}
    </div>
  );
}
