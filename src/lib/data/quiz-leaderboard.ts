import { getSupabaseAdmin } from "@/lib/supabase";
import type { QuizTheme } from "@/types";

export interface QuizLeaderboardEntry {
  deviceId: string;
  userId: string | null;
  username: string;
  bestScore: number;
}

// null = Supabase not configured/read failed, [] = configured but nobody's
// played this theme yet — same null-vs-empty convention as
// fantasy-leaderboard.ts's getLeaderboard. Unlike that one, best_score is
// read directly rather than recomputed: a quiz result doesn't depend on
// any external mutable stat the way fantasy points depend on real match
// data, so what's stored is already final.
export async function getQuizLeaderboard(theme: QuizTheme): Promise<QuizLeaderboardEntry[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("quiz_scores")
    .select("device_id, user_id, username, best_score")
    .eq("theme", theme)
    .order("best_score", { ascending: false });
  if (error || !data) return null;

  return data.map(
    (row): QuizLeaderboardEntry => ({
      deviceId: row.device_id,
      userId: row.user_id,
      username: row.username,
      bestScore: row.best_score,
    })
  );
}
