import { cn } from "@/lib/utils";
import { getTeamById } from "@/lib/mock/teams";
import type { StandingRow } from "@/types";

const QUALIFICATION_CUTOFF = 3;

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <caption className="sr-only">
            Classement Ligue 1 Sénégal — les trois premières équipes sont en zone de qualification.
          </caption>
          <thead>
            <tr className="bg-surface-2 text-[11px] uppercase tracking-wide text-muted">
              <th scope="col" className="px-3 py-2.5 text-left font-semibold">
                #
              </th>
              <th scope="col" className="px-3 py-2.5 text-left font-semibold">
                Équipe
              </th>
              <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                J
              </th>
              <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                V
              </th>
              <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                N
              </th>
              <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                D
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const team = getTeamById(row.teamId);
              const qualified = index < QUALIFICATION_CUTOFF;
              return (
                <tr
                  key={row.teamId}
                  className={cn(
                    "border-t border-border bg-surface transition-colors hover:bg-surface-2",
                    qualified && "border-l-2 border-l-accent-emerald"
                  )}
                >
                  <td className="px-3 py-2.5 tabular-nums text-muted">{index + 1}</td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{team?.name ?? "—"}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted">{row.played}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted">{row.won}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted">{row.drawn}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-muted">{row.lost}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-extrabold text-accent">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="flex items-center gap-1.5 border-t border-border bg-surface px-3 py-2 text-[11px] text-muted">
        <span className="inline-block h-2.5 w-1 rounded-full bg-accent-emerald" aria-hidden />
        Zone de qualification (top {QUALIFICATION_CUTOFF})
      </p>
    </div>
  );
}
