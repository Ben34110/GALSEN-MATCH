"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveActor } from "@/lib/auth";
import type { SeatMap } from "@/lib/fantasy-lineup";

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
