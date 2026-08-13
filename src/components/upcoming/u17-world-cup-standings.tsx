"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { U17WorldCupGroup } from "@/lib/data/u17-world-cup";

// Same two-state pattern as can-qualifiers-standings.tsx: `groups===null`
// means the fetch itself failed/is unconfigured. Otherwise the table always
// renders, even pre-tournament — `isProvisional` (0-point rows built from
// the fixture pairings) just adds a note above it instead of hiding the
// groups behind a placeholder message.
export function U17WorldCupStandings({
  groups,
  error,
  isProvisional,
}: {
  groups: U17WorldCupGroup[] | null;
  error: string | null;
  isProvisional: boolean;
}) {
  const t = useTranslations("upcoming.u17WorldCup.standings");
  if (groups === null) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        {t("unavailable")}
        {error && <span className="mt-1 block text-xs text-muted/70">({error})</span>}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {isProvisional && <p className="text-xs text-muted">{t("provisionalNote")}</p>}
      {groups.map((group) => (
        <div key={group.groupLabel} className="overflow-hidden rounded-2xl border border-border">
          <div className="bg-surface-2 px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted">
            {group.groupLabel}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <caption className="sr-only">{t("caption", { group: group.groupLabel })}</caption>
              <colgroup>
                <col />
                <col className="w-10" />
                <col className="w-9" />
                <col className="w-9" />
                <col className="w-9" />
                <col className="w-9" />
                <col className="w-10" />
              </colgroup>
              <thead>
                <tr className="border-t border-border bg-surface text-[10px] uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pl-2 text-left font-semibold">
                    {t("columns.team")}
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    {t("columns.points")}
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    {t("columns.played")}
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    {t("columns.won")}
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    {t("columns.drawn")}
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    {t("columns.lost")}
                  </th>
                  <th scope="col" className="py-2 pr-2 text-right font-semibold">
                    {t("columns.diff")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.teamId} className="border-t border-border bg-surface transition-colors hover:bg-surface-2">
                    <td className="py-2 pl-2 pr-1 font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Image
                          src={row.teamLogo}
                          alt=""
                          width={18}
                          height={18}
                          className="size-[18px] shrink-0 object-contain"
                          unoptimized
                        />
                        <span className="min-w-0">{row.teamName}</span>
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums font-extrabold text-accent">{row.points}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.played}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.won}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.drawn}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.lost}</td>
                    <td className="py-2 pr-2 text-right tabular-nums font-semibold text-foreground">
                      {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
