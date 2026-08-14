"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveActor, getAuthenticatedUserId } from "@/lib/auth";

// Best-effort background sync, called whenever the local onboarding profile
// changes (see components/onboarding/onboarding-gate.tsx) — degrades to a
// no-op if Supabase isn't configured, same pattern as syncFantasySquad.
// One row per identity, always overwritten. Unlike ballon_dor_predictions,
// this row IS read back for identities other than the caller's own — see
// app/actions/chat-profile.ts, which powers the "click a chat message to
// see who sent it" profile sheet. Converges onto the signed-in account's
// row when one exists (see lib/auth.ts's resolveActor) — this is what
// makes the profile actually restorable on a second device.
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
  const actor = await resolveActor(deviceId);

  const { error } = await supabase.from("user_profiles").upsert(
    {
      device_id: deviceId,
      ...(actor.userId ? { user_id: actor.userId } : {}),
      username,
      country_id: countryId,
      player_ids: playerIds,
      favorite_club_id: favoriteClubId,
      tiktok_handle: tiktokHandle,
      updated_at: new Date().toISOString(),
    },
    { onConflict: actor.matchColumn }
  );
  return { ok: !error };
}

// Case-insensitive uniqueness check for the "rename in Profil" flow
// (components/profil/username-editor.tsx). Enforced here at the
// application level, not a DB constraint — user_profiles.username has no
// unique index, and real duplicates already exist in production data
// (multiple guest rows named the same thing before this feature existed),
// so a blind unique index would fail to create without a separate cleanup
// pass first. "Taken" means some OTHER identity (not this device, and not
// this account if signed in) already has it — renaming to your own current
// name, or an account restoring its own name on a new device, must not
// trip this.
export async function isUsernameTaken(username: string, deviceId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const actor = await resolveActor(deviceId);

  const { data, error } = await supabase.from("user_profiles").select("device_id, user_id").ilike("username", username);
  if (error || !data) return false;

  return data.some((row) => {
    const isMine = row.device_id === deviceId || (actor.userId != null && row.user_id === actor.userId);
    return !isMine;
  });
}

// Cross-device restore: called by OnboardingGate when a session exists but
// this particular browser has no local profile yet (a fresh device signing
// into an existing account) — fetches the account's previously-synced
// profile so the wizard can be skipped instead of starting from zero.
//
// Reads the account to restore off the server-side session
// (getAuthenticatedUserId) rather than trusting a client-supplied userId —
// a Server Action is a callable endpoint, not UI-gated, so a userId
// parameter here would let anyone who knows (or enumerates) another
// account's id restore and read that account's synced profile through this
// same action. The caller's freshly-resolved supabase.auth.getUser().id is
// always what ends up authenticated server-side by the time this runs
// anyway (same session, same cookies), so dropping the parameter changes
// nothing for legitimate callers.
export interface RestoredProfile {
  countryId: string;
  playerIds: string[];
  username: string;
  favoriteClubId: number | null;
  tiktokHandle: string | null;
}

export async function getProfileByUserId(): Promise<RestoredProfile | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("country_id, player_ids, username, favorite_club_id, tiktok_handle")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    countryId: data.country_id,
    playerIds: Array.isArray(data.player_ids) ? data.player_ids : [],
    username: data.username,
    favoriteClubId: data.favorite_club_id ?? null,
    tiktokHandle: data.tiktok_handle ?? null,
  };
}
