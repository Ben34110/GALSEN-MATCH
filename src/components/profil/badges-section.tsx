"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useLocalStorageValue } from "@/hooks/use-local-storage-value";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";
import { FANTASY_LINEUP_STORAGE_KEY } from "@/lib/fantasy-lineup";
import { BADGES, HAS_ADDED_CALENDAR_EVENT_KEY, HAS_CHATTED_KEY, computeUnlockedBadgeIds } from "@/lib/badges";
import { getAfricanPlayers } from "@/lib/data/african-players";

export function BadgesSection() {
  const rawProfile = useLocalStorageValue(ONBOARDING_STORAGE_KEY);
  const rawFantasy = useLocalStorageValue(FANTASY_LINEUP_STORAGE_KEY);
  const hasChatted = useLocalStorageValue(HAS_CHATTED_KEY) === "true";
  const hasAddedCalendarEvent = useLocalStorageValue(HAS_ADDED_CALENDAR_EVENT_KEY) === "true";
  const pool = useMemo(() => getAfricanPlayers(), []);

  const unlocked = useMemo(
    () => computeUnlockedBadgeIds(rawProfile, rawFantasy, hasChatted, hasAddedCalendarEvent, pool),
    [rawProfile, rawFantasy, hasChatted, hasAddedCalendarEvent, pool]
  );

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Badges</h2>
        <span className="text-xs font-semibold tabular-nums text-accent">
          {unlocked.size}/{BADGES.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {BADGES.map((badge) => {
          const isUnlocked = unlocked.has(badge.id);
          return (
            <div
              key={badge.id}
              title={badge.description}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center",
                isUnlocked ? "border-accent bg-accent/10" : "border-border bg-surface opacity-50"
              )}
            >
              <span className={cn("text-2xl", !isUnlocked && "grayscale")} aria-hidden>
                {badge.emoji}
              </span>
              <span className="text-[11px] font-semibold leading-tight text-foreground">{badge.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
