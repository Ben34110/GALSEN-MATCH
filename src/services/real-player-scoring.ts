import type { AfricanPlayer, PlayerPosition } from "@/types";

// Fantasy scoring for real players, based on their real season aggregate
// stats (goals/assists/appearances from API-Football) — there's no
// per-gameweek stat feed for these players the way the old Senegal mock
// data had, so this is a season-level estimate rather than a single
// matchday score. Goal bonus decreases from keeper to attacker, same
// relative shape as the old per-matchday formula in fantasy-scoring.ts.
const GOAL_POINTS: Record<PlayerPosition, number> = { G: 10, D: 6, M: 5, A: 4 };
const ASSIST_POINTS = 3;
const APPEARANCE_POINTS = 1;
const CAPTAIN_MULTIPLIER = 2;

export function computeSeasonPoints(player: AfricanPlayer, position: PlayerPosition): number {
  const goalPoints = GOAL_POINTS[position] * player.goals;
  return Math.round(player.appearances * APPEARANCE_POINTS + goalPoints + player.assists * ASSIST_POINTS);
}

export function calculateRealLineupPoints(
  entries: { player: AfricanPlayer; position: PlayerPosition }[],
  captainId: string | null
): number {
  return entries.reduce((total, { player, position }) => {
    const points = computeSeasonPoints(player, position);
    return total + (String(player.id) === captainId ? points * CAPTAIN_MULTIPLIER : points);
  }, 0);
}
