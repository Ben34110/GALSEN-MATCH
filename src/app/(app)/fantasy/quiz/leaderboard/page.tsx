import { QuizLeaderboardView } from "@/components/fantasy/quiz-leaderboard-view";
import { getQuizLeaderboard } from "@/lib/data/quiz-leaderboard";
import { QUIZ_THEMES } from "@/lib/data/quiz-questions";
import type { QuizTheme } from "@/types";

function resolveTheme(raw: string | undefined): QuizTheme {
  const match = QUIZ_THEMES.find((theme) => theme.id === raw);
  return match?.id ?? "global";
}

export default async function QuizLeaderboardPage({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const { theme: themeParam } = await searchParams;
  const theme = resolveTheme(themeParam);
  const themeLabel = QUIZ_THEMES.find((item) => item.id === theme)?.label ?? theme;
  const entries = await getQuizLeaderboard(theme);

  return (
    <div>
      <QuizLeaderboardView entries={entries} themeLabel={themeLabel} />
    </div>
  );
}
