import type { Match, StandingRow } from "@/types";

function minutesFromNow(deltaMinutes: number): string {
  return new Date(Date.now() + deltaMinutes * 60_000).toISOString();
}

// Journée 12 en cours + résultats de la journée 11 pour la démo du classement.
export const matches: Match[] = [
  {
    id: "m-jar-cas",
    competition: "Ligue 1 Sénégal",
    matchday: 12,
    homeTeamId: "jar",
    awayTeamId: "cas",
    status: "live",
    homeScore: 1,
    awayScore: 0,
    minute: 63,
    kickoffAt: minutesFromNow(-63),
  },
  {
    id: "m-tfc-gfc",
    competition: "Ligue 1 Sénégal",
    matchday: 12,
    homeTeamId: "tfc",
    awayTeamId: "gfc",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
    minute: null,
    kickoffAt: minutesFromNow(190),
  },
  {
    id: "m-asp-dsc",
    competition: "Ligue 1 Sénégal",
    matchday: 12,
    homeTeamId: "asp",
    awayTeamId: "dsc",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
    minute: null,
    kickoffAt: minutesFromNow(60 * 26),
  },
  {
    id: "m-cas-gfc",
    competition: "Ligue 1 Sénégal",
    matchday: 11,
    homeTeamId: "cas",
    awayTeamId: "gfc",
    status: "finished",
    homeScore: 2,
    awayScore: 1,
    minute: null,
    kickoffAt: minutesFromNow(-60 * 24 * 4),
  },
  {
    id: "m-jar-tfc",
    competition: "Ligue 1 Sénégal",
    matchday: 11,
    homeTeamId: "jar",
    awayTeamId: "tfc",
    status: "finished",
    homeScore: 0,
    awayScore: 0,
    minute: null,
    kickoffAt: minutesFromNow(-60 * 24 * 4),
  },
];

export const standings: StandingRow[] = [
  { teamId: "tfc", played: 14, won: 9, drawn: 3, lost: 2, points: 30 },
  { teamId: "jar", played: 14, won: 8, drawn: 4, lost: 2, points: 28 },
  { teamId: "cas", played: 14, won: 7, drawn: 4, lost: 3, points: 25 },
  { teamId: "gfc", played: 14, won: 6, drawn: 5, lost: 3, points: 23 },
  { teamId: "asp", played: 14, won: 5, drawn: 4, lost: 5, points: 19 },
  { teamId: "dsc", played: 14, won: 3, drawn: 3, lost: 8, points: 12 },
];
