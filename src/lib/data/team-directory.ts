import data from "@/lib/data/generated/teams.json";
import { normalizeForSearch } from "@/lib/utils";
import type { LeagueTeam } from "@/types";

// Real data, pre-crawled (see scripts/sync-teams.mjs) — a static, instantly
// searchable directory of clubs across Ligue 1 Sénégal + 8 other African
// domestic leagues. Safe to import from client components (plain JSON, no
// API key involved).
export function getTeamDirectory(): LeagueTeam[] {
  return data as LeagueTeam[];
}

// 0 = exact name match ("senegal" -> the Senegal national team), 1 = name
// starts with the query, 2 = query appears elsewhere in the name, 3 = only
// league/country matches. Plain filter-in-array-order previously let e.g.
// 16 Ligue 1 Sénégal clubs (whose `country` field is "Senegal") bury the
// actual Senegal national team at result #17 for a query that's an exact
// match for its name — global search (lib/data/global-search.ts) makes
// this especially visible since national teams are exactly what a country-
// name query should surface first.
function nameMatchRank(name: string, q: string): number {
  const normalized = normalizeForSearch(name);
  if (normalized === q) return 0;
  if (normalized.startsWith(q)) return 1;
  if (normalized.includes(q)) return 2;
  return 3;
}

export function searchTeams(teamList: LeagueTeam[], query: string): LeagueTeam[] {
  const q = normalizeForSearch(query.trim());
  if (!q) return teamList;
  return teamList
    .filter(
      (team) =>
        normalizeForSearch(team.name).includes(q) ||
        normalizeForSearch(team.leagueName).includes(q) ||
        normalizeForSearch(team.country).includes(q)
    )
    .sort((a, b) => nameMatchRank(a.name, q) - nameMatchRank(b.name, q));
}
