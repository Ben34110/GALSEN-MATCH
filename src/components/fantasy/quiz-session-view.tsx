"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ListOrdered, RotateCcw, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountdown } from "@/hooks/use-countdown";
import { getQuizQuestions, pickNextQuestion, QUIZ_THEMES } from "@/lib/data/quiz-questions";
import { useQuizBestScores, saveQuizBestScoreIfImproved } from "@/hooks/use-quiz-best-scores";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { syncQuizScore } from "@/app/actions/quiz-sync";
import type { QuizQuestion, QuizTheme } from "@/types";

const SESSION_MS = 60_000;
// Brief pause after answering so the correct/incorrect highlight is
// actually visible before the next question replaces it.
const ANSWER_REVEAL_MS = 500;

interface QuizSessionViewProps {
  theme: QuizTheme;
  onClose: () => void;
  onRestart: () => void;
}

// One 60-second sprint. Pure client state throughout the run — no
// precedent anywhere in this app for persisting mid-session progress
// (fantasy only syncs on discrete commits, not intermediate state), and a
// refresh mid-quiz should just lose the in-progress attempt. Only the
// final score, once the timer expires, gets written to localStorage
// (and, if it's a genuine improvement, synced to Supabase). "Rejouer" is
// handled by the parent remounting this component with a fresh `key`
// (see quiz-theme-picker.tsx) rather than resetting state internally —
// simpler and less error-prone than manually clearing every piece of
// local state by hand.
export function QuizSessionView({ theme, onClose, onRestart }: QuizSessionViewProps) {
  // theme never actually changes within one mounted instance (the parent
  // remounts via a fresh `key` instead — see the comment above), but a
  // plain useMemo is still simpler and purer than stashing a ref just to
  // read .current during render.
  const pool = useMemo(() => getQuizQuestions(theme), [theme]);
  const themeLabel = QUIZ_THEMES.find((item) => item.id === theme)?.label ?? theme;
  const bestScores = useQuizBestScores();
  const profile = useOnboardingProfile();

  // Date.now() is impure, so it can only be called inside a lazy useState
  // initializer (guaranteed to run exactly once, at mount) — not as a
  // plain expression evaluated on every render, and not stashed in a ref
  // read directly during render either.
  const [deadline] = useState(() => new Date(Date.now() + SESSION_MS));
  const countdown = useCountdown(deadline);
  const finished = countdown.expired;

  const [score, setScore] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [current, setCurrent] = useState<QuizQuestion | null>(() => pickNextQuestion(pool, []));
  const [selected, setSelected] = useState<number | null>(null);
  const [improved, setImproved] = useState(false);
  const hasSubmittedScore = useRef(false);

  // Fires exactly once, the instant the countdown flips to expired (the
  // dependency array only changes value on that one true transition — this
  // isn't recomputing anything on every tick, just reacting to the timer
  // actually running out, which is what an effect is for). setImproved is
  // wrapped in a resolved promise rather than called synchronously in the
  // effect body, matching this codebase's established fix for the
  // set-state-in-effect lint rule elsewhere (e.g. leaderboard-view.tsx).
  useEffect(() => {
    if (!finished || hasSubmittedScore.current) return;
    hasSubmittedScore.current = true;
    if (saveQuizBestScoreIfImproved(theme, score, bestScores)) {
      Promise.resolve(true).then(setImproved);
      if (profile) syncQuizScore(getOrCreateDeviceId(), theme, profile.username, score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately only reacts to `finished`, runs once via the ref guard
  }, [finished]);

  function answer(index: number) {
    if (selected !== null || !current || finished) return;
    setSelected(index);
    if (index === current.correctIndex) setScore((value) => value + 1);

    setTimeout(() => {
      const nextRecent = [...recentIds, current.id];
      setRecentIds(nextRecent);
      setSelected(null);
      setCurrent(pickNextQuestion(pool, nextRecent));
    }, ANSWER_REVEAL_MS);
  }

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fermer"
      className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-foreground"
    >
      <X size={18} aria-hidden />
    </button>
  );

  if (pool.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-[calc(0.75rem+var(--safe-top))]">
          <h2 className="font-serif text-lg font-bold text-foreground">{themeLabel}</h2>
          {closeButton}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-muted">Aucune question disponible pour ce thème pour l&apos;instant.</p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full bg-accent px-5 text-sm font-bold text-accent-ink"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-[calc(0.75rem+var(--safe-top))]">
        <h2 className="font-serif text-lg font-bold text-foreground">{themeLabel}</h2>
        {closeButton}
      </div>

      {!finished && current && (
        <div className="flex flex-1 flex-col px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-2xl font-extrabold tabular-nums text-accent">{countdown.seconds}s</span>
            <span className="text-sm font-semibold text-muted">Score : {score}</span>
          </div>

          <p className="mb-6 font-serif text-xl font-bold leading-snug text-foreground">{current.question}</p>

          <div className="flex flex-col gap-2.5">
            {current.choices.map((choice, index) => {
              const isSelected = selected === index;
              const isCorrectChoice = index === current.correctIndex;
              const showResult = selected !== null;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={selected !== null}
                  onClick={() => answer(index)}
                  className={cn(
                    "flex min-h-14 items-center justify-between rounded-xl border px-4 text-left text-base font-semibold text-foreground",
                    "transition-colors duration-[var(--duration-fast)]",
                    showResult && isCorrectChoice
                      ? "border-accent bg-accent/10"
                      : showResult && isSelected
                        ? "border-accent-3 bg-accent-3/10"
                        : "border-border bg-surface"
                  )}
                >
                  {choice}
                  {showResult && isCorrectChoice && <Check size={18} className="shrink-0 text-accent" aria-hidden />}
                  {showResult && isSelected && !isCorrectChoice && (
                    <XCircle size={18} className="shrink-0 text-accent-3" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {finished && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="text-6xl font-extrabold tabular-nums text-accent">{score}</span>
          <p className="text-sm text-muted">
            bonne{score !== 1 ? "s" : ""} réponse{score !== 1 ? "s" : ""} en 60 secondes
          </p>
          {improved && <p className="mt-1 text-xs font-bold uppercase tracking-wide text-accent">Nouveau record !</p>}

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <button
              type="button"
              onClick={onRestart}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-base font-bold text-accent-ink transition-transform duration-[var(--duration-fast)] active:scale-[0.98]"
            >
              <RotateCcw size={18} aria-hidden />
              Rejouer
            </button>
            <Link
              href={`/fantasy/quiz/leaderboard?theme=${theme}`}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-[0.98]"
            >
              <ListOrdered size={16} aria-hidden />
              Voir le classement
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              Changer de thème
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
