"use client";

import { useTranslations } from "next-intl";
import { Globe2, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAfricanNationByNationality } from "@/lib/data/african-nations";
import type { FifaRankingRow } from "@/types";

function MovementIndicator({ row }: { row: FifaRankingRow }) {
  if (row.movement === "same") {
    return (
      <span className="flex items-center justify-end gap-1 text-muted">
        <Minus size={13} aria-hidden />
        <span className="tabular-nums">=</span>
      </span>
    );
  }
  const isUp = row.movement === "up";
  return (
    <span className={cn("flex items-center justify-end gap-1", isUp ? "text-accent" : "text-accent-3")}>
      {isUp ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />}
      <span className="tabular-nums">
        {isUp ? "+" : "-"}
        {row.placesMoved}
      </span>
    </span>
  );
}

// Adapted from the recovered standings-table.tsx (table-fixed + colgroup +
// tabular-nums + sr-only caption keep a dense grid readable on a phone
// with no horizontal scroll). `+/-` shows rank movement (places gained/
// lost since last month), not the points delta — matches what was
// literally requested ("progression de places par rapport au mois
// précédent"), even though the scraped data also carries a points delta.
export function FifaRankingTable({ rows }: { rows: FifaRankingRow[] }) {
  const t = useTranslations("upcoming.fifaRanking");
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <caption className="sr-only">{t("caption")}</caption>
          <colgroup>
            <col className="w-8" />
            <col />
            <col className="w-12" />
            <col className="w-16" />
            <col className="w-14" />
          </colgroup>
          <thead>
            <tr className="bg-surface-2 text-[10px] uppercase tracking-wide text-muted">
              <th scope="col" className="py-2 pl-2 text-left font-semibold">
                {t("columns.rank")}
              </th>
              <th scope="col" className="py-2 pl-1.5 text-left font-semibold">
                {t("columns.country")}
              </th>
              <th scope="col" className="py-2 text-center font-semibold">
                {t("columns.world")}
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                {t("columns.points")}
              </th>
              <th scope="col" className="py-2 pr-2 text-right font-semibold">
                {t("columns.trend")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const nation = getAfricanNationByNationality(row.country);
              return (
                <tr key={row.country} className="border-t border-border bg-surface transition-colors hover:bg-surface-2">
                  <td className="py-2 pl-2 tabular-nums text-muted">{row.africanRank}</td>
                  <td className="py-2 pl-1.5 pr-1 font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      {nation ? (
                        <span className="shrink-0 text-base leading-none" aria-hidden>
                          {nation.flag}
                        </span>
                      ) : (
                        <Globe2 size={14} className="shrink-0 text-muted" aria-hidden />
                      )}
                      <span className="truncate">{nation?.label ?? row.country}</span>
                    </span>
                  </td>
                  <td className="py-2 text-center text-xs tabular-nums text-muted">{row.worldRank}</td>
                  <td className="py-2 text-right tabular-nums font-extrabold text-accent">{row.points.toFixed(2)}</td>
                  <td className="py-2 pr-2 text-right text-xs">
                    <MovementIndicator row={row} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
