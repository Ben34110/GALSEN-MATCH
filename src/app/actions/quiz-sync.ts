"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveActor } from "@/lib/auth";
import type { QuizTheme } from "@/types";

// Best-effort background sync, called only when the client already knows
// locally that `score` beat its previous best for this theme (see
// hooks/use-quiz-best-scores.ts's saveQuizBestScoreIfImproved) — no
// server-side compare needed, single-writer-per-row same as every other
// device-scoped sync action in this app. Converges onto the signed-in
// account's row when one exists (see lib/auth.ts's resolveActor), falls
// back to the guest device_id otherwise.
export async function syncQuizScore(deviceId: string, theme: QuizTheme, username: string, score: number): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };
  const actor = await resolveActor(deviceId);

  // The "only write if it's an improvement" check normally happens
  // client-side (see the comment above) — correct for a guest, since
  // there's only ever one device to compare against. Once signed in, a
  // second device could have already synced a higher score onto this same
  // account row than the one this device knows about locally, so a signed-
  // in write re-checks against the account's actual stored score before
  // overwriting it.
  if (actor.userId) {
    const { data: existing } = await supabase
      .from("quiz_scores")
      .select("best_score")
      .eq("user_id", actor.userId)
      .eq("theme", theme)
      .maybeSingle();
    if (existing && existing.best_score >= score) return { ok: true };
  }

  const { error } = await supabase.from("quiz_scores").upsert(
    {
      device_id: deviceId,
      ...(actor.userId ? { user_id: actor.userId } : {}),
      theme,
      username,
      best_score: score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: `${actor.matchColumn},theme` }
  );
  return { ok: !error };
}

// The weekly counterpart — called on every completed run regardless of
// whether it beat the all-time best (unlike syncQuizScore above), since a
// run can be this WEEK's best without beating an all-time record set in a
// previous week. Always re-checks server-side rather than trusting a local
// "is this an improvement" flag, for the same reason: there's no existing
// local weekly-best cache to compare against client-side (see
// use-quiz-best-scores.ts, which only ever tracked the all-time value).
export async function syncQuizWeeklyScore(
  deviceId: string,
  theme: QuizTheme,
  week: number,
  username: string,
  score: number
): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };
  const actor = await resolveActor(deviceId);

  const { data: existing } = await supabase
    .from("quiz_weekly_scores")
    .select("best_score")
    .eq(actor.matchColumn, actor.matchValue)
    .eq("theme", theme)
    .eq("week", week)
    .maybeSingle();
  if (existing && existing.best_score >= score) return { ok: true };

  const { error } = await supabase.from("quiz_weekly_scores").upsert(
    {
      device_id: deviceId,
      ...(actor.userId ? { user_id: actor.userId } : {}),
      theme,
      week,
      username,
      best_score: score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: `${actor.matchColumn},theme,week` }
  );
  return { ok: !error };
}
