import { QuizLeaderboardView, type QuizLeaderboardRow } from "@/components/fantasy/quiz-leaderboard-view";
import { getQuizLeaderboard, getQuizWeeklyLeaderboard } from "@/lib/data/quiz-leaderboard";
import { QUIZ_THEMES } from "@/lib/data/quiz-questions";
import { getGameweekInfo } from "@/lib/fantasy-gameweek";
import type { QuizTheme } from "@/types";

function resolveTheme(raw: string | undefined): QuizTheme {
  const match = QUIZ_THEMES.find((theme) => theme.id === raw);
  return match?.id ?? "global";
}

export default async function QuizLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; mode?: string }>;
}) {
  const { theme: themeParam, mode: modeParam } = await searchParams;
  const mode = modeParam === "general" ? "general" : "theme";
  const theme = resolveTheme(themeParam);
  const themeLabel = QUIZ_THEMES.find((item) => item.id === theme)?.label ?? theme;
  const { activeJournee } = getGameweekInfo();

  let entries: QuizLeaderboardRow[] | null;
  if (mode === "general") {
    const weekly = await getQuizWeeklyLeaderboard(activeJournee);
    entries = weekly?.map((entry) => ({ deviceId: entry.deviceId, userId: entry.userId, username: entry.username, score: entry.total })) ?? (weekly === null ? null : []);
  } else {
    const themeEntries = await getQuizLeaderboard(theme);
    entries =
      themeEntries?.map((entry) => ({ deviceId: entry.deviceId, userId: entry.userId, username: entry.username, score: entry.bestScore })) ??
      (themeEntries === null ? null : []);
  }

  return (
    <div>
      <QuizLeaderboardView
        mode={mode}
        entries={entries}
        themeLabel={themeLabel}
        themeHref={`/fantasy/quiz/leaderboard?mode=theme&theme=${theme}`}
        generalHref="/fantasy/quiz/leaderboard?mode=general"
      />
    </div>
  );
}
