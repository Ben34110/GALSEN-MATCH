"use client";

import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { FifaRankingTable } from "@/components/upcoming/fifa-ranking-table";
import type { FifaRankingRow } from "@/types";

// `rankingDate` is a plain calendar date ("2026-07-20"), not an instant —
// parsing it with `new Date(iso)` and formatting via toLocaleDateString
// would round-trip through UTC-then-local-timezone conversion and can
// silently roll the displayed month back a day (same class of bug fixed
// in scripts/sync-fifa-ranking.mjs's own date parsing). Reading the
// year/month straight out of the string sidesteps timezones entirely.
function formatRankingMonth(iso: string, months: string[]): string {
  const [year, month] = iso.split("-");
  return `${months[Number(month) - 1]} ${year}`;
}

// Wraps the FIFA ranking header + table for the Server Component page (see
// app/(app)/upcoming/page.tsx) — the page itself can't call useTranslations
// (locale is a client-only localStorage value), so the translated header
// text and the table below it live here instead, same split as
// CanQualifiersSection for the section next to it.
export function FifaRankingSection({ rows, rankingDate }: { rows: FifaRankingRow[]; rankingDate: string }) {
  const t = useTranslations("upcoming.fifaRanking");
  const months = t.raw("months") as string[];

  return (
    <div>
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle", { month: formatRankingMonth(rankingDate, months) })}
      />
      <FifaRankingTable rows={rows} />
    </div>
  );
}
