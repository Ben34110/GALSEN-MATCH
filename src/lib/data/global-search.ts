import { getAfricanPlayers, searchAfricanPlayers } from "@/lib/data/african-players";
import { getTeamDirectory, searchTeams } from "@/lib/data/team-directory";
import type { AfricanPlayer, LeagueTeam } from "@/types";

// Global search result — a plain client-side filter over two already-static
// datasets (players: lib/data/generated/african-players.json, teams:
// lib/data/generated/teams.json, now covering the 5 big European leagues +
// African domestic clubs + all 53 tracked national teams). No API-Football
// request happens here at all; the only live lookups are per-entity, on
// opening a specific /joueur/[id] or /equipe/[id] page (see
// lib/data/player-profile.ts, lib/data/team-profile.ts).
export type GlobalSearchResult = { kind: "player"; player: AfricanPlayer } | { kind: "team"; team: LeagueTeam };

const MAX_RESULTS = 24;

export function searchGlobal(query: string): GlobalSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const players = searchAfricanPlayers(getAfricanPlayers(), trimmed).slice(0, MAX_RESULTS);
  const teams = searchTeams(getTeamDirectory(), trimmed).slice(0, MAX_RESULTS);

  // Interleaved rather than "all players then all teams" — a query like
  // "senegal" should surface the Senegal national team right alongside its
  // players instead of after all ~30 of them.
  const results: GlobalSearchResult[] = [];
  const max = Math.max(players.length, teams.length);
  for (let i = 0; i < max; i++) {
    if (players[i]) results.push({ kind: "player", player: players[i] });
    if (teams[i]) results.push({ kind: "team", team: teams[i] });
  }
  return results.slice(0, MAX_RESULTS);
}
