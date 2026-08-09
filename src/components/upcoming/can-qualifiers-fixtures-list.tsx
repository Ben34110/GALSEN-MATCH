import Image from "next/image";
import { Card } from "@/components/ui/card";
import { formatKickoff } from "@/lib/utils";
import type { CanQualifierFixture } from "@/lib/data/can-qualifiers";

const ROUND_LABELS: Record<string, string> = {
  "Group Stage - 1": "1ère journée — 23 septembre 2026",
  "Group Stage - 2": "2e journée — 27 septembre 2026",
};

export function CanQualifiersFixturesList({
  fixtures,
  error,
}: {
  fixtures: CanQualifierFixture[];
  error: string | null;
}) {
  if (fixtures.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        Calendrier indisponible pour l&apos;instant.
        {error && <span className="mt-1 block text-xs text-muted/70">({error})</span>}
      </p>
    );
  }

  const rounds = Array.from(new Set(fixtures.map((fixture) => fixture.round)));

  return (
    <div className="flex flex-col gap-5">
      {rounds.map((round) => (
        <div key={round}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{ROUND_LABELS[round] ?? round}</h3>
          <div className="flex flex-col gap-2">
            {fixtures
              .filter((fixture) => fixture.round === round)
              .map((fixture) => (
                <Card key={fixture.id} className="flex items-center gap-3 p-3">
                  <div className="flex flex-1 items-center justify-end gap-2 text-right">
                    <span className="truncate text-sm font-semibold text-foreground">{fixture.homeTeam.name}</span>
                    <Image
                      src={fixture.homeTeam.logo}
                      alt=""
                      width={22}
                      height={22}
                      className="size-[22px] shrink-0 object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-muted">{formatKickoff(fixture.kickoffAt)}</span>
                  <div className="flex flex-1 items-center gap-2">
                    <Image
                      src={fixture.awayTeam.logo}
                      alt=""
                      width={22}
                      height={22}
                      className="size-[22px] shrink-0 object-contain"
                      unoptimized
                    />
                    <span className="truncate text-sm font-semibold text-foreground">{fixture.awayTeam.name}</span>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
