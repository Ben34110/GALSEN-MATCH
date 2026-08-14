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
export function FantasyLeaguesView({ journee }: { journee: number }) {
  const t = useTranslations("fantasy");

  return (
    <div>
      <Link
        href="/fantasy"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        {t("common.back")}
      </Link>

      <SectionHeader eyebrow={t("common.eyebrow")} title={t("leaderboard.titleLeague")} subtitle={t("leagues.pageSubtitle")} />

      <FriendLeaguePanel journee={journee} />
    </div>
  );
}
