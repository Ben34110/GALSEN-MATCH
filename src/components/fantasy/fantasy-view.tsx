"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { LineupBuilder } from "@/components/fantasy/lineup-builder";
import { PitchView } from "@/components/fantasy/pitch-view";
import { useSavedLineup } from "@/hooks/use-saved-lineup";
import { useCountdown } from "@/hooks/use-countdown";
import { getCurrentGameweek } from "@/lib/fantasy-gameweek";
import { positionCode } from "@/lib/data/african-players";
import type { AfricanPlayer, PlayerPosition } from "@/types";

interface FantasyViewProps {
  pool: AfricanPlayer[];
}

function formatCountdown(days: number, hours: number, minutes: number): string {
  if (days > 0) return `${days} j ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

export function FantasyView({ pool }: FantasyViewProps) {
  const { journee, deadline } = useMemo(() => getCurrentGameweek(), []);
  const countdown = useCountdown(deadline);
  const savedLineup = useSavedLineup();
  const hasCurrentWeekLineup = savedLineup?.matchday === journee;
  const [editing, setEditing] = useState(false);
  const showBuilder = editing || !hasCurrentWeekLineup;

  const savedSlots = useMemo(() => {
    if (!savedLineup || !hasCurrentWeekLineup) return [];
    return savedLineup.selectedIds
      .map((id) => pool.find((p) => String(p.id) === id))
      .filter((p): p is AfricanPlayer => Boolean(p))
      .map((player) => ({ player, position: positionCode(player.position) ?? ("A" as PlayerPosition) }));
  }, [savedLineup, hasCurrentWeekLineup, pool]);

  return (
    <div>
      <SectionHeader
        eyebrow="Starting 6"
        title={`Journée ${journee}`}
        subtitle={
          countdown.expired
            ? "Les compositions sont closes pour cette journée — la prochaine ouvre lundi."
            : `Compositions ouvertes jusqu'à dimanche minuit — ${formatCountdown(countdown.days, countdown.hours, countdown.minutes)} restant(es).`
        }
      />

      {showBuilder ? (
        <>
          <Card className="mb-5 flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-2/15 text-accent-2">
              <Trophy size={20} aria-hidden />
            </span>
            <p className="text-sm leading-snug text-muted">
              {pool.length} vrais joueurs africains des 5 grands championnats européens. Points estimés à partir de
              leurs vraies statistiques de la saison (apparitions, buts, passes).
            </p>
          </Card>

          <LineupBuilder
            pool={pool}
            journee={journee}
            initialSelectedIds={hasCurrentWeekLineup ? savedLineup!.selectedIds : []}
            initialCaptainId={hasCurrentWeekLineup ? savedLineup!.captainId : null}
            onSaved={() => setEditing(false)}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <PitchView slots={savedSlots} captainId={savedLineup?.captainId ?? null} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={[
              "flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-5",
              "text-sm font-semibold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-95",
            ].join(" ")}
          >
            Modifier ma composition
          </button>
        </div>
      )}
    </div>
  );
}
