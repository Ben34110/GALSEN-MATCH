import Image from "next/image";
import type { CanQualifierGroup } from "@/lib/data/can-qualifiers";

// Three honest states, decided here (not in the data layer — see
// can-qualifiers.ts's comment on getCanQualifiersStandings): `groups===null`
// means the fetch itself failed/is unconfigured; a successful fetch where
// every row shows 0 played means the qualifiers genuinely haven't kicked off
// yet (first matchday is 2026-09-23) — that's not an error and shouldn't
// read as an empty table.
export function CanQualifiersStandings({ groups }: { groups: CanQualifierGroup[] | null }) {
  if (groups === null) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        Classement indisponible pour l&apos;instant.
      </p>
    );
  }

  const hasStarted = groups.some((group) => group.rows.some((row) => row.played > 0));
  if (!hasStarted) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        Les qualifications n&apos;ont pas encore commencé — rendez-vous le 23 septembre 2026.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.groupLabel} className="overflow-hidden rounded-2xl border border-border">
          <div className="bg-surface-2 px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted">
            {group.groupLabel}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <caption className="sr-only">Classement du {group.groupLabel} des qualifications CAN 2027.</caption>
              <colgroup>
                <col />
                <col className="w-10" />
                <col className="w-9" />
                <col className="w-9" />
                <col className="w-9" />
                <col className="w-9" />
                <col className="w-9" />
                <col className="w-9" />
                <col className="w-10" />
              </colgroup>
              <thead>
                <tr className="border-t border-border bg-surface text-[10px] uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pl-2 text-left font-semibold">
                    Équipe
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    Pts
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    J
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    G
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    N
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    P
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    BP
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    BC
                  </th>
                  <th scope="col" className="py-2 pr-2 text-right font-semibold">
                    Diff
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
                        <span className="truncate">{row.teamName}</span>
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums font-extrabold text-accent">{row.points}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.played}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.won}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.drawn}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.lost}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.goalsFor}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.goalsAgainst}</td>
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
