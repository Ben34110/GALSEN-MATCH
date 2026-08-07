export const BALLON_DOR_STORAGE_KEY = "galsen-match:ballon-dor-prediction";

export const BALLON_DOR_SIZE = 10;

// Ranked player ids, index 0 = predicted winner — player ids are stored as
// strings throughout the app state layer (see fantasy-lineup.ts's SeatMap)
// even though AfricanPlayer.id is a number, since that's what a plain
// object/JSON round-trip naturally produces once ids sit inside app state.
export type BallonDorRanking = string[];

export function parseBallonDorStorage(raw: string | null): BallonDorRanking {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string").slice(0, BALLON_DOR_SIZE);
  } catch {
    return [];
  }
}
