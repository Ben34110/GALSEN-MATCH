"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchMyLeaderboardStanding, type MyLeaderboardStanding } from "@/app/(app)/live/actions";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { standingCache } from "@/lib/standing-cache";
import { cn } from "@/lib/utils";

// Points + rank for one journée, shared by the Actu home card and the
// Fantasy XI page. Seeds instantly from the shared cache (lib/standing-
// cache.ts) if components/fantasy/my-standing-prefetch.tsx already warmed
// it in the background at app open — same reasoning as pitch-view.tsx's
// rating cache: without it, every mount started blank and re-paid the
// round trip right when the player was looking at the screen. Still polls
// every 45s (same cadence as the live rating refresh, and for the same
// reason: points are computed live from each squad's per-player ratings,
// not stored, so re-fetching on an interval is what "the ranking updates
// after a match ends" actually means here).
export function MyJourneeStanding({
  journee,
  fallback = null,
  className,
}: {
  journee: number;
  // Shown while loading, or once loaded if there's nothing to rank yet
  // (no synced squad for this journée) — callers that already render this
  // inside a fixed-shape badge (e.g. actu-page-client.tsx) want *some*
  // text there rather than a pill that's empty for a beat.
  fallback?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("fantasy.standing");
  const [standing, setStanding] = useState<MyLeaderboardStanding | null>(() => standingCache.get(journee) ?? null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetchMyLeaderboardStanding(getOrCreateDeviceId(), journee).then((result) => {
        if (result) standingCache.set(journee, result);
        // A transient null (leaderboard fetch failed this one time) keeps
        // showing the last known good value instead of blanking out.
        if (!cancelled) setStanding(result ?? standingCache.get(journee) ?? null);
      });
    }
    load();
    const interval = setInterval(load, 45_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [journee]);

  if (!standing) return fallback;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span>{t("points", { points: standing.points })}</span>
      <span aria-hidden>·</span>
      <span>{t("rankOf", { rank: standing.rank, total: standing.totalParticipants })}</span>
    </span>
  );
}
