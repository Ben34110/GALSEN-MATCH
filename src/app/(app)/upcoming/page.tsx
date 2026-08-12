import { UpcomingTabs } from "@/components/upcoming/upcoming-tabs";
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
    <UpcomingTabs
      fifaRanking={fifaRanking}
      canFixtures={canFixturesResult.fixtures}
      canFixturesError={canFixturesResult.error}
      canGroups={canStandingsResult.groups}
      canGroupsError={canStandingsResult.error}
      canGroupsProvisional={canStandingsResult.isProvisional}
      u17Fixtures={u17FixturesResult.fixtures}
      u17FixturesError={u17FixturesResult.error}
      u17Groups={u17StandingsResult.groups}
      u17GroupsError={u17StandingsResult.error}
      u17GroupsProvisional={u17StandingsResult.isProvisional}
    />
  );
}
