import type { PlayerMatchStat } from "@/types";

// Notes en direct du match m-jar-cas (Jaraaf 1-0 Casa Sports, 63e minute).
// Alimente le calcul de points Starting 6 en conditions réelles : les notes
// évoluent tant que le match est "live", exactement comme le ferait un
// rafraîchissement périodique depuis API-Football.
export const playerMatchStats: PlayerMatchStat[] = [
  { playerId: "jar-g1", matchId: "m-jar-cas", rating: 6.8, minutes: 63, goals: 0, assists: 0, cleanSheet: true },
  { playerId: "jar-d1", matchId: "m-jar-cas", rating: 6.5, minutes: 63, goals: 0, assists: 0, cleanSheet: true },
  { playerId: "jar-d2", matchId: "m-jar-cas", rating: 6.9, minutes: 63, goals: 0, assists: 0, cleanSheet: true },
  { playerId: "jar-m1", matchId: "m-jar-cas", rating: 7.4, minutes: 63, goals: 0, assists: 1, cleanSheet: false },
  { playerId: "jar-m2", matchId: "m-jar-cas", rating: 6.7, minutes: 63, goals: 0, assists: 0, cleanSheet: false },
  { playerId: "jar-a1", matchId: "m-jar-cas", rating: 7.8, minutes: 63, goals: 1, assists: 0, cleanSheet: false },

  { playerId: "cas-g1", matchId: "m-jar-cas", rating: 5.9, minutes: 63, goals: 0, assists: 0, cleanSheet: false },
  { playerId: "cas-d1", matchId: "m-jar-cas", rating: 5.7, minutes: 63, goals: 0, assists: 0, cleanSheet: false },
  { playerId: "cas-d2", matchId: "m-jar-cas", rating: 5.5, minutes: 63, goals: 0, assists: 0, cleanSheet: false },
  { playerId: "cas-m1", matchId: "m-jar-cas", rating: 6.2, minutes: 63, goals: 0, assists: 0, cleanSheet: false },
  { playerId: "cas-m2", matchId: "m-jar-cas", rating: 6.0, minutes: 63, goals: 0, assists: 0, cleanSheet: false },
  { playerId: "cas-a1", matchId: "m-jar-cas", rating: 5.8, minutes: 63, goals: 0, assists: 0, cleanSheet: false },
];

export function getStatForPlayer(playerId: string): PlayerMatchStat | undefined {
  return playerMatchStats.find((stat) => stat.playerId === playerId);
}
