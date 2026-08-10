"use client";

import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { useCurrentIdentity, isCurrentIdentity } from "@/hooks/use-current-identity";
import type { QuizLeaderboardEntry } from "@/lib/data/quiz-leaderboard";

const RANK_COLORS = ["text-accent-2", "text-muted", "text-accent-3"];

interface QuizLeaderboardViewProps {
  entries: QuizLeaderboardEntry[] | null;
  themeLabel: string;
}

export function QuizLeaderboardView({ entries, themeLabel }: QuizLeaderboardViewProps) {
  const t = useTranslations("fantasy");
  const identity = useCurrentIdentity();

  return (
    <div>
      <Link
        href="/fantasy/quiz"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        {t("common.back")}
      </Link>

      <SectionHeader
        eyebrow={t("common.eyebrow")}
        title={t("quiz.leaderboard.title", { theme: themeLabel })}
        subtitle={t("quiz.leaderboard.subtitle")}
      />

      {entries === null ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          {t("common.leaderboardUnavailable")}
        </p>
      ) : entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          {t("quiz.leaderboard.empty")}
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry, index) => {
            const isMe = isCurrentIdentity(entry, identity);
            return (
              <li
                key={entry.deviceId}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-3",
                  isMe ? "border-accent bg-accent/10" : "border-border bg-surface"
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center text-sm font-extrabold tabular-nums",
                    index < 3 ? RANK_COLORS[index] : "text-muted"
                  )}
                >
                  {index < 3 ? <Trophy size={16} aria-hidden /> : index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  {entry.username}
                  {isMe && t("common.you")}
                </span>
                <span className="shrink-0 text-lg font-extrabold tabular-nums text-accent">{entry.bestScore}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
