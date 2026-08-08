"use server";

import { getSupabaseAdmin } from "@/lib/supabase";

// Best-effort background sync, called whenever the local onboarding profile
// changes (see components/onboarding/onboarding-gate.tsx) — degrades to a
// no-op if Supabase isn't configured, same pattern as syncFantasySquad.
// One row per device, always overwritten (onConflict: "device_id"). Unlike
// ballon_dor_predictions, this row IS read back for devices other than the
// caller's own — see app/actions/chat-profile.ts, which powers the "click a
// chat message to see who sent it" profile sheet.
export async function syncUserProfile(
  deviceId: string,
  username: string,
  countryId: string,
  playerIds: string[],
  favoriteClubId: number | null,
  tiktokHandle: string | null
): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase.from("user_profiles").upsert(
    {
      device_id: deviceId,
      username,
      country_id: countryId,
      player_ids: playerIds,
      favorite_club_id: favoriteClubId,
      tiktok_handle: tiktokHandle,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_id" }
  );
  return { ok: !error };
}
