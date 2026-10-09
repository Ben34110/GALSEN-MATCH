// Which leagues API-Football actually populates per-player ratings for
// (coverage.fixtures.statistics_players === true on /leagues?id=&current=true
// — confirmed by hand for every league this app tracks: the 5 big European
// leagues, plus Egypt and South Africa among the African ones; Morocco,
// Algeria, Tunisia, Nigeria, Ghana, Ligue 1 Sénégal and Côte d'Ivoire all
// come back false, even though several of those still have lineups/events
// coverage for live notifications — ratings are a stricter, separate
// guarantee). A player whose club isn't in one of these leagues can never
// receive a Fantasy rating, no matter how good they are, so the Fantasy
// pickers (player-picker-sheet.tsx, ballon-dor-picker-sheet.tsx) exclude
// them from the selectable pool entirely rather than letting someone draft
// a player who can never score.
//
// Hardcoded rather than queried at runtime — these 7 leagues' coverage has
// been stable and this list changes, at most, a few times a year; re-
// verify by hand (see this file's own comment history) rather than adding
// a live API call to every page load that needs this.
export const RATINGS_COVERED_LEAGUE_IDS: ReadonlySet<number> = new Set([
  39, // Premier League (Angleterre)
  140, // La Liga (Espagne)
  135, // Serie A (Italie)
  78, // Bundesliga (Allemagne)
  61, // Ligue 1 (France)
  233, // Premier League (Égypte)
  288, // Premier Soccer League (Afrique du Sud)
]);

// Players synced before this field existed (or whose club wasn't resolved
// to a specific league yet) have `leagueId: null` — treated as "not
// confirmed covered" rather than silently allowed through, same exclude-
// when-unknown rule applied to domestic-league players joining search
// (see scripts/sync-domestic-players.mjs).
export function hasRatingsCoverage(leagueId: number | null): boolean {
  return leagueId !== null && RATINGS_COVERED_LEAGUE_IDS.has(leagueId);
}
