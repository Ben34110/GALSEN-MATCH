import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
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
      <Link
        href="/fantasy/quiz"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        Retour
      </Link>

      <SectionHeader eyebrow="Fantasy" title={`Classement — ${themeLabel}`} subtitle="Meilleurs scores sur ce thème, en 60 secondes." />

      {entries === null ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          Classement indisponible pour l&apos;instant.
        </p>
      ) : (
        <QuizLeaderboardView entries={entries} />
      )}
    </div>
  );
}
