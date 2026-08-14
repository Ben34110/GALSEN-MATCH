"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { formatKickoff, cn } from "@/lib/utils";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { getAfricanNation, nationTeamId } from "@/lib/data/african-nations";
import { MatchFavoriteButton } from "@/components/upcoming/match-favorite-button";
import { TeamFlagOrCrest } from "@/components/upcoming/team-flag-or-crest";
import type { U17WorldCupFixture } from "@/lib/data/u17-world-cup";

export function U17WorldCupFixturesList({ fixtures, error }: { fixtures: U17WorldCupFixture[]; error: string | null }) {
  const t = useTranslations("upcoming.u17WorldCup");
  const roundLabels: Record<string, string> = {
    "Group Stage - 1": t("rounds.group1"),
    "Group Stage - 2": t("rounds.group2"),
  };

  // Unlike the CAN qualifiers (all-African), this is a global field — still
  // worth highlighting the visitor's own country's match the same way,
  // for whichever African nation they follow if it made the tournament.
  const profile = useOnboardingProfile();
  const userTeamId = profile ? nationTeamId(getAfricanNation(profile.countryId)) : null;

  if (fixtures.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        {t("fixtures.unavailable")}
        {error && <span className="mt-1 block text-xs text-muted/70">({error})</span>}
      </p>
    );
  }

  const rounds = Array.from(new Set(fixtures.map((fixture) => fixture.round)));

  return (
    <div className="flex flex-col gap-5">
      {rounds.map((round) => (
        <div key={round}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{roundLabels[round] ?? round}</h3>
          <div className="flex flex-col gap-2">
            {fixtures
              .filter((fixture) => fixture.round === round)
              .map((fixture) => {
                const isUserMatch =
                  userTeamId != null && (fixture.homeTeam.id === userTeamId || fixture.awayTeam.id === userTeamId);
                const matchLabel = `${fixture.homeTeam.name} - ${fixture.awayTeam.name}`;

                return (
                  <Card
                    key={fixture.id}
                    interactive
                    className={cn(
                      "flex items-center gap-2 p-3",
                      isUserMatch && "border-accent bg-accent/5 ring-1 ring-inset ring-accent/30"
                    )}
                  >
                    <Link href={`/live/match/${fixture.id}?from=/upcoming`} className="flex flex-1 items-center gap-3">
                      <div className="flex flex-1 items-center justify-end gap-2 text-right">
                        <span className="truncate text-sm font-semibold text-foreground">{fixture.homeTeam.name}</span>
                        <TeamFlagOrCrest name={fixture.homeTeam.name} logo={fixture.homeTeam.logo} size={22} />
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-muted">
                        {formatKickoff(fixture.kickoffAt)}
                      </span>
                      <div className="flex flex-1 items-center gap-2">
                        <TeamFlagOrCrest name={fixture.awayTeam.name} logo={fixture.awayTeam.logo} size={22} />
                        <span className="truncate text-sm font-semibold text-foreground">{fixture.awayTeam.name}</span>
                      </div>
                    </Link>
                    <MatchFavoriteButton fixtureId={fixture.id} matchLabel={matchLabel} />
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
