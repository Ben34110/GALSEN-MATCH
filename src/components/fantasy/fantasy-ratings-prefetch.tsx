"use client";

import { useEffect, useMemo } from "react";
import { fetchPlayerJourneeRating } from "@/app/(app)/live/actions";
import { useFantasyStorage } from "@/hooks/use-saved-lineup";
import { getGameweekInfo, getJourneeWeekRange } from "@/lib/fantasy-gameweek";
import { getAfricanPlayers } from "@/lib/data/african-players";
import { ratingCache, ratingCacheKey } from "@/lib/fantasy-rating-cache";

// Warms the same cache PitchView reads from (lib/fantasy-rating-cache.ts)
// as soon as the app opens, for the active journée's locked squad — so
// navigating to Fantasy XI later in the session usually finds ratings
// already there instead of paying the couple-seconds round trip right
// when the player's looking at the screen. No loading UI of its own: this
// renders nothing, mounted once app-wide (see components/onboarding/
// onboarding-gate.tsx) instead of a blocking splash screen — the app
// deliberately has no startup splash, and forcing every single app open
// to wait on this fetch would be worse for the common case of a session
// that never even opens Fantasy XI.
export function FantasyRatingsPrefetch() {
  const storage = useFantasyStorage();
  const { activeJournee } = useMemo(() => getGameweekInfo(), []);
  const squad = storage[activeJournee];
  const locked = squad?.locked ?? false;
  const seatIds = squad
    ? Object.values(squad.seats)
        .filter((id): id is string => id !== null)
        .join(",")
    : "";

  useEffect(() => {
    if (!locked || !seatIds) return;
    const pool = getAfricanPlayers();
    const { start, end } = getJourneeWeekRange(activeJournee);

    for (const id of seatIds.split(",")) {
      const key = ratingCacheKey(Number(id), activeJournee);
      if (ratingCache.has(key)) continue;
      const player = pool.find((p) => String(p.id) === id);
      if (!player?.teamId) continue;
      fetchPlayerJourneeRating(player.id, player.teamId, start.toISOString(), end.toISOString())
        .then((result) => ratingCache.set(key, result))
        .catch(() => {});
    }
  }, [locked, seatIds, activeJournee]);

  return null;
}
