"use server";

import { getUpcomingMatchesForTeam } from "@/lib/data/live";
import type { Match } from "@/types";

// Favorited teams live in localStorage (client-only), but fetching their
// fixtures needs the server-side API-Football client (API key). This
// Server Action is the bridge: FavoritesPanel (client) calls it directly
// per favorited team id.
export async function fetchTeamUpcomingMatches(teamId: number): Promise<Match[]> {
  return getUpcomingMatchesForTeam(teamId);
}
