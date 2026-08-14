"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { FriendLeaguePanel } from "@/components/fantasy/friend-league-panel";

// Thin client wrapper around FriendLeaguePanel — page.tsx can't call
// useTranslations itself (locale is a client-only localStorage value, see
// components/theme/locale-provider.tsx), same split every other Fantasy
// page already has (e.g. ballon-dor-view.tsx).
//
// Same fixed-height shell as app/(app)/chat/page.tsx (identical calc,
// tied to main's own top/bottom padding — see that file's comment): the
// back link and header take their natural height, FriendLeaguePanel gets
// whatever's left via flex-1/min-h-0, so only its own content region
// scrolls (leaderboard rows, or the league chat's message log) instead of
// the whole page moving underneath the fixed nav/header.
export function FantasyLeaguesView({ journee }: { journee: number }) {
  const t = useTranslations("fantasy");

  return (
    <div className="flex h-[calc(100dvh-7.25rem-var(--safe-top)-var(--safe-bottom))] flex-col lg:h-[calc(100dvh-7rem)]">
      <Link
        href="/fantasy"
        className="mb-4 inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        {t("common.back")}
      </Link>

      <div className="shrink-0">
        <SectionHeader eyebrow={t("common.eyebrow")} title={t("leaderboard.titleLeague")} subtitle={t("leagues.pageSubtitle")} />
      </div>

      <div className="min-h-0 flex-1">
        <FriendLeaguePanel journee={journee} />
      </div>
    </div>
  );
}
