"use server";

import { getUpcomingMatchesForTeam } from "@/lib/data/live";
import { getPlayerJourneeRating, type PlayerJourneeRating } from "@/lib/data/fantasy-ratings";
import { getLeaderboard } from "@/lib/data/fantasy-leaderboard";
import { resolveActor } from "@/lib/auth";
import type { Match } from "@/types";

// Favorited teams/players and Fantasy squads live in localStorage
// (client-only), but fetching a club's fixtures needs the server-side
// API-Football client (API key). This Server Action is the bridge — called
// directly by the Fantasy player picker/pitch view (a player's opponent
// this week) and the club notification-prefs panel, per team id.
export async function fetchTeamUpcomingMatches(teamId: number): Promise<Match[]> {
  return getUpcomingMatchesForTeam(teamId);
}

// weekStart/weekEnd cross the server action boundary as ISO strings (a Date
// wouldn't survive serialization back into a Date on the other side).
export async function fetchPlayerJourneeRating(
  playerId: number,
  teamId: number,
  weekStartIso: string,
  weekEndIso: string
): Promise<PlayerJourneeRating> {
  return getPlayerJourneeRating(playerId, teamId, new Date(weekStartIso), new Date(weekEndIso));
}

export interface MyLeaderboardStanding {
  points: number;
  rank: number; // 1-based
  totalParticipants: number;
}

// Called on an interval by components/fantasy/my-journee-standing.tsx —
// getLeaderboard's points are computed live from each squad's per-player
// ratings (see services/real-player-scoring.ts), not stored anywhere, so
// simply re-calling this periodically is what makes "the ranking updates
// after each match that changes a rating" happen; there's no separate
// invalidation step needed. null when the leaderboard itself is
// unavailable, or this identity has no synced squad for the journée yet.
export async function fetchMyLeaderboardStanding(deviceId: string, journee: number): Promise<MyLeaderboardStanding | null> {
  const entries = await getLeaderboard(journee);
  if (!entries || entries.length === 0) return null;

  const actor = await resolveActor(deviceId);
  const index = entries.findIndex((entry) => (actor.userId ? entry.userId === actor.userId : entry.deviceId === deviceId));
  if (index === -1) return null;

  return { points: entries[index].points, rank: index + 1, totalParticipants: entries.length };
}
