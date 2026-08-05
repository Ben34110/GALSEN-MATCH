import type { Team } from "@/types";

// Clubs réels de Ligue 1 Sénégal (saison en cours), avec leurs vrais ids
// API-Football — trouvés via GET /teams?league=403&season=2024. Sert de
// filet de secours quand l'API est indisponible pour ce classement/ces
// matchs (voir lib/data/live.ts) ; les ids matchent ceux que l'API renvoie
// réellement, donc un futur retour aux données live n'a pas besoin de remapper
// quoi que ce soit.
export const teams: Team[] = [
  { id: "5289", name: "Jaraaf", shortName: "JAR", logoInitials: "JA", country: "Sénégal" },
  { id: "5285", name: "Casa Sport", shortName: "CAS", logoInitials: "CS", country: "Sénégal" },
  { id: "5296", name: "Teungueth FC", shortName: "TFC", logoInitials: "TF", country: "Sénégal" },
  { id: "5553", name: "Guédiawaye FC", shortName: "GFC", logoInitials: "GU", country: "Sénégal" },
  { id: "5288", name: "AS Génération Foot", shortName: "GF", logoInitials: "GF", country: "Sénégal" },
  { id: "5287", name: "US Gorée", shortName: "GOR", logoInitials: "GO", country: "Sénégal" },
  { id: "25067", name: "AJEL Rufisque", shortName: "AJEL", logoInitials: "AJ", country: "Sénégal" },
  { id: "13172", name: "Dakar Sacré-Cœur", shortName: "DSC", logoInitials: "DS", country: "Sénégal" },
  { id: "5293", name: "AS Pikine", shortName: "PIK", logoInitials: "PI", country: "Sénégal" },
  { id: "5290", name: "La Linguère", shortName: "LIN", logoInitials: "LI", country: "Sénégal" },
  { id: "5294", name: "Sonacos", shortName: "SON", logoInitials: "SO", country: "Sénégal" },
  { id: "5554", name: "Ouakam", shortName: "OUA", logoInitials: "OU", country: "Sénégal" },
  { id: "22577", name: "Jamono Fatick", shortName: "JF", logoInitials: "JF", country: "Sénégal" },
  { id: "25068", name: "HLM", shortName: "HLM", logoInitials: "HL", country: "Sénégal" },
  { id: "25069", name: "Oslo", shortName: "OSL", logoInitials: "OS", country: "Sénégal" },
  { id: "25070", name: "Wally Daan", shortName: "WD", logoInitials: "WD", country: "Sénégal" },
];

export function getTeamById(id: string): Team | undefined {
  return teams.find((team) => team.id === id);
}
