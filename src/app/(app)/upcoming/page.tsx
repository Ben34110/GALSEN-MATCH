import { UpcomingEventsView } from "@/components/upcoming/upcoming-events-view";
import { SectionHeader } from "@/components/ui/section-header";
import { FifaRankingTable } from "@/components/upcoming/fifa-ranking-table";
import { CanQualifiersSection } from "@/components/upcoming/can-qualifiers-section";
import { getFifaRanking } from "@/lib/data/fifa-ranking";
import { getCanQualifiersFixtures, getCanQualifiersStandings } from "@/lib/data/can-qualifiers";

export default async function UpcomingPage() {
  const [fifaRanking, canFixtures, canGroups] = await Promise.all([
    getFifaRanking(),
    getCanQualifiersFixtures(),
    getCanQualifiersStandings(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <UpcomingEventsView />
      <div>
        <SectionHeader
          eyebrow="Sélections"
          title="Classement FIFA"
          subtitle="Rang africain et mondial, points, et progression depuis le mois précédent."
        />
        <FifaRankingTable rows={fifaRanking} />
      </div>
      <CanQualifiersSection fixtures={canFixtures} groups={canGroups} />
    </div>
  );
}
