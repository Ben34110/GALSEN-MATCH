import data from "@/lib/data/generated/teams.json";
import type { LeagueTeam } from "@/types";

// Real data, pre-crawled (see scripts/sync-teams.mjs) — a static, instantly
// searchable directory of clubs across Ligue 1 Sénégal + 8 other African
// domestic leagues. Safe to import from client components (plain JSON, no
// API key involved).
export function getTeamDirectory(): LeagueTeam[] {
  return data as LeagueTeam[];
}

export function searchTeams(teamList: LeagueTeam[], query: string): LeagueTeam[] {
  const q = query.trim().toLowerCase();
  if (!q) return teamList;
  return teamList.filter(
    (team) =>
      team.name.toLowerCase().includes(q) ||
      team.leagueName.toLowerCase().includes(q) ||
      team.country.toLowerCase().includes(q)
  );
}
