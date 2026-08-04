import { getTeamById } from "@/lib/mock/teams";
import type { StandingRow } from "@/types";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-2 text-[11px] uppercase tracking-wide text-muted">
            <th className="px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">Équipe</th>
            <th className="px-2 py-2 text-center font-semibold">J</th>
            <th className="px-2 py-2 text-center font-semibold">V</th>
            <th className="px-2 py-2 text-center font-semibold">N</th>
            <th className="px-2 py-2 text-center font-semibold">D</th>
            <th className="px-3 py-2 text-right font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const team = getTeamById(row.teamId);
            return (
              <tr key={row.teamId} className="border-t border-border bg-surface">
                <td className="px-3 py-2 tabular-nums text-muted">{index + 1}</td>
                <td className="px-3 py-2 font-semibold text-foreground">{team?.name ?? "—"}</td>
                <td className="px-2 py-2 text-center tabular-nums text-muted">{row.played}</td>
                <td className="px-2 py-2 text-center tabular-nums text-muted">{row.won}</td>
                <td className="px-2 py-2 text-center tabular-nums text-muted">{row.drawn}</td>
                <td className="px-2 py-2 text-center tabular-nums text-muted">{row.lost}</td>
                <td className="px-3 py-2 text-right tabular-nums font-extrabold text-accent">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
