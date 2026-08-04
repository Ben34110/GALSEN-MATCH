// Point de bascule : la composition Starting 6 sera lue depuis
// `fantasy_lineups` (Supabase) au lieu du localStorage. En attendant, elle
// est persistée ici pour que la page Accueil puisse en afficher un aperçu.
export const FANTASY_LINEUP_STORAGE_KEY = "galsen-match:fantasy-lineup";

export interface SavedLineup {
  selectedIds: string[];
  captainId: string | null;
  matchday: number;
}

export function parseSavedLineup(raw: string | null): SavedLineup | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedLineup>;
    if (!Array.isArray(parsed.selectedIds) || typeof parsed.matchday !== "number") return null;
    return {
      selectedIds: parsed.selectedIds,
      captainId: typeof parsed.captainId === "string" ? parsed.captainId : null,
      matchday: parsed.matchday,
    };
  } catch {
    return null;
  }
}
