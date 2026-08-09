"use client";

import { useLocalStorageValue, writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { FAVORITE_MATCHES_STORAGE_KEY, parseFavoriteMatchIds } from "@/lib/favorites";

export function useFavoriteMatchIds(): number[] {
  const raw = useLocalStorageValue(FAVORITE_MATCHES_STORAGE_KEY);
  return parseFavoriteMatchIds(raw);
}

export function toggleFavoriteMatch(fixtureId: number, current: number[]) {
  const next = current.includes(fixtureId) ? current.filter((id) => id !== fixtureId) : [...current, fixtureId];
  writeLocalStorageValue(FAVORITE_MATCHES_STORAGE_KEY, JSON.stringify(next));
}
