import { UpcomingEventsView } from "@/components/upcoming/upcoming-events-view";
import { FifaRankingSection } from "@/components/upcoming/fifa-ranking-section";
import { CanQualifiersSection } from "@/components/upcoming/can-qualifiers-section";
import { U17WorldCupSection } from "@/components/upcoming/u17-world-cup-section";
import { getFifaRanking } from "@/lib/data/fifa-ranking";
import { getCanQualifiersFixtures, getCanQualifiersStandings } from "@/lib/data/can-qualifiers";
import { getU17WorldCupFixtures, getU17WorldCupStandings } from "@/lib/data/u17-world-cup";

export default async function UpcomingPage() {
  const [fifaRanking, canFixturesResult, canStandingsResult, u17FixturesResult, u17StandingsResult] = await Promise.all([
    getFifaRanking(),
    getCanQualifiersFixtures(),
    getCanQualifiersStandings(),
    getU17WorldCupFixtures(),
    getU17WorldCupStandings(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <FifaRankingSection rows={fifaRanking.rows} rankingDate={fifaRanking.rankingDate} />
      <CanQualifiersSection
        fixtures={canFixturesResult.fixtures}
        fixturesError={canFixturesResult.error}
        groups={canStandingsResult.groups}
        groupsError={canStandingsResult.error}
        groupsProvisional={canStandingsResult.isProvisional}
      />
      <U17WorldCupSection
        fixtures={u17FixturesResult.fixtures}
        fixturesError={u17FixturesResult.error}
        groups={u17StandingsResult.groups}
        groupsError={u17StandingsResult.error}
        groupsProvisional={u17StandingsResult.isProvisional}
      />
      <UpcomingEventsView />
    </div>
  );
}
