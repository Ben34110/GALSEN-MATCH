"use client";

import { useEffect, useMemo } from "react";
import { fetchMyLeaderboardStanding } from "@/app/(app)/live/actions";
import { useFantasyStorage } from "@/hooks/use-saved-lineup";
import { getGameweekInfo } from "@/lib/fantasy-gameweek";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { standingCache } from "@/lib/standing-cache";

// Warms the same cache MyJourneeStanding reads from (lib/standing-
// cache.ts) as soon as the app opens, for the active journée — same
// reasoning as fantasy-ratings-prefetch.tsx's per-player prefetch: by the
// time the player actually looks at Actu or Fantasy XI, the "X points ·
// #Y" badge is usually already warm instead of blank for a beat. No
// loading UI of its own; renders nothing, mounted once app-wide (see
// components/onboarding/onboarding-gate.tsx).
export function MyStandingPrefetch() {
  const storage = useFantasyStorage();
  const { activeJournee } = useMemo(() => getGameweekInfo(), []);
  const locked = storage[activeJournee]?.locked ?? false;

  useEffect(() => {
    if (!locked) return;
    fetchMyLeaderboardStanding(getOrCreateDeviceId(), activeJournee).then((result) => {
      if (result) standingCache.set(activeJournee, result);
    });
  }, [locked, activeJournee]);

  return null;
}
