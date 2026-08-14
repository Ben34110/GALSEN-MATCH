"use client";

import Image from "next/image";
import { getGroupStageTeamFlag } from "@/lib/data/group-stage-helpers";

// Every entrant in the U17 World Cup / CAN qualifiers group stages is a
// national team — a flag reads faster than the federation crest
// API-Football serves as `team.logo`, matching the flag-first treatment
// used everywhere else a nation is shown in this app (fifa-ranking-table.tsx,
// player-picker-sheet.tsx). Falls back to the crest for the rare name
// getGroupStageTeamFlag can't resolve — a group's standings table needs all
// 4 of its teams even though the U17 World Cup's fixtures list is itself
// filtered to African-only matches.
export function TeamFlagOrCrest({ name, logo, size }: { name: string; logo: string; size: number }) {
  const flag = getGroupStageTeamFlag(name);
  if (flag) {
    return (
      <span className="inline-block shrink-0 text-center leading-none" style={{ width: size, fontSize: size * 0.85 }} aria-hidden>
        {flag}
      </span>
    );
  }
  return (
    <Image
      src={logo}
      alt=""
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
      unoptimized
    />
  );
}
