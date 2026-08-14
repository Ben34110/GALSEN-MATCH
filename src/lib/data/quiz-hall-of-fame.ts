import { getSupabaseAdmin } from "@/lib/supabase";

export interface HallOfFameEntry {
  rank: number;
  username: string;
  totalScore: number;
}

export interface HallOfFameWeek {
  week: number;
  entries: HallOfFameEntry[];
}

// Every past week's top 3 quiz "classement général" (see cron/poll/
// route.ts's rollover block, which writes these once a week is over),
// most recent week first. null = Supabase not configured/read failed,
// [] = configured but no week has ever completed yet.
export async function getQuizHallOfFame(): Promise<HallOfFameWeek[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("quiz_hall_of_fame")
    .select("week, rank, username, total_score")
    .order("week", { ascending: false })
    .order("rank", { ascending: true });
  if (error || !data) return null;

  const byWeek = new Map<number, HallOfFameEntry[]>();
  for (const row of data) {
    const week = row.week as number;
    const entries = byWeek.get(week) ?? [];
    entries.push({ rank: row.rank as number, username: row.username as string, totalScore: row.total_score as number });
    byWeek.set(week, entries);
  }

  return Array.from(byWeek.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([week, entries]) => ({ week, entries }));
}

// "Has this identity ever placed top 3 in a week's aggregate quiz
// leaderboard" — appearing in quiz_hall_of_fame at all, for any past week,
// IS the badge (see lib/badges.ts's "quiz-podium" and its two call sites:
// components/profil/badges-section.tsx for the viewer's own profile,
// app/actions/chat-profile.ts for viewing someone else's).
export async function hasQuizHallOfFameBadge(deviceId: string, userId: string | null): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const matchColumn = userId ? "user_id" : "device_id";
  const matchValue = userId ?? deviceId;

  const { data } = await supabase.from("quiz_hall_of_fame").select("id").eq(matchColumn, matchValue).limit(1).maybeSingle();
  return Boolean(data);
}
