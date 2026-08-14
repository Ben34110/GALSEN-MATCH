import { LeaderboardView, type LeaderboardRow } from "@/components/fantasy/leaderboard-view";
import { getLeaderboard, getMonthlyLeaderboard } from "@/lib/data/fantasy-leaderboard";
import { getGameweekInfo, getAvailableLeaderboardMonths } from "@/lib/fantasy-gameweek";
import type { MonthOption } from "@/components/fantasy/leaderboard-month-picker";

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

  const weeklyRows: LeaderboardRow[] | null = weeklyEntries?.map((entry) => ({ ...entry, journeesPlayed: null })) ?? null;
  const monthlyRows: LeaderboardRow[] | null =
    monthlyEntries?.map((entry) => ({ ...entry, filled: null })) ?? null;

  const entries = mode === "semaine" ? weeklyRows : monthlyRows;
  const dataUnavailable = mode === "semaine" ? weeklyEntries === null : monthlyEntries === null;

  return (
    <div>
      <LeaderboardView
        mode={mode}
        journee={journee}
        monthLabel={monthLabel(monthStart)}
        monthOptions={monthOptions}
        selectedMonthKey={monthKey(monthStart)}
        weekHref={`/fantasy/xi/leaderboard?mode=semaine&journee=${journee}`}
        monthHref={`/fantasy/xi/leaderboard?mode=mois&month=${monthKey(monthStart)}`}
        entries={entries}
        dataUnavailable={dataUnavailable}
      />
    </div>
  );
}
