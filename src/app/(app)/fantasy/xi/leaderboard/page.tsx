import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { LeaderboardView, type LeaderboardRow } from "@/components/fantasy/leaderboard-view";
import { LeaderboardMonthPicker, type MonthOption } from "@/components/fantasy/leaderboard-month-picker";
import { getLeaderboard, getMonthlyLeaderboard } from "@/lib/data/fantasy-leaderboard";
import { getGameweekInfo, getAvailableLeaderboardMonths } from "@/lib/fantasy-gameweek";
import { cn } from "@/lib/utils";

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function parseMonthKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

export default async function FantasyLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ journee?: string; mode?: string; month?: string }>;
}) {
  const { journee: journeeParam, mode: modeParam, month: monthParam } = await searchParams;
  const { activeJournee } = getGameweekInfo();
  const journee = journeeParam ? Number(journeeParam) : activeJournee;
  const mode = modeParam === "mois" ? "mois" : "semaine";

  const availableMonths = getAvailableLeaderboardMonths();
  const defaultMonth = availableMonths[availableMonths.length - 1] ?? new Date();
  const monthStart = (monthParam && parseMonthKey(monthParam)) || defaultMonth;
  const monthOptions: MonthOption[] = availableMonths.map((date) => ({ key: monthKey(date), label: monthLabel(date) }));

  const weeklyEntries = mode === "semaine" ? await getLeaderboard(journee) : null;
  const monthlyEntries = mode === "mois" ? await getMonthlyLeaderboard(monthStart) : null;

  const weeklyRows: LeaderboardRow[] | null =
    weeklyEntries?.map((entry) => ({ ...entry, secondaryLabel: `${entry.filled}/11 joueurs` })) ?? null;
  const monthlyRows: LeaderboardRow[] | null =
    monthlyEntries?.map((entry) => ({
      ...entry,
      secondaryLabel: `${entry.journeesPlayed} journée${entry.journeesPlayed > 1 ? "s" : ""} jouée${entry.journeesPlayed > 1 ? "s" : ""}`,
    })) ?? null;

  const entries = mode === "semaine" ? weeklyRows : monthlyRows;
  const dataUnavailable = mode === "semaine" ? weeklyEntries === null : monthlyEntries === null;

  return (
    <div>
      <Link
        href="/fantasy/xi"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        Retour
      </Link>

      <SectionHeader
        eyebrow="Fantasy"
        title={mode === "semaine" ? `Classement — Journée ${journee}` : `Classement — ${monthLabel(monthStart)}`}
        subtitle="Tous les joueurs AfroLive, classés sur leur Starting XI."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/fantasy/xi/leaderboard?mode=semaine&journee=${journee}`}
          className={cn(
            "flex min-h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
            mode === "semaine" ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted"
          )}
        >
          Semaine
        </Link>
        <Link
          href={`/fantasy/xi/leaderboard?mode=mois&month=${monthKey(monthStart)}`}
          className={cn(
            "flex min-h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
            mode === "mois" ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-muted"
          )}
        >
          Mois
        </Link>
        {mode === "mois" && <LeaderboardMonthPicker months={monthOptions} selected={monthKey(monthStart)} />}
      </div>

      {dataUnavailable || entries === null ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          Classement indisponible pour l&apos;instant.
        </p>
      ) : (
        <LeaderboardView
          entries={entries}
          emptyMessage={
            mode === "semaine"
              ? "Personne n'a encore composé d'équipe pour cette journée."
              : "Personne n'a encore de classement pour ce mois."
          }
        />
      )}
    </div>
  );
}
