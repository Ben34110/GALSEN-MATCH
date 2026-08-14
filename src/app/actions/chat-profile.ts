"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { hasQuizHallOfFameBadge } from "@/lib/data/quiz-hall-of-fame";

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
  ballonDorTop3: string[]; // rankings.slice(0, 3); [] if that identity never predicted
  tiktokHandle: string | null;
  // The one badge visible to someone viewing ANOTHER identity's profile —
  // see lib/badges.ts's "quiz-podium". Every other badge in BADGES is
  // computed from the viewer's OWN localStorage (components/profil/
  // badges-section.tsx), which has no way to answer "does *this other*
  // identity have it" — this one can, since quiz_hall_of_fame is a
  // server-side record keyed by identity, not local device state.
  hasQuizHallOfFameBadge: boolean;
}

// Reads two tables for someone else's identity — the first place in this
// app that reads back another identity's synced data (every other
// Supabase-backed profile/prediction table is otherwise write-only per
// caller). A clicked message carries either a userId (sender was signed in)
// or just a deviceId (guest sender) — see ChatMessage in types/index.ts —
// so this looks up by whichever the message actually has, userId taking
// priority when both happen to be present. null when that identity has
// never synced a profile, or Supabase isn't configured.
export async function getChatProfile(deviceId: string, userId: string | null): Promise<ChatProfileBundle | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const matchColumn = userId ? "user_id" : "device_id";
  const matchValue = userId ?? deviceId;

  const { data: profileRow, error } = await supabase
    .from("user_profiles")
    .select("device_id, username, country_id, player_ids, tiktok_handle")
    .eq(matchColumn, matchValue)
    .maybeSingle();
  if (error || !profileRow) return null;

  const [{ data: ballonDorRow }, hasQuizBadge] = await Promise.all([
    supabase.from("ballon_dor_predictions").select("rankings").eq(matchColumn, matchValue).maybeSingle(),
    hasQuizHallOfFameBadge(profileRow.device_id, userId),
  ]);

  return {
    deviceId: profileRow.device_id,
    hasQuizHallOfFameBadge: hasQuizBadge,
    username: profileRow.username,
    countryId: profileRow.country_id,
    playerIds: Array.isArray(profileRow.player_ids) ? profileRow.player_ids : [],
    ballonDorTop3: Array.isArray(ballonDorRow?.rankings) ? ballonDorRow.rankings.slice(0, 3) : [],
    tiktokHandle: profileRow.tiktok_handle ?? null,
  };
}
