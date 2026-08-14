"use client";

import Link from "next/link";
import { ChevronLeft, Medal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import type { HallOfFameWeek } from "@/lib/data/quiz-hall-of-fame";

const RANK_COLORS = ["text-accent-2", "text-muted", "text-accent-3"];
const RANK_EMOJI = ["🥇", "🥈", "🥉"];

export function QuizHallOfFameView({ weeks }: { weeks: HallOfFameWeek[] | null }) {
  const t = useTranslations("fantasy.quiz.hallOfFame");

  return (
    <div>
      <Link
        href="/fantasy/quiz"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        {t("back")}
      </Link>

      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {weeks === null ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">{t("unavailable")}</p>
      ) : weeks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {weeks.map((week) => (
            <Card key={week.week}>
              <div className="mb-3 flex items-center gap-2">
                <Medal size={16} className="text-accent" aria-hidden />
                <h3 className="text-sm font-bold text-foreground">{t("weekLabel", { week: week.week })}</h3>
              </div>
              <div className="flex flex-col gap-2">
                {week.entries.map((entry) => (
                  <div key={entry.rank} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                    <span
                      className={cn("grid size-8 shrink-0 place-items-center text-base font-extrabold", RANK_COLORS[entry.rank - 1])}
                      aria-hidden
                    >
                      {RANK_EMOJI[entry.rank - 1]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{entry.username}</span>
                    <span className="shrink-0 text-sm font-extrabold tabular-nums text-accent">{entry.totalScore}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
