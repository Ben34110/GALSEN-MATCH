"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { useCurrentIdentity, isCurrentIdentity } from "@/hooks/use-current-identity";
import { getAfricanPlayers } from "@/lib/data/african-players";
import { ChatProfileSheet } from "@/components/chat/chat-profile-sheet";
import { LeaderboardMonthPicker, type MonthOption } from "@/components/fantasy/leaderboard-month-picker";

const RANK_COLORS = ["text-accent-2", "text-muted", "text-accent-3"];

// Normalized shape shared by the weekly (per-journée) and monthly
// (aggregated) leaderboards — `filled`/`journeesPlayed` is the one field
// pair that differs by mode ("X/11 joueurs" vs "X journées jouées"), the
// irrelevant one set to null by the page depending on `mode`.
export interface LeaderboardRow {
  deviceId: string;
  userId: string | null;
  username: string;
  points: number;
  filled: number | null;
  journeesPlayed: number | null;
}

interface LeaderboardViewProps {
  mode: "semaine" | "mois";
  journee: number;
  monthLabel: string;
  monthOptions: MonthOption[];
  selectedMonthKey: string;
  weekHref: string;
  monthHref: string;
  entries: LeaderboardRow[] | null;
  dataUnavailable: boolean;
}

export function LeaderboardView({
  mode,
  journee,
  monthLabel,
  monthOptions,
  selectedMonthKey,
  weekHref,
  monthHref,
  entries,
  dataUnavailable,
}: LeaderboardViewProps) {
  const t = useTranslations("fantasy");
  const identity = useCurrentIdentity();
  const playerPool = useMemo(() => getAfricanPlayers(), []);
  // Same "tap a row, see their profile" pattern as chat (see
  // components/chat/chat-room.tsx's openProfileTarget) — ChatProfileSheet
  // and its getChatProfile action are already identity-generic (deviceId +
  // userId), not chat-specific, so this reuses both as-is.
  const [openProfileTarget, setOpenProfileTarget] = useState<{ deviceId: string; userId: string | null } | null>(null);

  const emptyMessage = mode === "semaine" ? t("leaderboard.emptyWeek") : t("leaderboard.emptyMonth");

  return (
    <div>
      <Link
        href="/fantasy/xi"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        {t("common.back")}
      </Link>

      <SectionHeader
        eyebrow={t("common.eyebrow")}
        title={mode === "semaine" ? t("leaderboard.titleWeek", { journee }) : t("leaderboard.titleMonth", { month: monthLabel })}
        subtitle={t("leaderboard.subtitle")}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={weekHref}
          className={cn(
            "flex min-h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
            mode === "semaine" ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted"
          )}
        >
          {t("leaderboard.modeWeek")}
        </Link>
        <Link
          href={monthHref}
          className={cn(
            "flex min-h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
            mode === "mois" ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted"
          )}
        >
          {t("leaderboard.modeMonth")}
        </Link>
        {mode === "mois" && <LeaderboardMonthPicker months={monthOptions} selected={selectedMonthKey} />}
      </div>

      {dataUnavailable || entries === null ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          {t("common.leaderboardUnavailable")}
        </p>
      ) : entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">{emptyMessage}</p>
      ) : (
        <>
          <ol className="flex flex-col gap-2">
            {entries.map((entry, index) => {
              const isMe = isCurrentIdentity(entry, identity);
              const secondaryLabel =
                entry.filled !== null
                  ? t("leaderboard.weeklyPlayers", { filled: entry.filled })
                  : t("leaderboard.monthlyPlayed", { count: entry.journeesPlayed ?? 0 });
              return (
                <li key={entry.deviceId}>
                  <button
                    type="button"
                    onClick={() => setOpenProfileTarget({ deviceId: entry.deviceId, userId: entry.userId })}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-transform duration-[var(--duration-fast)] active:scale-[0.99]",
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
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {entry.username}
                        {isMe && t("common.you")}
                      </span>
                      <span className="block text-[11px] text-muted">{secondaryLabel}</span>
                    </span>
                    <span className="shrink-0 text-lg font-extrabold tabular-nums text-accent">{entry.points}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {openProfileTarget && (
            <ChatProfileSheet
              deviceId={openProfileTarget.deviceId}
              userId={openProfileTarget.userId}
              playerPool={playerPool}
              onClose={() => setOpenProfileTarget(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
