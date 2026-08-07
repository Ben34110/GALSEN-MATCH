"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { QuizTheme } from "@/types";

// Best-effort background sync, called only when the client already knows
// locally that `score` beat its previous best for this theme (see
// hooks/use-quiz-best-scores.ts's saveQuizBestScoreIfImproved) — no
// server-side compare needed, single-writer-per-row same as every other
// device-scoped sync action in this app.
export async function syncQuizScore(deviceId: string, theme: QuizTheme, username: string, score: number): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase.from("quiz_scores").upsert(
    {
      device_id: deviceId,
      theme,
      username,
      best_score: score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_id,theme" }
  );
  return { ok: !error };
}
