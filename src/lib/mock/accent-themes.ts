import type { AccentTheme } from "@/types";
import { AFRICAN_NATIONS, generateHueTheme, pickInkColor } from "@/lib/data/african-nations";

// Thèmes d'accent sélectionnables sur la page Profil — appliqués en écrivant
// les variables CSS --accent / --accent-2 / --accent-3 sur :root (voir
// components/theme/accent-theme-provider.tsx). "default" mirrors the root
// tokens in globals.css — keep the two in sync.
//
// The 5 original nations (Sénégal/Côte d'Ivoire/Cameroun/Mali/Maroc) keep
// their exact hand-picked hex values — these are already saved as
// `countryId` in onboarded users' localStorage profiles, so neither the id
// nor the resulting colors should silently change underneath them. Every
// other nation (see lib/data/african-nations.ts for the full 54-nation
// list, one source of truth for onboarding/theme/chat) gets its palette
// generated from real flag-color hue anchors with a consistent
// saturation/lightness formula instead of 49 more hand-picked hex triples.
const LEGACY_THEMES: Record<string, Omit<AccentTheme, "id" | "label">> = {
  senegal: { accent: "#21a366", accentInk: "#04150c", accent2: "#e3b23c", accent3: "#d94f4f" },
  cotedivoire: { accent: "#e8792f", accentInk: "#210f00", accent2: "#2f9e5c", accent3: "#f2b84b" },
  cameroun: { accent: "#2f9e5c", accentInk: "#04150c", accent2: "#d94f4f", accent3: "#e3b23c" },
  mali: { accent: "#2f9e5c", accentInk: "#04150c", accent2: "#e3b23c", accent3: "#d94f4f" },
  maroc: { accent: "#d94f4f", accentInk: "#1a0505", accent2: "#2f9e5c", accent3: "#e3b23c" },
};

export const accentThemes: AccentTheme[] = [
  { id: "default", label: "Galsen (par défaut)", accent: "#16794a", accentInk: "#ffffff", accent2: "#f5c518", accent3: "#ce1126" },
  ...AFRICAN_NATIONS.map((nation): AccentTheme => {
    const legacy = LEGACY_THEMES[nation.id];
    if (legacy) return { id: nation.id, label: nation.label, ...legacy };

    const { accent, accent2, accent3 } = generateHueTheme(nation.hues);
    return { id: nation.id, label: nation.label, accent, accentInk: pickInkColor(accent), accent2, accent3 };
  }),
];

export function getAccentTheme(id: string): AccentTheme {
  return accentThemes.find((theme) => theme.id === id) ?? accentThemes[0];
}
