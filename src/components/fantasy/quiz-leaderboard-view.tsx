"use client";

import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { useCurrentIdentity, isCurrentIdentity } from "@/hooks/use-current-identity";

const RANK_COLORS = ["text-accent-2", "text-muted", "text-accent-3"];

// Normalized shape shared by the per-theme (all-time best) and "général"
// (this week's sum across every theme played) leaderboards — the page
// adapts both QuizLeaderboardEntry.bestScore and
// QuizWeeklyLeaderboardEntry.total into this one `score` field.
export interface QuizLeaderboardRow {
  deviceId: string;
  userId: string | null;
  username: string;
  score: number;
}

interface QuizLeaderboardViewProps {
  mode: "theme" | "general";
  entries: QuizLeaderboardRow[] | null;
  themeLabel: string;
  themeHref: string;
  generalHref: string;
}

export function QuizLeaderboardView({ mode, entries, themeLabel, themeHref, generalHref }: QuizLeaderboardViewProps) {
  const t = useTranslations("fantasy");

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
        title={mode === "general" ? t("quiz.leaderboard.titleGeneral") : t("quiz.leaderboard.title", { theme: themeLabel })}
        subtitle={mode === "general" ? t("quiz.leaderboard.subtitleGeneral") : t("quiz.leaderboard.subtitle")}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode !== "general" && (
          <Link
            href={themeHref}
            className={cn(
              "flex min-h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
              mode === "theme" ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted"
            )}
          >
            {t("quiz.leaderboard.modeTheme")}
          </Link>
        )}
        <Link
          href={generalHref}
          className={cn(
            "flex min-h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
            mode === "general" ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted"
          )}
        >
          {t("quiz.leaderboard.modeGeneral")}
        </Link>
      </div>

      <QuizLeaderboardList mode={mode} entries={entries} />
    </div>
  );
}

function QuizLeaderboardList({ mode, entries }: { mode: "theme" | "general"; entries: QuizLeaderboardRow[] | null }) {
  const t = useTranslations("fantasy");
  const identity = useCurrentIdentity();

  if (entries === null) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        {t("common.leaderboardUnavailable")}
      </p>
    );
  }
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        {mode === "general" ? t("quiz.leaderboard.emptyGeneral") : t("quiz.leaderboard.empty")}
      </p>
    );
  }

  return (
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
            <span className="shrink-0 text-lg font-extrabold tabular-nums text-accent">{entry.score}</span>
          </li>
        );
      })}
    </ol>
  );
}
