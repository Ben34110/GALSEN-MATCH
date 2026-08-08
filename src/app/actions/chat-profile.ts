"use server";

import { getSupabaseAdmin } from "@/lib/supabase";

// The bundle shown in the chat profile sheet (see
// components/chat/chat-profile-sheet.tsx) when a message is clicked.
// playerIds/ballonDorTop3 are resolved to full AfricanPlayer objects
// client-side against an already-loaded pool — same convention as
// ballon-dor-view.tsx/preferences-editor.tsx, no point re-shipping the
// player JSON from here too.
export interface ChatProfileBundle {
  deviceId: string;
  username: string;
  countryId: string | null;
  playerIds: string[];
  ballonDorTop3: string[]; // rankings.slice(0, 3); [] if that device never predicted
  tiktokHandle: string | null;
}

// Reads two device-scoped tables for someone else's device_id — the first
// place in this app that reads back another device's synced data (every
// other Supabase-backed profile/prediction table is otherwise write-only
// per device). null only when this device has never synced a profile
// (hasn't opened the app since Live Chat shipped — see
// onboarding-gate.tsx's sync effect, which self-heals on their next visit)
// or Supabase isn't configured.
export async function getChatProfile(deviceId: string): Promise<ChatProfileBundle | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: profileRow, error } = await supabase
    .from("user_profiles")
    .select("device_id, username, country_id, player_ids, tiktok_handle")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error || !profileRow) return null;

  const { data: ballonDorRow } = await supabase
    .from("ballon_dor_predictions")
    .select("rankings")
    .eq("device_id", deviceId)
    .maybeSingle();

  return {
    deviceId: profileRow.device_id,
    username: profileRow.username,
    countryId: profileRow.country_id,
    playerIds: Array.isArray(profileRow.player_ids) ? profileRow.player_ids : [],
    ballonDorTop3: Array.isArray(ballonDorRow?.rankings) ? ballonDorRow.rankings.slice(0, 3) : [],
    tiktokHandle: profileRow.tiktok_handle ?? null,
  };
}
