import { UpcomingEventsView } from "@/components/upcoming/upcoming-events-view";
import { FifaRankingSection } from "@/components/upcoming/fifa-ranking-section";
import { CanQualifiersSection } from "@/components/upcoming/can-qualifiers-section";
import { getFifaRanking } from "@/lib/data/fifa-ranking";
import { getCanQualifiersFixtures, getCanQualifiersStandings } from "@/lib/data/can-qualifiers";

export default async function UpcomingPage() {
  const [fifaRanking, canFixturesResult, canStandingsResult] = await Promise.all([
    getFifaRanking(),
    getCanQualifiersFixtures(),
    getCanQualifiersStandings(),
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
      <UpcomingEventsView />
    </div>
  );
}
