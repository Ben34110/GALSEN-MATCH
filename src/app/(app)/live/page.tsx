import { LiveView } from "@/components/live/live-view";
import { getMatches, getStandings } from "@/lib/data/live";

// Server Component: the only place allowed to hit API-Football (via
// lib/data/live.ts) — the key never reaches the client. Interactive
// tab-switching lives in LiveView, which just receives the fetched data.
export default async function LivePage() {
  const [matches, standingsResult] = await Promise.all([getMatches(), getStandings()]);

  return (
    <LiveView
      matches={matches}
      standingsRows={standingsResult.rows}
      standingsSeason={standingsResult.season}
      standingsSource={standingsResult.source}
    />
  );
}
