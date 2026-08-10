"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocalStorageValue } from "@/hooks/use-local-storage-value";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";
import { FANTASY_LINEUP_STORAGE_KEY } from "@/lib/fantasy-lineup";
import { BADGES, HAS_ADDED_CALENDAR_EVENT_KEY, HAS_CHATTED_KEY, computeUnlockedBadgeIds, type Badge } from "@/lib/badges";
import { getAfricanPlayers } from "@/lib/data/african-players";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { checkTopWeeklyRankRecord } from "@/app/actions/fantasy-records";
import { BadgeDetailSheet } from "@/components/profil/badge-detail-sheet";

export function BadgesSection() {
  const rawProfile = useLocalStorageValue(ONBOARDING_STORAGE_KEY);
  const rawFantasy = useLocalStorageValue(FANTASY_LINEUP_STORAGE_KEY);
  const hasChatted = useLocalStorageValue(HAS_CHATTED_KEY) === "true";
  const hasAddedCalendarEvent = useLocalStorageValue(HAS_ADDED_CALENDAR_EVENT_KEY) === "true";
  const pool = useMemo(() => getAfricanPlayers(), []);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // The one badge that isn't derivable from localStorage alone — it needs
  // every past journée's leaderboard (see app/actions/fantasy-records.ts) —
  // so it's fetched once on mount and merged into the otherwise-synchronous
  // unlocked set below, instead of computeUnlockedBadgeIds needing to
  // become async itself for this one case.
  const [hasTopWeeklyRank, setHasTopWeeklyRank] = useState(false);
  useEffect(() => {
    checkTopWeeklyRankRecord(getOrCreateDeviceId()).then(setHasTopWeeklyRank);
  }, []);

  const unlocked = useMemo(() => {
    const set = computeUnlockedBadgeIds(rawProfile, rawFantasy, hasChatted, hasAddedCalendarEvent, pool);
    if (hasTopWeeklyRank) set.add("top-semaine");
    return set;
  }, [rawProfile, rawFantasy, hasChatted, hasAddedCalendarEvent, pool, hasTopWeeklyRank]);

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
            <button
              key={badge.id}
              type="button"
              onClick={() => setSelectedBadge(badge)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-transform duration-[var(--duration-fast)] active:scale-95",
                isUnlocked ? "border-accent bg-accent/10" : "border-border bg-surface opacity-50"
              )}
            >
              <span className={cn("text-2xl", !isUnlocked && "grayscale")} aria-hidden>
                {badge.emoji}
              </span>
              <span className="text-[11px] font-semibold leading-tight text-foreground">{badge.label}</span>
            </button>
          );
        })}
      </div>

      {selectedBadge && (
        <BadgeDetailSheet badge={selectedBadge} unlocked={unlocked.has(selectedBadge.id)} onClose={() => setSelectedBadge(null)} />
      )}
    </section>
  );
}
