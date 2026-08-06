"use client";

import { useLocalStorageValue, writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { FAVORITE_TEAMS_STORAGE_KEY, parseFavoriteTeamIds } from "@/lib/favorites";

export function useFavoriteTeamIds(): number[] {
  const raw = useLocalStorageValue(FAVORITE_TEAMS_STORAGE_KEY);
  return parseFavoriteTeamIds(raw);
}

export function toggleFavoriteTeam(teamId: number, current: number[]) {
  const next = current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId];
  writeLocalStorageValue(FAVORITE_TEAMS_STORAGE_KEY, JSON.stringify(next));
}

// Idempotent add/remove (vs. toggle, which needs to know current membership)
// — used to keep Profil's "Club préféré" and the Matchs tab's favorite-team
// list in sync (see components/profil/preferences-editor.tsx): picking a
// favorite club in Profil should make it show up in Matchs too, without
// accidentally un-favoriting it if it was somehow already there.
export function addFavoriteTeam(teamId: number, current: number[]) {
  if (current.includes(teamId)) return;
  writeLocalStorageValue(FAVORITE_TEAMS_STORAGE_KEY, JSON.stringify([...current, teamId]));
}

export function removeFavoriteTeam(teamId: number, current: number[]) {
  if (!current.includes(teamId)) return;
  writeLocalStorageValue(FAVORITE_TEAMS_STORAGE_KEY, JSON.stringify(current.filter((id) => id !== teamId)));
}
