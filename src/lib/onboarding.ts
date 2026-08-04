// Point de bascule : le profil d'onboarding (pays, joueurs favoris, pseudo)
// sera écrit sur `users` (Supabase) au lieu du localStorage.
export const ONBOARDING_STORAGE_KEY = "galsen-match:onboarding";

export interface OnboardingProfile {
  countryId: string; // matches an id in lib/mock/accent-themes.ts (senegal, cotedivoire, ...)
  playerIds: string[]; // exactly 3
  username: string;
}

// Maps accent-theme country ids to the chat rooms' ISO country codes so the
// user's chat room can be surfaced first (see components/chat/chat-room.tsx).
export const COUNTRY_CODE_BY_THEME_ID: Record<string, string> = {
  senegal: "SN",
  cotedivoire: "CI",
  cameroun: "CM",
  mali: "ML",
  maroc: "MA",
};

export const COUNTRY_FLAGS: Record<string, string> = {
  senegal: "🇸🇳",
  cotedivoire: "🇨🇮",
  cameroun: "🇨🇲",
  mali: "🇲🇱",
  maroc: "🇲🇦",
};

// First two letters of the username, matching the avatar-initials pattern
// used elsewhere (e.g. profil, dashboard greeting).
export function initialsFromUsername(username: string): string {
  return username.trim().slice(0, 2).toUpperCase() || "?";
}

export function parseOnboardingProfile(raw: string | null): OnboardingProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingProfile>;
    if (
      typeof parsed.countryId !== "string" ||
      !Array.isArray(parsed.playerIds) ||
      parsed.playerIds.length !== 3 ||
      typeof parsed.username !== "string" ||
      !parsed.username.trim()
    ) {
      return null;
    }
    return { countryId: parsed.countryId, playerIds: parsed.playerIds, username: parsed.username.trim() };
  } catch {
    return null;
  }
}
