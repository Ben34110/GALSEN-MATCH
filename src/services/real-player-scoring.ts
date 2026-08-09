import type { AfricanPlayer, PlayerPosition } from "@/types";

// Reset to 0, temporarily: the real intended scoring (see GameRulesSheet)
// is each player's per-journée API rating x10, summed across the XI —
// there's no per-gameweek rating feed wired up yet to compute that from,
// and this season-aggregate estimate (goals/assists/appearances) it used
// to fall back to was confusing enough to be reported as a bug ("why does
// my team have points already, nothing's been played"). Every score is 0
// until the real per-journée rating pipeline replaces this.
export function computeSeasonPoints(_player: AfricanPlayer, _position: PlayerPosition): number {
  return 0;
}

export function calculateRealLineupPoints(
  _entries: { player: AfricanPlayer; position: PlayerPosition }[],
  _captainId: string | null
): number {
  return 0;
}
