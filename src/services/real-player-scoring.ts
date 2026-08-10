import { getPlayerJourneeRating } from "@/lib/data/fantasy-ratings";
import { getJourneeWeekRange } from "@/lib/fantasy-gameweek";
import type { AfricanPlayer, PlayerPosition } from "@/types";

// +0.5 to the captain's own rating before the x10 multiplier (see
// components/fantasy/game-rules-sheet.tsx's rules text) — a captain rated
// 7/10 scores 75 points instead of 70.
const CAPTAIN_BONUS = 0.5;

// Real per-journée scoring: each player's API rating for their team's match
// inside the journée's calendar week, x10, summed across the XI — replaces
// the old always-0 placeholder now that fantasy-ratings.ts's per-journée
// rating pipeline exists (already wired into the pitch view's per-player
// badge). A player whose match hasn't finished yet contributes 0 for now —
// getPlayerJourneeRating only returns "rated" once it has, at which point
// its own 5/10 default already covers "didn't feature".
export async function calculateRealLineupPoints(
  entries: { player: AfricanPlayer; position: PlayerPosition }[],
  captainId: string | null,
  journee: number
): Promise<number> {
  const { start, end } = getJourneeWeekRange(journee);

  const scores = await Promise.all(
    entries.map(async ({ player }) => {
      if (!player.teamId) return 0;
      const result = await getPlayerJourneeRating(player.id, player.teamId, start, end);
      if (result.status !== "rated" || result.rating === null) return 0;
      const isCaptain = captainId === String(player.id);
      return (result.rating + (isCaptain ? CAPTAIN_BONUS : 0)) * 10;
    })
  );

  return Math.round(scores.reduce((sum, points) => sum + points, 0));
}
