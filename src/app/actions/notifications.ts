"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_CLUB_PREFS, DEFAULT_PLAYER_PREFS, type ClubNotificationPrefs, type PlayerNotificationPrefs } from "@/lib/notification-prefs";

// Every action here degrades gracefully (returns { ok: false }) instead of
// throwing when Supabase isn't configured yet (see lib/supabase.ts) — the
// rest of the app (favoriting, preferences UI) stays usable without
// notifications wired up; only the "enable notifications" pieces no-op.
//
// A "use server" file may only export async functions — types and the
// DEFAULT_*_PREFS constants live in lib/notification-prefs.ts instead, and
// are re-exported... actually just imported directly by callers.

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function saveDeviceSubscription(deviceId: string, subscription: PushSubscriptionPayload): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      device_id: deviceId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "device_id" }
  );
  return { ok: !error };
}

export async function saveClubNotificationPrefs(
  deviceId: string,
  teamId: number,
  prefs: ClubNotificationPrefs
): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase.from("favorite_club_notifications").upsert(
    {
      device_id: deviceId,
      team_id: teamId,
      notify_lineup: prefs.notifyLineup,
      notify_goals: prefs.notifyGoals,
      notify_kickoff: prefs.notifyKickoff,
      notify_fulltime: prefs.notifyFulltime,
    },
    { onConflict: "device_id,team_id" }
  );
  return { ok: !error };
}

export async function getClubNotificationPrefs(deviceId: string, teamId: number): Promise<ClubNotificationPrefs> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return DEFAULT_CLUB_PREFS;

  const { data } = await supabase
    .from("favorite_club_notifications")
    .select("notify_lineup, notify_goals, notify_kickoff, notify_fulltime")
    .eq("device_id", deviceId)
    .eq("team_id", teamId)
    .maybeSingle();
  if (!data) return DEFAULT_CLUB_PREFS;

  return {
    notifyLineup: data.notify_lineup,
    notifyGoals: data.notify_goals,
    notifyKickoff: data.notify_kickoff,
    notifyFulltime: data.notify_fulltime,
  };
}

export async function deleteClubNotificationPrefs(deviceId: string, teamId: number): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase
    .from("favorite_club_notifications")
    .delete()
    .eq("device_id", deviceId)
    .eq("team_id", teamId);
  return { ok: !error };
}

export async function savePlayerNotificationPrefs(
  deviceId: string,
  playerId: number,
  prefs: PlayerNotificationPrefs
): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase.from("favorite_player_notifications").upsert(
    {
      device_id: deviceId,
      player_id: playerId,
      notify_lineup: prefs.notifyLineup,
      notify_goal: prefs.notifyGoal,
      notify_assist: prefs.notifyAssist,
      notify_card: prefs.notifyCard,
      notify_rating: prefs.notifyRating,
    },
    { onConflict: "device_id,player_id" }
  );
  return { ok: !error };
}

export async function getPlayerNotificationPrefs(deviceId: string, playerId: number): Promise<PlayerNotificationPrefs> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return DEFAULT_PLAYER_PREFS;

  const { data } = await supabase
    .from("favorite_player_notifications")
    .select("notify_lineup, notify_goal, notify_assist, notify_card, notify_rating")
    .eq("device_id", deviceId)
    .eq("player_id", playerId)
    .maybeSingle();
  if (!data) return DEFAULT_PLAYER_PREFS;

  return {
    notifyLineup: data.notify_lineup,
    notifyGoal: data.notify_goal,
    notifyAssist: data.notify_assist,
    notifyCard: data.notify_card,
    notifyRating: data.notify_rating,
  };
}

export async function deletePlayerNotificationPrefs(deviceId: string, playerId: number): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase
    .from("favorite_player_notifications")
    .delete()
    .eq("device_id", deviceId)
    .eq("player_id", playerId);
  return { ok: !error };
}

// A device subscribes to a country's news the same on/off way it favorites
// a club — no sub-options like club/player notifications have, a country
// either pushes new articles to this device or it doesn't. Delivery
// happens in api/cron/fetch-news/route.ts, right after a sync inserts new
// rows for that country.
export async function saveNewsNotificationPref(deviceId: string, country: string): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase
    .from("news_notification_prefs")
    .upsert({ device_id: deviceId, country }, { onConflict: "device_id,country" });
  return { ok: !error };
}

export async function deleteNewsNotificationPref(deviceId: string, country: string): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };

  const { error } = await supabase.from("news_notification_prefs").delete().eq("device_id", deviceId).eq("country", country);
  return { ok: !error };
}

export async function getNewsNotificationCountries(deviceId: string): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data } = await supabase.from("news_notification_prefs").select("country").eq("device_id", deviceId);
  return (data ?? []).map((row) => row.country as string);
}
