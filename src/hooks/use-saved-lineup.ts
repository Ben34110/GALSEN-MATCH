"use client";

import { useLocalStorageValue, writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import {
  FANTASY_LINEUP_STORAGE_KEY,
  parseFantasyStorage,
  type FantasyStorage,
  type SquadState,
} from "@/lib/fantasy-lineup";

// The whole per-journée dict — components read the specific journée they
// care about off it (see fantasy-view.tsx).
export function useFantasyStorage(): FantasyStorage {
  const raw = useLocalStorageValue(FANTASY_LINEUP_STORAGE_KEY);
  return parseFantasyStorage(raw);
}

export function saveSquadForJournee(current: FantasyStorage, journee: number, squad: SquadState) {
  const next: FantasyStorage = { ...current, [journee]: squad };
  writeLocalStorageValue(FANTASY_LINEUP_STORAGE_KEY, JSON.stringify(next));
}
