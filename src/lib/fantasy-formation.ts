import type { PlayerPosition } from "@/types";

// 1-4-3-3: 1 gardien, 4 défenseurs, 3 milieux, 3 attaquants — 11 sièges
// nommés individuellement (pas juste un compte par poste) puisque
// l'interface remplit un siège précis à la fois (voir
// components/fantasy/pitch-builder.tsx).
export type SeatId = "G1" | "D1" | "D2" | "D3" | "D4" | "M1" | "M2" | "M3" | "A1" | "A2" | "A3";

export interface SeatDef {
  id: SeatId;
  position: PlayerPosition;
  topPercent: number;
  leftPercent: number;
}

// Read bottom (goalkeeper, own goal) to top (attackers) — matches how a
// half-pitch view reads on a phone screen. leftPercent values are spread
// evenly per row so the row re-centers correctly regardless of how many
// seats it holds (4 defenders vs 3 midfielders/attackers).
export const FORMATION_SEATS: SeatDef[] = [
  { id: "A1", position: "A", topPercent: 8, leftPercent: 20 },
  { id: "A2", position: "A", topPercent: 8, leftPercent: 50 },
  { id: "A3", position: "A", topPercent: 8, leftPercent: 80 },

  { id: "M1", position: "M", topPercent: 34, leftPercent: 20 },
  { id: "M2", position: "M", topPercent: 34, leftPercent: 50 },
  { id: "M3", position: "M", topPercent: 34, leftPercent: 80 },

  { id: "D1", position: "D", topPercent: 62, leftPercent: 14 },
  { id: "D2", position: "D", topPercent: 62, leftPercent: 38 },
  { id: "D3", position: "D", topPercent: 62, leftPercent: 62 },
  { id: "D4", position: "D", topPercent: 62, leftPercent: 86 },

  { id: "G1", position: "G", topPercent: 88, leftPercent: 50 },
];

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  G: "Gardien",
  D: "Défenseur",
  M: "Milieu",
  A: "Attaquant",
};

export const POSITION_LABELS_PLURAL: Record<PlayerPosition, string> = {
  G: "Gardiens",
  D: "Défenseurs",
  M: "Milieux",
  A: "Attaquants",
};

export function seatsForPosition(position: PlayerPosition): SeatDef[] {
  return FORMATION_SEATS.filter((seat) => seat.position === position);
}
