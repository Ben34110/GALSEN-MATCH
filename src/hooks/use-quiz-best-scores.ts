"use client";

import { useLocalStorageValue, writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import type { QuizTheme } from "@/types";

const QUIZ_BEST_SCORES_STORAGE_KEY = "galsen-match:quiz-best-scores";

type BestScores = Partial<Record<QuizTheme, number>>;

function parseBestScores(raw: string | null): BestScores {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const result: BestScores = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number") result[key as QuizTheme] = value;
    }
    return result;
  } catch {
    return {};
  }
}

export function useQuizBestScores(): BestScores {
  const raw = useLocalStorageValue(QUIZ_BEST_SCORES_STORAGE_KEY);
  return parseBestScores(raw);
}

// Returns whether `score` actually improved the stored best for `theme` —
// the caller (quiz-session-view.tsx) only fires the Supabase sync when this
// is true, since a non-improving run has nothing new worth writing.
export function saveQuizBestScoreIfImproved(theme: QuizTheme, score: number, current: BestScores): boolean {
  const existing = current[theme] ?? 0;
  if (score <= existing) return false;
  writeLocalStorageValue(QUIZ_BEST_SCORES_STORAGE_KEY, JSON.stringify({ ...current, [theme]: score }));
  return true;
}
