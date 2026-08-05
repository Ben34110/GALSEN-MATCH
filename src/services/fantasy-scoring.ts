import type { LineupSlot, PlayerPosition } from "@/types";

const REQUIRED_COMPOSITION: Record<PlayerPosition, number> = {
  G: 1,
  D: 2,
  M: 2,
  A: 1,
};

export class InvalidLineupError extends Error {}

// Vérifie la composition réglementaire : 1 gardien, 2 défenseurs, 2 milieux, 1 attaquant.
// Source-agnostique — utilisé aussi bien par le pool réel (services/real-player-scoring.ts)
// que par d'anciens tests avec des données mock.
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
