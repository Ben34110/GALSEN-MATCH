// Custom avatar system — every part is a hand-drawn SVG shape (no image
// assets/uploads), so options are closed enums rather than free-form colors,
// each with a curated preset list. The country-colored ring around the
// avatar reuses the existing accent-theme system (see
// components/theme/accent-theme-provider.tsx) instead of being a field
// here — it already recolors from profile.countryId everywhere else.
export type FaceShape = "round" | "oval" | "square";
export type EyeStyle = "round" | "almond" | "happy" | "sleepy";
export type HairStyle = "bald" | "short" | "afro" | "curly" | "locs" | "bun";

export interface AvatarConfig {
  faceShape: FaceShape;
  skinTone: string;
  eyeStyle: EyeStyle;
  hairStyle: HairStyle;
  hairColor: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  faceShape: "round",
  skinTone: "#C68642",
  eyeStyle: "round",
  hairStyle: "short",
  hairColor: "#2C1608",
};

export const FACE_SHAPES: { id: FaceShape; label: string }[] = [
  { id: "round", label: "Rond" },
  { id: "oval", label: "Ovale" },
  { id: "square", label: "Carré" },
];

export const SKIN_TONES: string[] = ["#FFDBAC", "#F1C27D", "#E0AC69", "#C68642", "#8D5524", "#5C3317"];

export const EYE_STYLES: { id: EyeStyle; label: string }[] = [
  { id: "round", label: "Ronds" },
  { id: "almond", label: "Amande" },
  { id: "happy", label: "Souriants" },
  { id: "sleepy", label: "Rieurs" },
];

export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: "bald", label: "Chauve" },
  { id: "short", label: "Courts" },
  { id: "afro", label: "Afro" },
  { id: "curly", label: "Bouclés" },
  { id: "locs", label: "Locks" },
  { id: "bun", label: "Chignon" },
];

export const HAIR_COLORS: string[] = ["#090806", "#2C1608", "#71491E", "#A55728", "#B7A69E"];

export function parseAvatarConfig(value: unknown): AvatarConfig | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<AvatarConfig>;
  if (
    typeof v.faceShape !== "string" ||
    typeof v.skinTone !== "string" ||
    typeof v.eyeStyle !== "string" ||
    typeof v.hairStyle !== "string" ||
    typeof v.hairColor !== "string"
  ) {
    return null;
  }
  return {
    faceShape: v.faceShape as FaceShape,
    skinTone: v.skinTone,
    eyeStyle: v.eyeStyle as EyeStyle,
    hairStyle: v.hairStyle as HairStyle,
    hairColor: v.hairColor,
  };
}
