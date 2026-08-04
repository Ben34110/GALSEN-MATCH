import type { LineupSlot, PlayerMatchStat, PlayerPosition } from "@/types";

const REQUIRED_COMPOSITION: Record<PlayerPosition, number> = {
  G: 1,
  D: 2,
  M: 2,
  A: 1,
};

const GOAL_BONUS: Record<PlayerPosition, number> = { G: 60, D: 40, M: 30, A: 20 };
const ASSIST_BONUS = 15;
const CLEAN_SHEET_BONUS: Record<PlayerPosition, number> = { G: 25, D: 15, M: 5, A: 0 };
const CAPTAIN_MULTIPLIER = 2;

export class InvalidLineupError extends Error {}

// Vérifie la composition réglementaire : 1 gardien, 2 défenseurs, 2 milieux, 1 attaquant.
export function assertValidComposition(slots: LineupSlot[]): void {
  if (slots.length !== 6) {
    throw new InvalidLineupError(`La composition doit compter exactement 6 joueurs (${slots.length} fournis).`);
  }

  const counts: Record<PlayerPosition, number> = { G: 0, D: 0, M: 0, A: 0 };
  for (const slot of slots) counts[slot.position] += 1;

  for (const position of Object.keys(REQUIRED_COMPOSITION) as PlayerPosition[]) {
    if (counts[position] !== REQUIRED_COMPOSITION[position]) {
      throw new InvalidLineupError(
        `Composition invalide : ${REQUIRED_COMPOSITION[position]} poste(s) "${position}" attendu(s), ${counts[position]} fourni(s).`
      );
    }
  }
}

export function isCompositionComplete(slots: LineupSlot[]): boolean {
  try {
    assertValidComposition(slots);
    return true;
  } catch {
    return false;
  }
}

// Points d'un joueur pour une journée : note réelle x10 + bonus buts / passes / clean sheet.
export function computePlayerPoints(position: PlayerPosition, stat: PlayerMatchStat | undefined): number {
  if (!stat || stat.rating === null || stat.minutes === 0) return 0; // n'a pas joué

  let points = stat.rating * 10;
  points += stat.goals * GOAL_BONUS[position];
  points += stat.assists * ASSIST_BONUS;
  if (stat.cleanSheet) points += CLEAN_SHEET_BONUS[position];

  return Math.round(points);
}

// Calcule le score total d'une composition Starting 6 pour une journée donnée.
// Lève InvalidLineupError si la composition ne respecte pas 1G/2D/2M/1A.
export function calculateLineupPoints(
  slots: LineupSlot[],
  captainPlayerId: string | null,
  stats: Map<string, PlayerMatchStat>
): number {
  assertValidComposition(slots);

  return slots.reduce((total, slot) => {
    let points = computePlayerPoints(slot.position, stats.get(slot.playerId));
    if (slot.playerId === captainPlayerId) points *= CAPTAIN_MULTIPLIER;
    return total + points;
  }, 0);
}
