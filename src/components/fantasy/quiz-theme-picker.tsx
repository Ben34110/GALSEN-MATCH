"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ListOrdered, Trophy, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { QUIZ_THEMES } from "@/lib/data/quiz-questions";
import { useQuizBestScores } from "@/hooks/use-quiz-best-scores";
import { QuizSessionView } from "@/components/fantasy/quiz-session-view";
import type { QuizTheme } from "@/types";

export function QuizThemePicker() {
  const t = useTranslations("fantasy");
  const bestScores = useQuizBestScores();
  const [activeTheme, setActiveTheme] = useState<QuizTheme | null>(null);
  // Bumped on "Rejouer" so QuizSessionView remounts fresh (see its own
  // comment on why a remount is simpler than manual internal state reset).
  const [sessionKey, setSessionKey] = useState(0);

  function openTheme(theme: QuizTheme) {
    setSessionKey((key) => key + 1);
    setActiveTheme(theme);
  }

  return (
    <div>
      <Link
        href="/fantasy"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        {t("common.back")}
      </Link>

      <SectionHeader eyebrow={t("common.eyebrow")} title={t("quiz.hub.title")} subtitle={t("quiz.hub.subtitle")} />

      <Card className="mb-5 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-2/15 text-accent-2">
          <Zap size={20} aria-hidden />
        </span>
        <p className="text-sm leading-snug text-muted">{t("quiz.hub.intro")}</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {QUIZ_THEMES.map((theme) => {
          const best = bestScores[theme.id];
          return (
            <Card
              key={theme.id}
              interactive
              tone="solid"
              onClick={() => openTheme(theme.id)}
              className="flex cursor-pointer flex-col items-start gap-2"
            >
              <span className="text-sm font-bold text-foreground">{theme.label}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted">
                <Trophy size={12} aria-hidden />
                {best !== undefined ? t("quiz.hub.record", { best }) : t("quiz.hub.noRecord")}
              </span>
              <Link
                href={`/fantasy/quiz/leaderboard?theme=${theme.id}`}
                onClick={(event) => event.stopPropagation()}
                className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                <ListOrdered size={12} aria-hidden />
                {t("quiz.hub.leaderboardLink")}
              </Link>
            </Card>
          );
        })}
      </div>

      {activeTheme && (
        <QuizSessionView
          key={sessionKey}
          theme={activeTheme}
          onClose={() => setActiveTheme(null)}
          onRestart={() => setSessionKey((key) => key + 1)}
        />
      )}
    </div>
  );
}
