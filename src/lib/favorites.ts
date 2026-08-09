// Point de bascule : les clubs favoris seront écrits sur `users` (Supabase)
// au lieu du localStorage.
export const FAVORITE_TEAMS_STORAGE_KEY = "galsen-match:favorite-teams";

export function parseFavoriteTeamIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "number") : [];
  } catch {
    return [];
  }
}

// Same local-only bookmark pattern as favorite teams, keyed on fixture id
// instead of team id — the CAN qualifiers calendar's "cloche" button
// (components/upcoming/match-favorite-button.tsx).
export const FAVORITE_MATCHES_STORAGE_KEY = "galsen-match:favorite-matches";

export function parseFavoriteMatchIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "number") : [];
  } catch {
    return [];
  }
}
