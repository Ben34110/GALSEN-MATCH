"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOrCreateDeviceId } from "@/lib/device-id";
import type { LeaderboardEntry } from "@/lib/data/fantasy-leaderboard";

const RANK_COLORS = ["text-accent-2", "text-muted", "text-accent-3"];

export function LeaderboardView({ entries }: { entries: LeaderboardEntry[] }) {
  // Read only on the client — the device id is meaningless to the server
  // render (and shouldn't be, there's no session), it's purely for
  // highlighting "you" in the already-fetched list.
  const [deviceId, setDeviceId] = useState<string | null>(null);
  useEffect(() => {
    Promise.resolve(getOrCreateDeviceId()).then(setDeviceId);
  }, []);

  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        Personne n&apos;a encore composé d&apos;équipe pour cette journée.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {entries.map((entry, index) => {
        const isMe = entry.deviceId === deviceId;
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
              <span className="block text-[11px] text-muted">{entry.filled}/11 joueurs</span>
            </span>
            <span className="shrink-0 text-lg font-extrabold tabular-nums text-accent">{entry.points}</span>
          </li>
        );
      })}
    </ol>
  );
}
