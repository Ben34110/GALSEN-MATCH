"use server";

import { getUpcomingMatchesForTeam } from "@/lib/data/live";
import type { Match } from "@/types";

// Favorited teams/players and Fantasy squads live in localStorage
// (client-only), but fetching a club's fixtures needs the server-side
// API-Football client (API key). This Server Action is the bridge — called
// directly by the Fantasy player picker/pitch view (a player's opponent
// this week) and the club notification-prefs panel, per team id.
export async function fetchTeamUpcomingMatches(teamId: number): Promise<Match[]> {
  return getUpcomingMatchesForTeam(teamId);
}
