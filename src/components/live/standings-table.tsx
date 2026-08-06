import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getTeamById } from "@/lib/mock/teams";
import type { StandingRow } from "@/types";

// API-Football's standings rows carry a free-text "description" per zone
// (e.g. "Promotion - CAF Champions League (Qualification)", "Relegation -
// Ligue 2") — see StandingRow.zone. Rather than hardcoding each league's own
// qualification rules (different every competition, and wrong the moment a
// league restructures), the zone text itself is read to pick a color:
// relegation is always red, a Champions-League-level spot is always green
// (the strongest continental prize), anything else (Europa/Confederation
// Cup, playoffs, a lower-division promotion zone, ...) is gold. The legend
// below is built from whatever zones are actually present in these rows.
function zoneColor(zone: string): { border: string; tint: string; dot: string } {
  const z = zone.toLowerCase();
  if (z.includes("relegation")) return { border: "border-l-accent-3", tint: "bg-accent-3/5", dot: "bg-accent-3" };
  if (z.includes("champions league")) return { border: "border-l-accent", tint: "bg-accent/5", dot: "bg-accent" };
  return { border: "border-l-accent-2", tint: "bg-accent-2/5", dot: "bg-accent-2" };
}

function zoneLabel(zone: string): string {
  if (/^relegation$/i.test(zone)) return "Relégation";
  if (/^relegation - /i.test(zone)) return `Relégation — ${zone.slice("relegation - ".length)}`;
  if (/^promotion - /i.test(zone)) return zone.slice("promotion - ".length);
  return zone;
}

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  const zones = Array.from(new Set(rows.map((row) => row.zone).filter((zone): zone is string => Boolean(zone))));

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {/* table-fixed + narrow fixed-width numeric columns: the whole grid
          fits a phone's width with no horizontal scroll needed — overflow-x
          stays only as a safety net for unusually narrow viewports. */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <caption className="sr-only">
            Classement — les lignes colorées à gauche et teintées indiquent une zone de qualification ou de
            relégation ; les lignes neutres ne jouent rien.
          </caption>
          <colgroup>
            <col className="w-6" />
            <col />
            <col className="w-6" />
            <col className="w-6" />
            <col className="w-6" />
            <col className="w-6" />
            <col className="w-9" />
          </colgroup>
          <thead>
            <tr className="bg-surface-2 text-[10px] uppercase tracking-wide text-muted">
              <th scope="col" className="py-2 pl-2 text-left font-semibold">
                #
              </th>
              <th scope="col" className="py-2 pl-1.5 text-left font-semibold">
                Équipe
              </th>
              <th scope="col" className="py-2 text-center font-semibold">
                J
              </th>
              <th scope="col" className="py-2 text-center font-semibold">
                V
              </th>
              <th scope="col" className="py-2 text-center font-semibold">
                N
              </th>
              <th scope="col" className="py-2 text-center font-semibold">
                D
              </th>
              <th scope="col" className="py-2 pr-2 text-right font-semibold">
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const mockTeam = row.team ? undefined : getTeamById(row.teamId);
              const name = row.team?.name ?? mockTeam?.name ?? "—";
              const logo = row.team?.logo ?? mockTeam?.logo;
              const color = row.zone ? zoneColor(row.zone) : null;
              return (
                <tr
                  key={row.teamId}
                  className={cn(
                    "border-t border-border transition-colors hover:bg-surface-2",
                    color ? `border-l-2 ${color.border} ${color.tint}` : "bg-surface"
                  )}
                >
                  <td className="py-2 pl-2 tabular-nums text-muted">{index + 1}</td>
                  <td className="py-2 pl-1.5 pr-1 font-semibold text-foreground">
                    {row.team ? (
                      <Link
                        href={`/live/team/${row.team.id}`}
                        className="flex items-center gap-1.5 transition-colors hover:text-accent"
                      >
                        {logo ? (
                          <Image src={logo} alt="" width={18} height={18} className="size-[18px] shrink-0 object-contain" unoptimized />
                        ) : (
                          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-surface-2 text-[8px] font-bold text-muted">
                            ?
                          </span>
                        )}
                        <span className="truncate">{name}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {logo ? (
                          <Image src={logo} alt="" width={18} height={18} className="size-[18px] shrink-0 object-contain" unoptimized />
                        ) : (
                          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-surface-2 text-[8px] font-bold text-muted">
                            {mockTeam?.logoInitials ?? "?"}
                          </span>
                        )}
                        <span className="truncate">{name}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 text-center text-xs tabular-nums text-muted">{row.played}</td>
                  <td className="py-2 text-center text-xs tabular-nums text-muted">{row.won}</td>
                  <td className="py-2 text-center text-xs tabular-nums text-muted">{row.drawn}</td>
                  <td className="py-2 text-center text-xs tabular-nums text-muted">{row.lost}</td>
                  <td className="py-2 pr-2 text-right tabular-nums font-extrabold text-accent">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {zones.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-border bg-surface px-3 py-2.5">
          {zones.map((zone) => (
            <p key={zone} className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className={cn("inline-block h-2.5 w-1 shrink-0 rounded-full", zoneColor(zone).dot)} aria-hidden />
              {zoneLabel(zone)}
            </p>
          ))}
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="inline-block h-2.5 w-1 shrink-0 rounded-full bg-border" aria-hidden />
            Aucun enjeu
          </p>
        </div>
      )}
    </div>
  );
}
