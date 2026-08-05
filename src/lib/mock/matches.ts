import type { Match, StandingRow } from "@/types";

function minutesFromNow(deltaMinutes: number): string {
  return new Date(Date.now() + deltaMinutes * 60_000).toISOString();
}

// Journée en cours + derniers résultats — filet de secours mock utilisé
// uniquement si l'API-Football est indisponible (voir lib/data/live.ts).
// Clubs et ids réels de la saison en cours (voir lib/mock/teams.ts).
export const matches: Match[] = [
  {
    id: "m-jar-cas",
    competition: "Ligue 1 Sénégal",
    matchday: 12,
    homeTeamId: "5289", // Jaraaf
    awayTeamId: "5285", // Casa Sport
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
    homeTeamId: "5296", // Teungueth FC
    awayTeamId: "5553", // Guédiawaye FC
    status: "scheduled",
    homeScore: null,
    awayScore: null,
    minute: null,
    kickoffAt: minutesFromNow(190),
  },
  {
    id: "m-ajel-dsc",
    competition: "Ligue 1 Sénégal",
    matchday: 12,
    homeTeamId: "25067", // AJEL Rufisque
    awayTeamId: "13172", // Dakar Sacré-Cœur
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
    homeTeamId: "5285", // Casa Sport
    awayTeamId: "5553", // Guédiawaye FC
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
    homeTeamId: "5289", // Jaraaf
    awayTeamId: "5296", // Teungueth FC
    status: "finished",
    homeScore: 0,
    awayScore: 0,
    minute: null,
    kickoffAt: minutesFromNow(-60 * 24 * 4),
  },
  {
    id: "m-gf-gor",
    competition: "Ligue 1 Sénégal",
    matchday: 11,
    homeTeamId: "5288", // AS Génération Foot
    awayTeamId: "5287", // US Gorée
    status: "finished",
    homeScore: 1,
    awayScore: 1,
    minute: null,
    kickoffAt: minutesFromNow(-60 * 24 * 4),
  },
];

// Classement complet des 16 clubs — même filet de secours mock.
export const standings: StandingRow[] = [
  { teamId: "5296", played: 14, won: 9, drawn: 3, lost: 2, points: 30 }, // Teungueth FC
  { teamId: "5289", played: 14, won: 8, drawn: 4, lost: 2, points: 28 }, // Jaraaf
  { teamId: "5285", played: 14, won: 7, drawn: 4, lost: 3, points: 25 }, // Casa Sport
  { teamId: "5553", played: 14, won: 6, drawn: 5, lost: 3, points: 23 }, // Guédiawaye FC
  { teamId: "5288", played: 14, won: 6, drawn: 4, lost: 4, points: 22 }, // AS Génération Foot
  { teamId: "5287", played: 14, won: 5, drawn: 6, lost: 3, points: 21 }, // US Gorée
  { teamId: "25067", played: 14, won: 5, drawn: 5, lost: 4, points: 20 }, // AJEL Rufisque
  { teamId: "13172", played: 14, won: 5, drawn: 4, lost: 5, points: 19 }, // Dakar Sacré-Cœur
  { teamId: "5293", played: 14, won: 5, drawn: 4, lost: 5, points: 19 }, // AS Pikine
  { teamId: "5290", played: 14, won: 4, drawn: 5, lost: 5, points: 17 }, // La Linguère
  { teamId: "5294", played: 14, won: 4, drawn: 4, lost: 6, points: 16 }, // Sonacos
  { teamId: "5554", played: 14, won: 3, drawn: 6, lost: 5, points: 15 }, // Ouakam
  { teamId: "22577", played: 14, won: 3, drawn: 5, lost: 6, points: 14 }, // Jamono Fatick
  { teamId: "25068", played: 14, won: 3, drawn: 4, lost: 7, points: 13 }, // HLM
  { teamId: "25069", played: 14, won: 2, drawn: 4, lost: 8, points: 10 }, // Oslo
  { teamId: "25070", played: 14, won: 1, drawn: 3, lost: 10, points: 6 }, // Wally Daan
];
