import type { Match, StandingRow } from "@/types";

function minutesFromNow(deltaMinutes: number): string {
  return new Date(Date.now() + deltaMinutes * 60_000).toISOString();
}

// Journée en cours + derniers résultats — filet de secours mock utilisé
// uniquement si l'API-Football échoue complètement pour Ligue 1 Sénégal
// (voir lib/data/live.ts : du vrai contenu, même résultats-seuls sans match
// à venir programmé, est toujours préféré à ceci). Une fonction plutôt
// qu'un tableau au niveau module : les horaires sont calculés à chaque
// appel, relatifs à "maintenant", pour ne jamais rester figés (un match
// "live" qui ne changeait plus depuis le démarrage du process pouvait
// paraître "en cours" depuis des jours). Clubs et ids réels de la saison en
// cours (voir lib/mock/teams.ts).
export function getMockMatches(): Match[] {
  return [
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
}

// Classement complet des 16 clubs — même filet de secours mock. Points et
// zones (qualification continentale / relégation) alignés sur le vrai
// classement 2025/2026 observé via l'API (rang 1 -> CAF Champions League,
// rangs 15-16 -> relégation) pour que la mise en avant des zones soit
// cohérente même quand ce filet de secours est utilisé.
export const standings: StandingRow[] = [
  { teamId: "5296", played: 30, won: 16, drawn: 6, lost: 8, points: 54, zone: "Promotion - CAF Champions League (Qualification)" }, // Teungueth FC
  { teamId: "25067", played: 30, won: 15, drawn: 9, lost: 6, points: 54, zone: null }, // AJEL Rufisque
  { teamId: "5288", played: 30, won: 13, drawn: 9, lost: 8, points: 48, zone: null }, // AS Génération Foot
  { teamId: "5287", played: 30, won: 12, drawn: 12, lost: 6, points: 48, zone: null }, // US Gorée
  { teamId: "25070", played: 30, won: 12, drawn: 8, lost: 10, points: 44, zone: null }, // Wally Daan
  { teamId: "5554", played: 30, won: 11, drawn: 9, lost: 10, points: 42, zone: null }, // Ouakam
  { teamId: "5289", played: 30, won: 10, drawn: 11, lost: 9, points: 41, zone: null }, // Jaraaf
  { teamId: "5285", played: 30, won: 10, drawn: 10, lost: 10, points: 40, zone: null }, // Casa Sport
  { teamId: "5293", played: 30, won: 8, drawn: 10, lost: 12, points: 34, zone: null }, // AS Pikine
  { teamId: "5295", played: 30, won: 8, drawn: 9, lost: 13, points: 33, zone: null }, // Stade de Mbour
  { teamId: "25068", played: 30, won: 8, drawn: 9, lost: 13, points: 33, zone: null }, // HLM
  { teamId: "13172", played: 30, won: 7, drawn: 10, lost: 13, points: 31, zone: null }, // Dakar Sacré-Cœur
  { teamId: "5553", played: 30, won: 6, drawn: 10, lost: 14, points: 28, zone: null }, // Guédiawaye FC
  { teamId: "5290", played: 30, won: 5, drawn: 10, lost: 15, points: 25, zone: null }, // La Linguère
  { teamId: "5294", played: 30, won: 5, drawn: 10, lost: 15, points: 25, zone: "Relegation" }, // Sonacos
  { teamId: "27005", played: 30, won: 5, drawn: 9, lost: 16, points: 24, zone: "Relegation" }, // AS Camberene
];
