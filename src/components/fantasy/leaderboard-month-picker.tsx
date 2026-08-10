"use client";

import { useRouter } from "next/navigation";

export interface MonthOption {
  key: string; // "YYYY-MM"
  label: string; // "Août 2026"
}

// A plain <select> instead of the app's usual Link-based tab pattern — a
// month picker needs one control among a growing, unbounded list of
// options (every month since journée 1), which reads better as a dropdown
// than as a wrapping row of Link "tabs" the way the Semaine/Mois toggle
// above it works.
export function LeaderboardMonthPicker({ months, selected }: { months: MonthOption[]; selected: string }) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(event) => router.push(`/fantasy/xi/leaderboard?mode=mois&month=${event.target.value}`)}
      className="min-h-11 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground"
    >
      {months.map((month) => (
        <option key={month.key} value={month.key}>
          {month.label}
        </option>
      ))}
    </select>
  );
}
