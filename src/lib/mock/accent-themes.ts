import type { AccentTheme } from "@/types";

// Thèmes d'accent sélectionnables sur la page Profil — appliqués en écrivant
// les variables CSS --accent / --accent-2 / --accent-3 sur :root (voir
// components/theme/accent-theme-provider.tsx). Chaque thème reprend les 3
// couleurs du drapeau national quand il en a 3 (Sénégal/Cameroun/Mali sont
// tous vert-jaune-rouge) ; les drapeaux à 2 couleurs (Côte d'Ivoire, Maroc)
// se voient compléter d'une 3e teinte cohérente pour le dégradé/menu actif.
// "default" mirrors the root tokens in globals.css — keep the two in sync.
export const accentThemes: AccentTheme[] = [
  { id: "default", label: "Galsen (par défaut)", accent: "#16794a", accentInk: "#ffffff", accent2: "#f5c518", accent3: "#ce1126" },
  { id: "senegal", label: "Sénégal", accent: "#21a366", accentInk: "#04150c", accent2: "#e3b23c", accent3: "#d94f4f" },
  { id: "cotedivoire", label: "Côte d'Ivoire", accent: "#e8792f", accentInk: "#210f00", accent2: "#2f9e5c", accent3: "#f2b84b" },
  { id: "cameroun", label: "Cameroun", accent: "#2f9e5c", accentInk: "#04150c", accent2: "#d94f4f", accent3: "#e3b23c" },
  { id: "mali", label: "Mali", accent: "#2f9e5c", accentInk: "#04150c", accent2: "#e3b23c", accent3: "#d94f4f" },
  { id: "maroc", label: "Maroc", accent: "#d94f4f", accentInk: "#1a0505", accent2: "#2f9e5c", accent3: "#e3b23c" },
];

export function getAccentTheme(id: string): AccentTheme {
  return accentThemes.find((theme) => theme.id === id) ?? accentThemes[0];
}
