import { UpcomingEventsView } from "@/components/upcoming/upcoming-events-view";
import { SectionHeader } from "@/components/ui/section-header";
import { FifaRankingTable } from "@/components/upcoming/fifa-ranking-table";
import { CanQualifiersSection } from "@/components/upcoming/can-qualifiers-section";
import { getFifaRanking } from "@/lib/data/fifa-ranking";
import { getCanQualifiersFixtures, getCanQualifiersStandings } from "@/lib/data/can-qualifiers";

const FRENCH_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

// `rankingDate` is a plain calendar date ("2026-07-20"), not an instant —
// parsing it with `new Date(iso)` and formatting via toLocaleDateString
// would round-trip through UTC-then-local-timezone conversion and can
// silently roll the displayed month back a day (same class of bug fixed
// in scripts/sync-fifa-ranking.mjs's own date parsing). Reading the
// year/month straight out of the string sidesteps timezones entirely.
function formatRankingMonth(iso: string): string {
  const [year, month] = iso.split("-");
  return `${FRENCH_MONTHS[Number(month) - 1]} ${year}`;
}

export default async function UpcomingPage() {
  const [fifaRanking, canFixturesResult, canStandingsResult] = await Promise.all([
    getFifaRanking(),
    getCanQualifiersFixtures(),
    getCanQualifiersStandings(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <SectionHeader
          eyebrow="Sélections"
          title="Classement FIFA"
          subtitle={`Classement de ${formatRankingMonth(fifaRanking.rankingDate)} — rang africain et mondial, points, et progression depuis le mois précédent.`}
        />
        <FifaRankingTable rows={fifaRanking.rows} />
      </div>
      <CanQualifiersSection
        fixtures={canFixturesResult.fixtures}
        fixturesError={canFixturesResult.error}
        groups={canStandingsResult.groups}
        groupsError={canStandingsResult.error}
      />
      <UpcomingEventsView />
    </div>
  );
}
