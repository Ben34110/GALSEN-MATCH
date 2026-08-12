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

    function refresh() {
      for (const id of seatIds.split(",")) {
        const key = ratingCacheKey(Number(id), activeJournee);
        // "rated" is final — a finished match's rating never changes, so
        // it's the only status worth never re-fetching. Anything else
        // (missing entirely, "pending", "live") might still resolve
        // differently on a retry — skipping those here (the original bug:
        // this used to check ratingCache.has(key) alone, so a player whose
        // very first fetch landed as "pending" — kickoff hadn't happened
        // yet, or a transient hiccup — stayed stuck at "pending" for the
        // rest of the session, with nothing to ever correct it unless the
        // user happened to open Fantasy XI itself, where PitchView's own
        // interval does retry) is what let a real "rated" player look
        // like their note had vanished.
        if (ratingCache.get(key)?.status === "rated") continue;
        const player = pool.find((p) => String(p.id) === id);
        if (!player?.teamId) continue;
        fetchPlayerJourneeRating(player.id, player.teamId, start.toISOString(), end.toISOString())
          .then((result) => ratingCache.set(key, result))
          .catch(() => {});
      }
    }

    refresh();
    const interval = setInterval(refresh, 45_000);
    return () => clearInterval(interval);
  }, [locked, seatIds, activeJournee]);

  return null;
}
