import { matches, standings } from "@/lib/mock/matches";
import { teams } from "@/lib/mock/teams";
import type { Match, StandingRow, Team } from "@/types";

// Point de bascule : ces trois fonctions liront demain la couche de cache
// (api_cache / Redis) alimentée par API-Football au lieu du mock local.
export function getMatches(): Match[] {
  return [...matches].sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
}

export function getStandings(): StandingRow[] {
  return [...standings].sort((a, b) => b.points - a.points);
}

export function getTeams(): Team[] {
  return teams;
}
