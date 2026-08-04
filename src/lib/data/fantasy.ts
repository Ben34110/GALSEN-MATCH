import { players } from "@/lib/mock/players";
import { playerMatchStats } from "@/lib/mock/player-stats";
import type { Player, PlayerMatchStat } from "@/types";

// Point de bascule : `getFantasyPool` lira `players` (jointure fantasy_teams /
// fantasy_lineups) et `getPlayerStatsMap` la table `player_match_stats`.
export function getFantasyPool(): Player[] {
  return players;
}

export function getPlayerStatsMap(): Map<string, PlayerMatchStat> {
  return new Map(playerMatchStats.map((stat) => [stat.playerId, stat]));
}
