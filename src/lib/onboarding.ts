import { writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { AFRICAN_NATIONS } from "@/lib/data/african-nations";

// Point de bascule : le profil d'onboarding (pays, joueurs favoris, pseudo,
// club favori) sera écrit sur `users` (Supabase) au lieu du localStorage —
// voir updateOnboardingProfile ci-dessous, seul point d'écriture, pour
// brancher l'appel Supabase le moment venu sans toucher aux composants.
export const ONBOARDING_STORAGE_KEY = "galsen-match:onboarding";

export interface OnboardingProfile {
  countryId: string; // matches an id in lib/data/african-nations.ts (any of the 54)
  playerIds: string[]; // exactly 3 once onboarded; can transiently be 0-2 while editing in Profil
  username: string;
  favoriteClubId: number | null; // real API-Football team id (lib/data/team-directory.ts), editable from Profil
}

// Maps a country's theme/onboarding id to the chat rooms' ISO country code
// (components/chat/chat-room.tsx surfaces the user's own room first) — all
// derived from the single 54-nation source of truth.
export const COUNTRY_CODE_BY_THEME_ID: Record<string, string> = Object.fromEntries(
  AFRICAN_NATIONS.map((nation) => [nation.id, nation.countryCode])
);

// National team crest — used everywhere a country is represented in the UI
// except the fantasy squad/lineup views (player-picker-sheet, pitch-view),
// which keep flags by design.
export const COUNTRY_LOGOS: Record<string, string> = Object.fromEntries(
  AFRICAN_NATIONS.map((nation) => [nation.id, nation.logo])
);

// Maps a country's theme/onboarding id to the exact nationality string used
// in lib/data/generated/african-players.json (see
// scripts/sync-african-players.mjs), so the onboarding player picker can
// default to showing the user's own country's players first.
export const NATIONALITY_BY_THEME_ID: Record<string, string> = Object.fromEntries(
  AFRICAN_NATIONS.map((nation) => [nation.id, nation.nationality])
);

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
      // Onboarding requires exactly 3 to finish (see app/onboarding/page.tsx's
      // canAdvance), but once a profile exists, editing it in Profil needs to
      // allow a transient 0-3 range — e.g. removing one player to swap it in
      // for another. Rejecting anything but exactly 3 here used to bounce the
      // user straight back into the onboarding wizard the moment they removed
      // a player to replace it.
      parsed.playerIds.length > 3 ||
      typeof parsed.username !== "string" ||
      !parsed.username.trim()
    ) {
      return null;
    }
    return {
      countryId: parsed.countryId,
      playerIds: parsed.playerIds,
      username: parsed.username.trim(),
      // Added after the initial onboarding shipped — older saved profiles
      // simply won't have it yet, default to null rather than invalidating them.
      favoriteClubId: typeof parsed.favoriteClubId === "number" ? parsed.favoriteClubId : null,
    };
  } catch {
    return null;
  }
}

// The one write path for the profile after onboarding (country, 3 favorite
// players, favorite club — see Profil). Reactive: writeLocalStorageValue
// notifies every useOnboardingProfile() subscriber immediately, so the
// dashboard greeting, chat room order, nav theming etc. all update at once.
export function updateOnboardingProfile(
  current: OnboardingProfile,
  updates: Partial<Pick<OnboardingProfile, "countryId" | "playerIds" | "username" | "favoriteClubId">>
): void {
  const next: OnboardingProfile = { ...current, ...updates };
  writeLocalStorageValue(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
}
