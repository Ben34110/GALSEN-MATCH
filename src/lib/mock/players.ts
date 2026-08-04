import type { Player } from "@/types";

// Pool de joueurs fictif — 6 par club (1G / 2D / 2M / 1A) pour les 4 clubs
// utilisés dans les matchs de démo, afin d'avoir un choix réaliste pour le
// constructeur de composition Starting 6.
export const players: Player[] = [
  // Jaraaf
  { id: "jar-g1", fullName: "Malick Sarr", position: "G", teamId: "jar", nationality: "SN", photoInitials: "MS" },
  { id: "jar-d1", fullName: "Cheikh Ndoye", position: "D", teamId: "jar", nationality: "SN", photoInitials: "CN" },
  { id: "jar-d2", fullName: "Ibou Kane", position: "D", teamId: "jar", nationality: "SN", photoInitials: "IK" },
  { id: "jar-m1", fullName: "Pape Diagne", position: "M", teamId: "jar", nationality: "SN", photoInitials: "PD" },
  { id: "jar-m2", fullName: "Moussa Wade", position: "M", teamId: "jar", nationality: "SN", photoInitials: "MW" },
  { id: "jar-a1", fullName: "Babacar Faye", position: "A", teamId: "jar", nationality: "SN", photoInitials: "BF" },

  // Casa Sports
  { id: "cas-g1", fullName: "Alioune Badiane", position: "G", teamId: "cas", nationality: "SN", photoInitials: "AB" },
  { id: "cas-d1", fullName: "Oumar Diatta", position: "D", teamId: "cas", nationality: "SN", photoInitials: "OD" },
  { id: "cas-d2", fullName: "Bakary Coly", position: "D", teamId: "cas", nationality: "SN", photoInitials: "BC" },
  { id: "cas-m1", fullName: "Serigne Mbaye", position: "M", teamId: "cas", nationality: "SN", photoInitials: "SM" },
  { id: "cas-m2", fullName: "Lamine Sané", position: "M", teamId: "cas", nationality: "SN", photoInitials: "LS" },
  { id: "cas-a1", fullName: "Idrissa Gomis", position: "A", teamId: "cas", nationality: "SN", photoInitials: "IG" },

  // Teungueth FC
  { id: "tfc-g1", fullName: "Youssou Diallo", position: "G", teamId: "tfc", nationality: "SN", photoInitials: "YD" },
  { id: "tfc-d1", fullName: "Modou Thiaw", position: "D", teamId: "tfc", nationality: "SN", photoInitials: "MT" },
  { id: "tfc-d2", fullName: "Aliou Cissé Jr", position: "D", teamId: "tfc", nationality: "SN", photoInitials: "AC" },
  { id: "tfc-m1", fullName: "Assane Dieng", position: "M", teamId: "tfc", nationality: "SN", photoInitials: "AD" },
  { id: "tfc-m2", fullName: "Khalifa Ndao", position: "M", teamId: "tfc", nationality: "SN", photoInitials: "KN" },
  { id: "tfc-a1", fullName: "Habib Ba", position: "A", teamId: "tfc", nationality: "SN", photoInitials: "HB" },

  // Guédiawaye FC
  { id: "gfc-g1", fullName: "Mamadou Seck", position: "G", teamId: "gfc", nationality: "SN", photoInitials: "MSk" },
  { id: "gfc-d1", fullName: "Ousmane Kébé", position: "D", teamId: "gfc", nationality: "SN", photoInitials: "OK" },
  { id: "gfc-d2", fullName: "Abdoulaye Niang", position: "D", teamId: "gfc", nationality: "SN", photoInitials: "AN" },
  { id: "gfc-m1", fullName: "Ismaïla Sarr Jr", position: "M", teamId: "gfc", nationality: "SN", photoInitials: "IS" },
  { id: "gfc-m2", fullName: "Cheikhou Ba", position: "M", teamId: "gfc", nationality: "SN", photoInitials: "CB" },
  { id: "gfc-a1", fullName: "Demba Sow", position: "A", teamId: "gfc", nationality: "SN", photoInitials: "DS2" },
];

export function getPlayerById(id: string): Player | undefined {
  return players.find((player) => player.id === id);
}
