"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { MatchCompactList } from "@/components/profile/match-compact-list";
import type { TeamDetail } from "@/types";

// See player-profile-view.tsx's identical helper for why this isn't
// components/ui/section-header.tsx's SectionHeader (that one is a
// page-level h1, wrong for 3-4 stacked sub-sections on one page).
function Subheading({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div className="mb-2">
      <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h2>
      {subtitle && <p className="text-[11px] text-muted/70">{subtitle}</p>}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-surface-2 px-2 py-3 text-center">
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}

export function TeamProfileView({ team, backHref }: { team: TeamDetail; backHref: string }) {
  const t = useTranslations("search.team");

  return (
    <div>
      <Link
        href={backHref}
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        {t("back")}
      </Link>

      <Card className="mb-6 flex items-center gap-4">
        <Image src={team.logo} alt="" width={64} height={64} className="size-16 shrink-0 object-contain" unoptimized />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-xl font-bold text-foreground">{team.name}</h1>
          <p className="mt-0.5 truncate text-sm text-muted">{team.type === "national" ? team.country : team.leagueName}</p>
        </div>
      </Card>

      <div className="mb-6">
        <Subheading title={t("recentMatches")} />
        <MatchCompactList matches={team.recentMatches} backHref={`/equipe/${team.id}`} emptyLabel={t("noRecentMatches")} />
      </div>

      <div className="mb-6">
        <Subheading title={t("upcomingMatches")} />
        <MatchCompactList matches={team.upcomingMatches} backHref={`/equipe/${team.id}`} emptyLabel={t("noUpcomingMatches")} />
      </div>

      {team.type === "club" ? (
        <div>
          <Subheading title={t("standing")} subtitle={team.standing?.leagueName} />
          {team.standing ? (
            <div className="grid grid-cols-4 gap-2">
              <StatCell label={t("rank")} value={`#${team.standing.rank}`} />
              <StatCell label={t("points")} value={team.standing.points} />
              <StatCell label={t("played")} value={team.standing.played} />
              <StatCell label={t("diff")} value={team.standing.goalsDiff > 0 ? `+${team.standing.goalsDiff}` : team.standing.goalsDiff} />
              <StatCell label={t("won")} value={team.standing.won} />
              <StatCell label={t("drawn")} value={team.standing.drawn} />
              <StatCell label={t("lost")} value={team.standing.lost} />
              <StatCell label={t("goalsFor")} value={`${team.standing.goalsFor}-${team.standing.goalsAgainst}`} />
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
              {t("noStanding")}
            </p>
          )}
        </div>
      ) : (
        <div>
          <Subheading title={t("fifaRanking")} />
          {team.fifaRanking ? (
            <div className="grid grid-cols-3 gap-2">
              <StatCell label={t("worldRank")} value={`#${team.fifaRanking.worldRank}`} />
              <StatCell label={t("africanRank")} value={`#${team.fifaRanking.africanRank}`} />
              <StatCell label={t("points")} value={team.fifaRanking.points} />
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
              {t("noFifaRanking")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
