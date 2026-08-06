"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { SeatMap } from "@/lib/fantasy-lineup";

// Best-effort background sync, called after every local squad change (see
// components/fantasy/fantasy-view.tsx) — degrades to a no-op if Supabase
// isn't configured, same as the notification prefs actions. Powers the
// leaderboard (app/(app)/fantasy/leaderboard/page.tsx), which ranks every
// device's squad for a journée.
export async function syncFantasySquad(
  deviceId: string,
  journee: number,
  username: string,
  seats: SeatMap,
  captainId: string | null
): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase.from("fantasy_squads").upsert(
    {
      device_id: deviceId,
      journee,
      username,
      seats,
      captain_id: captainId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_id,journee" }
  );
  return { ok: !error };
}
