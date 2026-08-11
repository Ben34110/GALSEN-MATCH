"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchMyLeaderboardStanding, type MyLeaderboardStanding } from "@/app/(app)/live/actions";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { cn } from "@/lib/utils";

// Points + rank for one journée, shared by the Actu home card and the
// Fantasy XI page. Polls every 45s (same cadence as pitch-view.tsx's live
// rating refresh, and for the same reason: points are computed live from
// each squad's per-player ratings, not stored, so re-fetching on an
// interval is what "the ranking updates after a match ends" actually
// means here) — renders nothing while loading or when there's nothing to
// show (no synced squad for this journée yet), rather than a loading
// skeleton, so it never displaces surrounding layout.
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
  const [standing, setStanding] = useState<MyLeaderboardStanding | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetchMyLeaderboardStanding(getOrCreateDeviceId(), journee).then((result) => {
        if (!cancelled) setStanding(result);
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
