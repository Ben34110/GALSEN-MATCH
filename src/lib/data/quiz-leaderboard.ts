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

export interface QuizWeeklyLeaderboardEntry {
  deviceId: string;
  userId: string | null;
  username: string;
  total: number;
}

// "Classement général" — each identity's THIS-WEEK best score per theme
// (quiz_weekly_scores, distinct from quiz_scores' all-time bests), summed
// across every theme they've played this week. A new week starting is
// what "resets" this: last week's rows simply stop being read once `week`
// moves on, nothing needs to be cleared.
export async function getQuizWeeklyLeaderboard(week: number): Promise<QuizWeeklyLeaderboardEntry[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("quiz_weekly_scores")
    .select("device_id, user_id, username, best_score")
    .eq("week", week);
  if (error || !data) return null;

  const totals = new Map<string, QuizWeeklyLeaderboardEntry>();
  for (const row of data) {
    const key = (row.user_id as string | null) ?? (row.device_id as string);
    const existing = totals.get(key);
    if (existing) {
      existing.total += row.best_score as number;
    } else {
      totals.set(key, {
        deviceId: row.device_id as string,
        userId: row.user_id as string | null,
        username: row.username as string,
        total: row.best_score as number,
      });
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}
