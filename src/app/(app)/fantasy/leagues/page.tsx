import { FantasyLeaguesView } from "@/components/fantasy/fantasy-leagues-view";
import { getGameweekInfo } from "@/lib/fantasy-gameweek";

// A dedicated, one-tap-from-the-hub home for friend leagues (see
// app/(app)/fantasy/page.tsx's GAMES list) — leagues used to only be
// reachable as a buried third tab on /fantasy/xi/leaderboard, which is why
// this exists as its own route now instead.
export default async function FantasyLeaguesPage() {
  const { activeJournee } = getGameweekInfo();
  return <FantasyLeaguesView journee={activeJournee} />;
}
