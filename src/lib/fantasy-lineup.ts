export type { SeatId } from "@/lib/fantasy-formation";
import type { SeatId } from "@/lib/fantasy-formation";

// Point de bascule : la composition sera lue depuis `fantasy_lineups`
// (Supabase) au lieu du localStorage. En attendant, elle est persistée ici.
export const FANTASY_LINEUP_STORAGE_KEY = "galsen-match:fantasy-lineup";

export type SeatMap = Record<SeatId, string | null>;

export const EMPTY_SEATS: SeatMap = {
  G1: null,
  D1: null,
  D2: null,
  D3: null,
  D4: null,
  M1: null,
  M2: null,
  M3: null,
  A1: null,
  A2: null,
  A3: null,
};

export interface SquadState {
  seats: SeatMap;
  captainId: string | null;
}

// Keyed by journée number, not a single flat lineup — a squad locks once
// its journée starts (see components/fantasy/fantasy-view.tsx), but the
// player should still be able to build *next* week's squad in the
// meantime without touching the locked one. Both simply live under their
// own journée key.
export type FantasyStorage = Record<number, SquadState>;

const SEAT_IDS: SeatId[] = ["G1", "D1", "D2", "D3", "D4", "M1", "M2", "M3", "A1", "A2", "A3"];

function isValidSeatMap(value: unknown): value is SeatMap {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return SEAT_IDS.every((id) => id in record && (record[id] === null || typeof record[id] === "string"));
}

export function parseFantasyStorage(raw: string | null): FantasyStorage {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, { seats?: unknown; captainId?: unknown }>;
    const result: FantasyStorage = {};
    for (const [key, value] of Object.entries(parsed)) {
      const journee = Number(key);
      if (!Number.isFinite(journee) || !isValidSeatMap(value.seats)) continue;
      result[journee] = {
        seats: value.seats,
        captainId: typeof value.captainId === "string" ? value.captainId : null,
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function isSquadComplete(seats: SeatMap): boolean {
  return SEAT_IDS.every((id) => seats[id] !== null);
}

export function filledCount(seats: SeatMap): number {
  return SEAT_IDS.filter((id) => seats[id] !== null).length;
}
