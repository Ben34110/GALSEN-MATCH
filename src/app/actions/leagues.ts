"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveActor } from "@/lib/auth";
import { getLeaderboard } from "@/lib/data/fantasy-leaderboard";

// Excludes 0/O/1/I/L — a code meant to be read aloud or typed by a friend
// shouldn't hinge on telling those apart.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

export interface FriendLeague {
  id: string;
  code: string;
  name: string;
  memberCount: number;
}

// league_id + whichever of device_id/user_id resolveActor() picked — see
// the two separate unique indexes in supabase/schema.sql (one per
// identity column, not a single composite over both, since a row only
// ever has one of the two set in practice).
function memberConflictTarget(matchColumn: "user_id" | "device_id"): string {
  return matchColumn === "user_id" ? "league_id,user_id" : "league_id,device_id";
}

// Retries on a code collision (23505 = unique_violation on the `code`
// column) rather than checking existence first — a plain insert-and-retry
// avoids a check-then-insert race between two people creating a league in
// the same instant, at the cost of a rare wasted round-trip.
export async function createLeague(deviceId: string, name: string): Promise<{ ok: true; league: FriendLeague } | { ok: false }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };
  const actor = await resolveActor(deviceId);
  const trimmedName = name.trim().slice(0, 40);
  if (!trimmedName) return { ok: false };

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("friend_leagues")
      .insert({
        code,
        name: trimmedName,
        creator_device_id: deviceId,
        ...(actor.userId ? { creator_user_id: actor.userId } : {}),
      })
      .select("id, code, name")
      .single();

    if (error) {
      if (error.code === "23505") continue; // code collision — try another
      return { ok: false };
    }

    await supabase.from("friend_league_members").upsert(
      { league_id: data.id, device_id: deviceId, ...(actor.userId ? { user_id: actor.userId } : {}) },
      { onConflict: memberConflictTarget(actor.matchColumn) }
    );
    return { ok: true, league: { id: data.id, code: data.code, name: data.name, memberCount: 1 } };
  }
  return { ok: false };
}

export async function joinLeague(
  deviceId: string,
  code: string
): Promise<{ ok: true; league: FriendLeague } | { ok: false; reason: "not-found" | "error" }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, reason: "error" };
  const actor = await resolveActor(deviceId);
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return { ok: false, reason: "not-found" };

  const { data: league } = await supabase.from("friend_leagues").select("id, code, name").eq("code", normalizedCode).maybeSingle();
  if (!league) return { ok: false, reason: "not-found" };

  const { error } = await supabase.from("friend_league_members").upsert(
    { league_id: league.id, device_id: deviceId, ...(actor.userId ? { user_id: actor.userId } : {}) },
    { onConflict: memberConflictTarget(actor.matchColumn) }
  );
  if (error) return { ok: false, reason: "error" };

  const { count } = await supabase
    .from("friend_league_members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", league.id);
  return { ok: true, league: { id: league.id, code: league.code, name: league.name, memberCount: count ?? 1 } };
}

export async function leaveLeague(deviceId: string, leagueId: string): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false };
  const actor = await resolveActor(deviceId);
  const { error } = await supabase
    .from("friend_league_members")
    .delete()
    .eq("league_id", leagueId)
    .eq(actor.matchColumn, actor.matchValue);
  return { ok: !error };
}

export async function getMyLeagues(deviceId: string): Promise<FriendLeague[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const actor = await resolveActor(deviceId);

  const { data: memberships } = await supabase
    .from("friend_league_members")
    .select("league_id")
    .eq(actor.matchColumn, actor.matchValue);
  if (!memberships || memberships.length === 0) return [];

  const leagueIds = memberships.map((m) => m.league_id as string);
  const [{ data: leagues }, { data: allMembers }] = await Promise.all([
    supabase.from("friend_leagues").select("id, code, name").in("id", leagueIds),
    supabase.from("friend_league_members").select("league_id").in("league_id", leagueIds),
  ]);
  if (!leagues) return [];

  const counts = new Map<string, number>();
  for (const m of allMembers ?? []) counts.set(m.league_id as string, (counts.get(m.league_id as string) ?? 0) + 1);

  return leagues.map((l) => ({ id: l.id, code: l.code, name: l.name, memberCount: counts.get(l.id) ?? 1 }));
}

export interface LeagueLeaderboardEntry {
  username: string;
  points: number;
  filled: number;
  isMe: boolean;
}

// Filters the same cached weekly leaderboard (lib/data/fantasy-
// leaderboard.ts's getLeaderboard, unstable_cache'd) down to this league's
// members — no separate scoring pipeline, so a league's numbers can never
// disagree with the main leaderboard's for the same journée.
export async function getLeagueLeaderboard(deviceId: string, leagueId: string, journee: number): Promise<LeagueLeaderboardEntry[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const actor = await resolveActor(deviceId);
  const myKey = actor.userId ?? deviceId;

  const { data: members } = await supabase.from("friend_league_members").select("device_id, user_id").eq("league_id", leagueId);
  if (!members || members.length === 0) return [];
  const memberKeys = new Set(members.map((m) => (m.user_id as string | null) ?? (m.device_id as string)));

  const fullLeaderboard = await getLeaderboard(journee);
  if (!fullLeaderboard) return null;

  return fullLeaderboard
    .filter((entry) => memberKeys.has(entry.userId ?? entry.deviceId))
    .map((entry) => ({
      username: entry.username,
      points: entry.points,
      filled: entry.filled,
      isMe: (entry.userId ?? entry.deviceId) === myKey,
    }));
}
