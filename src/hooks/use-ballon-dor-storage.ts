"use client";

import { useLocalStorageValue, writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { BALLON_DOR_STORAGE_KEY, parseBallonDorStorage, type BallonDorRanking } from "@/lib/ballon-dor";

export function useBallonDorRanking(): BallonDorRanking {
  const raw = useLocalStorageValue(BALLON_DOR_STORAGE_KEY);
  return parseBallonDorStorage(raw);
}

export function saveBallonDorRanking(ranking: BallonDorRanking) {
  writeLocalStorageValue(BALLON_DOR_STORAGE_KEY, JSON.stringify(ranking));
}
