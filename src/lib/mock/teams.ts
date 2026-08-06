import type { Team } from "@/types";

// Clubs réels de Ligue 1 Sénégal (saison en cours), avec leurs vrais ids et
// logos API-Football — vérifiés via GET /teams?league=403&season=2025 (voir
// scripts/sync-teams.mjs, qui crawle ce même roster dans team-directory.ts).
// Sert de filet de secours quand l'API est indisponible pour ce
// classement/ces matchs (voir lib/data/live.ts) ; les ids matchent ceux que
// l'API renvoie réellement, donc un futur retour aux données live n'a pas
// besoin de remapper quoi que ce soit.
export const teams: Team[] = [
  {
    id: "5289",
    name: "Jaraaf",
    shortName: "JAR",
    logoInitials: "JA",
    logo: "https://media.api-sports.io/football/teams/5289.png",
    country: "Sénégal",
  },
  {
    id: "5285",
    name: "Casa Sport",
    shortName: "CAS",
    logoInitials: "CS",
    logo: "https://media.api-sports.io/football/teams/5285.png",
    country: "Sénégal",
  },
  {
    id: "5296",
    name: "Teungueth FC",
    shortName: "TFC",
    logoInitials: "TF",
    logo: "https://media.api-sports.io/football/teams/5296.png",
    country: "Sénégal",
  },
  {
    id: "5553",
    name: "Guédiawaye FC",
    shortName: "GFC",
    logoInitials: "GU",
    logo: "https://media.api-sports.io/football/teams/5553.png",
    country: "Sénégal",
  },
  {
    id: "5288",
    name: "AS Génération Foot",
    shortName: "GF",
    logoInitials: "GF",
    logo: "https://media.api-sports.io/football/teams/5288.png",
    country: "Sénégal",
  },
  {
    id: "5287",
    name: "US Gorée",
    shortName: "GOR",
    logoInitials: "GO",
    logo: "https://media.api-sports.io/football/teams/5287.png",
    country: "Sénégal",
  },
  {
    id: "25067",
    name: "AJEL Rufisque",
    shortName: "AJEL",
    logoInitials: "AJ",
    logo: "https://media.api-sports.io/football/teams/25067.png",
    country: "Sénégal",
  },
  {
    id: "13172",
    name: "Dakar Sacré-Cœur",
    shortName: "DSC",
    logoInitials: "DS",
    logo: "https://media.api-sports.io/football/teams/13172.png",
    country: "Sénégal",
  },
  {
    id: "5293",
    name: "AS Pikine",
    shortName: "PIK",
    logoInitials: "PI",
    logo: "https://media.api-sports.io/football/teams/5293.png",
    country: "Sénégal",
  },
  {
    id: "5290",
    name: "La Linguère",
    shortName: "LIN",
    logoInitials: "LI",
    logo: "https://media.api-sports.io/football/teams/5290.png",
    country: "Sénégal",
  },
  {
    id: "5294",
    name: "Sonacos",
    shortName: "SON",
    logoInitials: "SO",
    logo: "https://media.api-sports.io/football/teams/5294.png",
    country: "Sénégal",
  },
  {
    id: "5554",
    name: "Ouakam",
    shortName: "OUA",
    logoInitials: "OU",
    logo: "https://media.api-sports.io/football/teams/5554.png",
    country: "Sénégal",
  },
  {
    id: "5295",
    name: "Stade de Mbour",
    shortName: "SDM",
    logoInitials: "SM",
    logo: "https://media.api-sports.io/football/teams/5295.png",
    country: "Sénégal",
  },
  {
    id: "25068",
    name: "HLM",
    shortName: "HLM",
    logoInitials: "HL",
    logo: "https://media.api-sports.io/football/teams/25068.png",
    country: "Sénégal",
  },
  {
    id: "25070",
    name: "Wally Daan",
    shortName: "WD",
    logoInitials: "WD",
    logo: "https://media.api-sports.io/football/teams/25070.png",
    country: "Sénégal",
  },
  {
    id: "27005",
    name: "AS Camberene",
    shortName: "CAM",
    logoInitials: "CA",
    logo: "https://media.api-sports.io/football/teams/27005.png",
    country: "Sénégal",
  },
];

export function getTeamById(id: string): Team | undefined {
  return teams.find((team) => team.id === id);
}
