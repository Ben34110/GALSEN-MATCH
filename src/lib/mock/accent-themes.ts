import type { AccentTheme } from "@/types";

// Thèmes d'accent sélectionnables sur la page Profil — appliqués en écrivant
// les variables CSS --accent / --accent-2 sur :root (voir profil/page.tsx).
// "default" mirrors the root tokens in globals.css — keep the two in sync.
export const accentThemes: AccentTheme[] = [
  { id: "default", label: "Galsen (par défaut)", accent: "#5b50de", accentInk: "#ffffff", accent2: "#f2b84b" },
  { id: "senegal", label: "Sénégal", accent: "#21a366", accentInk: "#04150c", accent2: "#e3b23c" },
  { id: "cotedivoire", label: "Côte d'Ivoire", accent: "#e8792f", accentInk: "#210f00", accent2: "#2f9e5c" },
  { id: "cameroun", label: "Cameroun", accent: "#2f9e5c", accentInk: "#04150c", accent2: "#d94f4f" },
  { id: "mali", label: "Mali", accent: "#2f9e5c", accentInk: "#04150c", accent2: "#e3b23c" },
  { id: "maroc", label: "Maroc", accent: "#d94f4f", accentInk: "#1a0505", accent2: "#2f9e5c" },
];

export function getAccentTheme(id: string): AccentTheme {
  return accentThemes.find((theme) => theme.id === id) ?? accentThemes[0];
}
