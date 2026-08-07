"use client";

import { useState } from "react";
import Link from "next/link";
import { ListOrdered, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { QUIZ_THEMES } from "@/lib/data/quiz-questions";
import { useQuizBestScores } from "@/hooks/use-quiz-best-scores";
import { QuizSessionView } from "@/components/fantasy/quiz-session-view";
import type { QuizTheme } from "@/types";

export function QuizThemePicker() {
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
      <SectionHeader
        eyebrow="Fantasy"
        title="Quizz Foot Africain"
        subtitle="Choisis un thème, réponds à un maximum de questions en 60 secondes chrono."
      />

      <Card className="mb-5 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-2/15 text-accent-2">
          <Zap size={20} aria-hidden />
        </span>
        <p className="text-sm leading-snug text-muted">Un sprint d&apos;une minute, une seule bonne réponse par question.</p>
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
                {best !== undefined ? `Record : ${best}` : "Aucun record"}
              </span>
              <Link
                href={`/fantasy/quiz/leaderboard?theme=${theme.id}`}
                onClick={(event) => event.stopPropagation()}
                className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                <ListOrdered size={12} aria-hidden />
                Classement
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
