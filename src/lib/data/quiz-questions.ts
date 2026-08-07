import data from "@/lib/data/quiz-questions.json";
import type { QuizQuestion, QuizTheme } from "@/types";

export interface QuizThemeDef {
  id: QuizTheme;
  label: string;
}

// Order matches the product brief: Global first, then the 5 named
// countries in the order given, then the two competition themes.
export const QUIZ_THEMES: QuizThemeDef[] = [
  { id: "global", label: "Global" },
  { id: "senegal", label: "Sénégal" },
  { id: "maroc", label: "Maroc" },
  { id: "algerie", label: "Algérie" },
  { id: "cameroun", label: "Cameroun" },
  { id: "cote-ivoire", label: "Côte d'Ivoire" },
  { id: "egypte", label: "Égypte" },
  { id: "coupe-du-monde", label: "Coupe du Monde" },
  { id: "can", label: "CAN" },
];

const QUESTIONS = data as QuizQuestion[];

export function getQuizQuestions(theme: QuizTheme): QuizQuestion[] {
  return QUESTIONS.filter((question) => question.theme === theme);
}

// Avoids repeating the same question back-to-back during a 60s sprint.
// Once a short theme's pool is nearly exhausted, only excludes as many
// recent ids as the pool can actually spare (pool.length - 1) so the
// session keeps cycling through real questions instead of ever finding
// zero eligible candidates and stalling.
export function pickNextQuestion(pool: QuizQuestion[], recentIds: string[]): QuizQuestion | null {
  if (pool.length === 0) return null;
  const excludeCount = Math.min(recentIds.length, pool.length - 1);
  const excluded = new Set(excludeCount > 0 ? recentIds.slice(-excludeCount) : []);
  const candidates = pool.filter((question) => !excluded.has(question.id));
  return candidates[Math.floor(Math.random() * candidates.length)];
}
