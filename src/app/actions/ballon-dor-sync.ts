"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveActor } from "@/lib/auth";
import type { BallonDorRanking } from "@/lib/ballon-dor";

// Best-effort background sync, called right after a local save (see
// components/fantasy/ballon-dor-view.tsx) — degrades to a no-op if
// Supabase isn't configured. One row per identity, always overwritten —
// there's only ever one live prediction, not a per-journée dimension.
// Converges onto the signed-in account's row when one exists (see
// lib/auth.ts's resolveActor).
export async function syncBallonDorPrediction(
  deviceId: string,
  username: string,
  rankings: BallonDorRanking
): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };
  const actor = await resolveActor(deviceId);

  const { error } = await supabase.from("ballon_dor_predictions").upsert(
    {
      device_id: deviceId,
      ...(actor.userId ? { user_id: actor.userId } : {}),
      username,
      rankings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: actor.matchColumn }
  );
  return { ok: !error };
}
