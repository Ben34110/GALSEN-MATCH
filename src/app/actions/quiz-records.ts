"use server";

import { resolveActor } from "@/lib/auth";
import { hasQuizHallOfFameBadge } from "@/lib/data/quiz-hall-of-fame";

// Called from components/profil/badges-section.tsx to unlock the
// "quiz-podium" badge — server-derived (needs the quiz_hall_of_fame
// archive), same pattern as app/actions/fantasy-records.ts's
// checkTopWeeklyRankRecord for the "top-semaine" badge.
export async function checkQuizHallOfFameRecord(deviceId: string): Promise<boolean> {
  const actor = await resolveActor(deviceId);
  return hasQuizHallOfFameBadge(deviceId, actor.userId);
}
