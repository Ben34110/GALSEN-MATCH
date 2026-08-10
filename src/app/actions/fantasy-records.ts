"use server";

import { resolveActor } from "@/lib/auth";
import { hasEverRankedFirst } from "@/lib/data/fantasy-records";

// Called from components/profil/badges-section.tsx to unlock the
// "top-semaine" badge — server-derived (needs every past journée's
// leaderboard), unlike every other badge in lib/badges.ts which is computed
// synchronously from localStorage alone.
export async function checkTopWeeklyRankRecord(deviceId: string): Promise<boolean> {
  const actor = await resolveActor(deviceId);
  return hasEverRankedFirst(deviceId, actor.userId);
}
