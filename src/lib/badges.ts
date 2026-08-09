import { parseOnboardingProfile, type OnboardingProfile } from "@/lib/onboarding";
import { parseFantasyStorage, isSquadComplete, type FantasyStorage } from "@/lib/fantasy-lineup";
import type { AfricanPlayer } from "@/types";

// Small standalone localStorage flags, set the first time the relevant
// action happens (see components/chat/chat-room.tsx and
// lib/calendar-export.ts) — cheaper than deriving "has this player ever
// sent a chat message" from the in-memory-only chat state, which isn't
// persisted at all (see chat-room.tsx's own comment on that).
export const HAS_CHATTED_KEY = "galsen-match:has-chatted";
export const HAS_ADDED_CALENDAR_EVENT_KEY = "galsen-match:has-added-calendar-event";

export interface Badge {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const BADGES: Badge[] = [
  { id: "welcome", label: "Bienvenue", description: "Ton profil AfroLive est prêt.", emoji: "👋" },
  { id: "supporter", label: "Supporter", description: "Choisis un club préféré dans ton profil.", emoji: "🧣" },
  { id: "titulaire", label: "Titulaire", description: "Complète un Starting XI (11 joueurs) pour une journée.", emoji: "⚽️" },
  { id: "capitaine", label: "Capitaine", description: "Désigne un capitaine dans ton équipe.", emoji: "🅲" },
  {
    id: "continental",
    label: "Continental",
    description: "Aligne des joueurs d'au moins 5 nations africaines différentes.",
    emoji: "🌍",
  },
  { id: "fidele", label: "Fidèle au poste", description: "Complète ton équipe pour 3 journées différentes.", emoji: "🔥" },
  { id: "dans-le-chat", label: "Dans le chat", description: "Envoie un premier message dans le Live Chat.", emoji: "💬" },
  {
    id: "organise",
    label: "Organisé",
    description: "Ajoute un événement \"À venir\" à ton calendrier.",
    emoji: "🗓️",
  },
];

function countCompleteJournees(storage: FantasyStorage): number {
  return Object.values(storage).filter((squad) => isSquadComplete(squad.seats)).length;
}

function hasCaptain(storage: FantasyStorage): boolean {
  return Object.values(storage).some((squad) => squad.captainId !== null);
}

function maxDistinctNationalities(storage: FantasyStorage, pool: AfricanPlayer[]): number {
  let max = 0;
  for (const squad of Object.values(storage)) {
    const nationalities = new Set(
      Object.values(squad.seats)
        .filter((id): id is string => id !== null)
        .map((id) => pool.find((p) => String(p.id) === id)?.nationality)
        .filter((n): n is string => Boolean(n))
    );
    max = Math.max(max, nationalities.size);
  }
  return max;
}

// Pure function over already-read localStorage values, not a hook — lets
// the Profil badges section stay a plain client component without pulling
// in three separate useLocalStorageValue subscriptions for values that only
// need to be read once per render.
export function computeUnlockedBadgeIds(
  rawProfile: string | null,
  rawFantasy: string | null,
  hasChatted: boolean,
  hasAddedCalendarEvent: boolean,
  pool: AfricanPlayer[]
): Set<string> {
  const profile: OnboardingProfile | null = parseOnboardingProfile(rawProfile);
  const fantasy = parseFantasyStorage(rawFantasy);
  const unlocked = new Set<string>();

  if (profile) unlocked.add("welcome");
  if (profile?.favoriteClubId) unlocked.add("supporter");
  if (countCompleteJournees(fantasy) >= 1) unlocked.add("titulaire");
  if (countCompleteJournees(fantasy) >= 3) unlocked.add("fidele");
  if (hasCaptain(fantasy)) unlocked.add("capitaine");
  if (maxDistinctNationalities(fantasy, pool) >= 5) unlocked.add("continental");
  if (hasChatted) unlocked.add("dans-le-chat");
  if (hasAddedCalendarEvent) unlocked.add("organise");

  return unlocked;
}
