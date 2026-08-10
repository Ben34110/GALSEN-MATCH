"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveActor } from "@/lib/auth";
import type { FantasyStorage, SeatMap } from "@/lib/fantasy-lineup";

// Best-effort background sync, called after every local squad change (see
// components/fantasy/fantasy-view.tsx) — degrades to a no-op if Supabase
// isn't configured, same as the notification prefs actions. Powers the
// leaderboard (app/(app)/fantasy/leaderboard/page.tsx), which ranks every
// device's/account's squad for a journée. Converges onto the signed-in
// account's row when one exists (see lib/auth.ts's resolveActor).
export async function syncFantasySquad(
  deviceId: string,
  journee: number,
  username: string,
  seats: SeatMap,
  captainId: string | null,
  locked: boolean
): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };
  const actor = await resolveActor(deviceId);

  const { error } = await supabase.from("fantasy_squads").upsert(
    {
      device_id: deviceId,
      ...(actor.userId ? { user_id: actor.userId } : {}),
      journee,
      username,
      seats,
      captain_id: captainId,
      locked,
      updated_at: new Date().toISOString(),
    },
    { onConflict: `${actor.matchColumn},journee` }
  );
  return { ok: !error };
}

// Restores every journée's squad for a signed-in account onto a *new*
// device/browser — called right after sign-in (see onboarding-gate.tsx and
// app/onboarding/page.tsx's proceedAfterSignIn), the same moment the
// onboarding profile itself gets restored via getProfileByUserId. Without
// this, FANTASY_LINEUP_STORAGE_KEY has no restore path at all: it's
// normally never read from Supabase (see fantasy-leaderboard.ts's own
// comment on why — local storage is the source of truth for the pitch
// view), which is fine on the *same* device continuously, but leaves a
// signed-in account's squad with nothing to repopulate from on a device
// that never had it locally — including this same device right after
// LogoutButton deliberately wipes it as part of signing out.
export async function getFantasySquadsByUserId(userId: string): Promise<FantasyStorage> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return {};

  const { data, error } = await supabase.from("fantasy_squads").select("journee, seats, captain_id, locked").eq("user_id", userId);
  if (error || !data) return {};

  const storage: FantasyStorage = {};
  for (const row of data) {
    storage[row.journee] = { seats: row.seats as SeatMap, captainId: row.captain_id, locked: row.locked };
  }
  return storage;
}
