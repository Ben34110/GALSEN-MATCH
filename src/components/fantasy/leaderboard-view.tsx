"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentIdentity, isCurrentIdentity } from "@/hooks/use-current-identity";

const RANK_COLORS = ["text-accent-2", "text-muted", "text-accent-3"];

// Normalized shape shared by the weekly (per-journée) and monthly
// (aggregated) leaderboards — `secondaryLabel` is the one field that
// differs by mode ("X/11 joueurs" vs "X journées jouées"), computed by the
// page before handing rows to this purely-presentational component.
export interface LeaderboardRow {
  deviceId: string;
  userId: string | null;
  username: string;
  points: number;
  secondaryLabel: string;
}

export function LeaderboardView({ entries, emptyMessage }: { entries: LeaderboardRow[]; emptyMessage: string }) {
  const identity = useCurrentIdentity();

  if (entries.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">{emptyMessage}</p>;
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
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {entry.username}
                {isMe && " (toi)"}
              </span>
              <span className="block text-[11px] text-muted">{entry.secondaryLabel}</span>
            </span>
            <span className="shrink-0 text-lg font-extrabold tabular-nums text-accent">{entry.points}</span>
          </li>
        );
      })}
    </ol>
  );
}
