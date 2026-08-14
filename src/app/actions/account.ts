"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/lib/auth";

// Deletes the signed-in account entirely. Deliberately does NOT delete row
// by row across every device-scoped table (fantasy_squads, chat_messages,
// user_profiles, ...) — deleting the auth.users row itself cascades all of
// them automatically via the `on delete cascade` foreign keys added in
// supabase/schema.sql's "Optional real accounts" migration block, so a
// single admin call is both simpler and can't drift out of sync with that
// table list as new ones are added. The one deliberate exception is
// friend_leagues.creator_user_id (`on delete set null`, not cascade) — a
// league someone created doesn't vanish out from under its other members
// just because the creator deleted their account.
//
// Only reachable for a signed-in caller — there's no "account" to delete
// for a guest (device_id) identity; a guest wipes their own local data by
// clearing site data in their browser, no server call needed.
export async function deleteAccount(): Promise<{ ok: boolean }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase.auth.admin.deleteUser(userId);
  return { ok: !error };
}
