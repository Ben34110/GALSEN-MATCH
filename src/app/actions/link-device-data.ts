"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";

// Called once right after a successful sign-up/sign-in (see
// onboarding-gate.tsx and app/onboarding/page.tsx's account step), passing
// the browser's existing device_id — re-keys that device's rows onto the
// new account so signing up doesn't look like losing a squad/chat
// history/etc. Safe to call on every sign-in: the `is("user_id", null)`
// guard makes already-linked rows a no-op.
//
// Best-effort, not all-or-nothing: if this account already has its own row
// for a given identity dimension (e.g. it already synced a fantasy squad
// for this journée from another device), that row's UPDATE fails on the
// table's unique constraint and is simply skipped for that one row —
// nothing here is destructive, the guest device's data just stays
// unlinked for that specific row rather than blocking every other table.
const DEVICE_SCOPED_TABLES = [
  "push_subscriptions",
  "favorite_club_notifications",
  "favorite_player_notifications",
  "fantasy_squads",
  "news_notification_prefs",
  "quiz_scores",
  "ballon_dor_predictions",
  "chat_messages",
  "user_profiles",
] as const;

export async function linkDeviceData(deviceId: string): Promise<{ ok: boolean }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  await Promise.all(
    DEVICE_SCOPED_TABLES.map((table) => supabase.from(table).update({ user_id: userId }).eq("device_id", deviceId).is("user_id", null))
  );

  return { ok: true };
}
