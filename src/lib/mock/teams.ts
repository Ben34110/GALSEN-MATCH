import type { Team } from "@/types";

export const teams: Team[] = [
  { id: "jar", name: "Jaraaf", shortName: "JAR", logoInitials: "JA", country: "Sénégal" },
  { id: "cas", name: "Casa Sports", shortName: "CAS", logoInitials: "CS", country: "Sénégal" },
  { id: "tfc", name: "Teungueth FC", shortName: "TFC", logoInitials: "TF", country: "Sénégal" },
  { id: "gfc", name: "Guédiawaye FC", shortName: "GFC", logoInitials: "GF", country: "Sénégal" },
  { id: "asp", name: "AS Pikine", shortName: "ASP", logoInitials: "AP", country: "Sénégal" },
  { id: "dsc", name: "Dakar Sacré-Cœur", shortName: "DSC", logoInitials: "DS", country: "Sénégal" },
];

export function getTeamById(id: string): Team | undefined {
  return teams.find((team) => team.id === id);
}
