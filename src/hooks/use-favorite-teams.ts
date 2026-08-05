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
