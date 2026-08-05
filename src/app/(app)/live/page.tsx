import { COMPETITIONS, LIGUE1_SENEGAL_ID } from "@/lib/api-football";
import { LiveView } from "@/components/live/live-view";
import { getMatches, getStandings } from "@/lib/data/live";

// Server Component: the only place allowed to hit API-Football (via
// lib/data/live.ts) — the key never reaches the client. Interactive
// tab-switching lives in LiveView, which just receives the fetched data.
// Competition switching is a plain ?league= search param (not client
// state) so each pick is its own server render with fresh cached data.
export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const { league } = await searchParams;
  const leagueId = COMPETITIONS.some((c) => c.id === Number(league)) ? Number(league) : LIGUE1_SENEGAL_ID;

  const [matches, standingsResult] = await Promise.all([getMatches(leagueId), getStandings(leagueId)]);

  return (
    <LiveView
      competitions={COMPETITIONS}
      activeLeagueId={leagueId}
      matches={matches}
      standingsRows={standingsResult.rows}
      standingsSeason={standingsResult.season}
      standingsSource={standingsResult.source}
    />
  );
}
