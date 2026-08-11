"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Info, ListOrdered, Pencil, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { PitchView } from "@/components/fantasy/pitch-view";
import { GameRulesSheet } from "@/components/fantasy/game-rules-sheet";
import { MyJourneeStanding } from "@/components/fantasy/my-journee-standing";
import { useFantasyStorage, saveSquadForJournee } from "@/hooks/use-saved-lineup";
import { useCountdown } from "@/hooks/use-countdown";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { syncFantasySquad } from "@/app/actions/fantasy-sync";
import { ensurePlayerNotificationSubscription, pruneStalePlayerNotifications } from "@/app/actions/notifications";
import { ensurePushSubscription } from "@/hooks/use-push-subscription";
import { getGameweekInfo } from "@/lib/fantasy-gameweek";
import { formatCountdown } from "@/lib/countdown-format";
import { EMPTY_SEATS, filledCount, isSquadComplete, type SeatId, type SeatMap } from "@/lib/fantasy-lineup";
import type { AfricanPlayer } from "@/types";

interface FantasyViewProps {
  pool: AfricanPlayer[];
}

const TOTAL_SEATS = 11;

export function FantasyView({ pool }: FantasyViewProps) {
  const t = useTranslations("fantasy");
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
  // copy is just for cross-device ranking). `locked` also mirrors onto
  // fantasy_squads so the poll cron can tell "this is someone's final XI
  // for the now-active journée" from "still being drafted" (see its own
  // comment on activating next week's notifications automatically).
  function syncRemote(seats: SeatMap, captainId: string | null, locked: boolean) {
    if (!profile) return;
    syncFantasySquad(getOrCreateDeviceId(), viewingJournee, profile.username, seats, captainId, locked);
  }

  // Only ever runs for the *active* journée's own lock — locking next
  // week's squad in advance must not notify for it yet (that's the whole
  // point of the poll cron's separate activation step below); it still
  // saves/syncs normally, just without touching notifications at all.
  //
  // Opts every one of the 11 players into lineup/goal/assist/rating push
  // notifications, reusing the exact same favorite_player_notifications
  // pipeline Profil's "joueurs préférés" already use (see
  // app/actions/notifications.ts's ensurePlayerNotificationSubscription) —
  // asking for push permission here, not on every single player pick while
  // composing, since this is the moment the squad becomes "final".
  //
  // Also prunes the *other* direction: a player dropped from the active
  // journée stops generating notifications unless still needed — an
  // explicit Profil favorite (a *future* journée's squad no longer counts
  // as "still needed": those players aren't notification-eligible until
  // their own journée activates). `storage` here can be one save behind
  // for viewingJournee itself (this render's closure, captured before the
  // write that's about to happen), so `seats` — the squad actually being
  // locked right now — is used instead of the stale storage entry.
  function subscribeSquadToNotifications(seats: SeatMap) {
    const currentSquadPlayerIds = Object.values(seats)
      .filter((id): id is string => id !== null)
      .map(Number);

    const relevantPlayerIds = new Set<number>(currentSquadPlayerIds);
    if (profile) {
      for (const id of profile.playerIds) relevantPlayerIds.add(Number(id));
    }

    const deviceId = getOrCreateDeviceId();
    ensurePushSubscription().then((result) => {
      if (!result.ok) return;
      for (const id of currentSquadPlayerIds) ensurePlayerNotificationSubscription(deviceId, id);
      pruneStalePlayerNotifications(deviceId, Array.from(relevantPlayerIds));
    });
  }

  function assign(seatId: SeatId, playerId: string) {
    const next = { ...squad, seats: { ...squad.seats, [seatId]: playerId } };
    saveSquadForJournee(storage, viewingJournee, next);
    syncRemote(next.seats, next.captainId, next.locked);
  }

  function remove(seatId: SeatId) {
    const nextCaptainId = squad.captainId === squad.seats[seatId] ? null : squad.captainId;
    const next = { ...squad, seats: { ...squad.seats, [seatId]: null }, captainId: nextCaptainId };
    saveSquadForJournee(storage, viewingJournee, next);
    syncRemote(next.seats, next.captainId, next.locked);
  }

  const activeSquad = storage[activeJournee];
  const activeHasTeam = activeSquad && filledCount(activeSquad.seats) > 0;

  return (
    <div>
      <Link
        href="/fantasy"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        {t("common.back")}
      </Link>

      <SectionHeader
        eyebrow={t("xi.eyebrow")}
        title={t("xi.title", { journee: viewingJournee })}
        subtitle={
          isEditableView
            ? countdown.expired
              ? t("xi.closedSubtitle")
              : t("xi.openSubtitle", { countdown: formatCountdown(countdown) })
            : calendarEditable
              ? t("xi.lockedEditableSubtitle")
              : t("xi.startedSubtitle", { journee: viewingJournee })
        }
        action={
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRules(true)}
              aria-label={t("xi.rulesAriaLabel")}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground transition-transform duration-[var(--duration-fast)] active:scale-90"
            >
              <Info size={20} aria-hidden />
            </button>
            <Link
              href={`/fantasy/xi/leaderboard?journee=${activeJournee}`}
              aria-label={t("xi.leaderboardAriaLabel")}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground transition-transform duration-[var(--duration-fast)] active:scale-90"
            >
              <ListOrdered size={20} aria-hidden />
            </Link>
          </div>
        }
      />

      {viewingJournee === activeJournee && activeStarted && (
        <div className="mb-5 flex justify-center">
          <MyJourneeStanding
            journee={activeJournee}
            className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-accent"
          />
        </div>
      )}

      {isEditableView && (
        <Card className="mb-5 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-2/15 text-accent-2">
            <Trophy size={20} aria-hidden />
          </span>
          <p className="text-sm leading-snug text-muted">
            {t("xi.instructions")} {t("xi.selectedCount", { filled, total: TOTAL_SEATS })}
          </p>
        </Card>
      )}

      <div className="flex flex-col items-center gap-4">
        <PitchView
          pool={pool}
          seats={squad.seats}
          captainId={squad.captainId}
          editable={isEditableView}
          journee={viewingJournee}
          onAssign={assign}
          onRemove={remove}
          onSetCaptain={(playerId) => {
            const next = { ...squad, captainId: playerId };
            saveSquadForJournee(storage, viewingJournee, next);
            syncRemote(next.seats, next.captainId, next.locked);
          }}
        />

        {!isEditableView && !activeHasTeam && <p className="text-center text-sm text-muted">{t("xi.noTeamSelected")}</p>}

        {isEditableView && (
          <button
            type="button"
            disabled={!complete}
            onClick={() => {
              const next = { ...squad, locked: true };
              saveSquadForJournee(storage, viewingJournee, next);
              syncRemote(next.seats, next.captainId, next.locked);
              // Notifications only ever activate for the *active* journée's
              // own lock — locking next week's squad early must wait for
              // the poll cron's automatic activation once it becomes active
              // (see api/cron/poll/route.ts), not fire immediately here.
              if (viewingJournee === activeJournee) subscribeSquadToNotifications(next.seats);
            }}
            className={cn(
              "flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-base font-bold",
              "transition-transform duration-[var(--duration-fast)]",
              complete ? "bg-accent text-accent-ink active:scale-[0.98]" : "cursor-not-allowed bg-surface-2 text-muted"
            )}
          >
            {complete
              ? t("xi.saveButton", { journee: viewingJournee })
              : t("xi.chooseButton", { total: TOTAL_SEATS, filled })}
          </button>
        )}

        {calendarEditable && squad.locked && (
          <button
            type="button"
            onClick={() => {
              const next = { ...squad, locked: false };
              saveSquadForJournee(storage, viewingJournee, next);
              syncRemote(next.seats, next.captainId, next.locked);
            }}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 text-base font-bold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-[0.98]"
          >
            <Pencil size={16} aria-hidden />
            {t("xi.editButton")}
          </button>
        )}

        {viewingJournee === activeJournee && activeStarted && (
          <button
            type="button"
            onClick={() => setViewingJournee(editableJournee)}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-95"
          >
            {t("xi.prepareNext", { journee: editableJournee })}
          </button>
        )}

        {viewingJournee === editableJournee && activeStarted && (
          <button
            type="button"
            onClick={() => setViewingJournee(activeJournee)}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-95"
          >
            {t("xi.backToActive", { journee: activeJournee })}
          </button>
        )}
      </div>

      {showRules && <GameRulesSheet onClose={() => setShowRules(false)} />}
    </div>
  );
}
