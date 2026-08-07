"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { BallonDorRanking } from "@/lib/ballon-dor";

// Best-effort background sync, called right after a local save (see
// components/fantasy/ballon-dor-view.tsx) — degrades to a no-op if
// Supabase isn't configured, same pattern as syncFantasySquad. One row per
// device, always overwritten (onConflict: "device_id" — there's only ever
// one live prediction, not a per-journée dimension).
export async function syncBallonDorPrediction(
  deviceId: string,
  username: string,
  rankings: BallonDorRanking
): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase.from("ballon_dor_predictions").upsert(
    {
      device_id: deviceId,
      username,
      rankings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_id" }
  );
  return { ok: !error };
}
