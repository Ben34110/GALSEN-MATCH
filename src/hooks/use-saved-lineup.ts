"use client";

import { useLocalStorageValue } from "@/hooks/use-local-storage-value";
import { FANTASY_LINEUP_STORAGE_KEY, parseSavedLineup } from "@/lib/fantasy-lineup";

export function useSavedLineup() {
  const raw = useLocalStorageValue(FANTASY_LINEUP_STORAGE_KEY);
  return parseSavedLineup(raw);
}
