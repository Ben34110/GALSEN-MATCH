import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAfricanPlayers, positionCode } from "@/lib/data/african-players";
import { calculateRealLineupPoints } from "@/services/real-player-scoring";
import { getGameweekInfo, getJourneeWeekRange } from "@/lib/fantasy-gameweek";
import type { SeatMap } from "@/lib/fantasy-lineup";
import type { PlayerPosition } from "@/types";

export interface LeaderboardEntry {
  deviceId: string;
  userId: string | null;
  username: string;
  points: number;
  filled: number;
}

// Every squad's points, recomputed from scratch — real work (up to 11
// per-player rating lookups per squad, times every squad synced for the
// journée). Wrapped in unstable_cache below rather than called directly:
// components/fantasy/my-standing-prefetch.tsx polls this every 45s from
// *every* concurrently active session, and without a shared cache each of
// those polls independently recomputes every OTHER user's squad too, not
// just their own — the cost scales with (active users × squads), not just
// active users, which is the kind of thing that looks fine in testing and
// then falls over the first time real concurrent traffic shows up.
async function computeLeaderboard(journee: number): Promise<LeaderboardEntry[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("fantasy_squads")
    .select("device_id, user_id, username, seats, captain_id")
    .eq("journee", journee);
  if (error || !data) return null;

  const pool = getAfricanPlayers();

  const entries = await Promise.all(
    data.map(async (row): Promise<LeaderboardEntry> => {
      const seats = row.seats as SeatMap;
      const playerIds = Object.values(seats).filter((id): id is string => id !== null);
      const scoringEntries = playerIds
        .map((id) => pool.find((p) => String(p.id) === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((player) => ({ player, position: positionCode(player.position) ?? ("A" as PlayerPosition) }));
      return {
        deviceId: row.device_id,
        userId: row.user_id,
        username: row.username,
        points: await calculateRealLineupPoints(scoringEntries, row.captain_id, journee),
        filled: playerIds.length,
      };
    })
  );

  return entries.sort((a, b) => b.points - a.points);
}

// 30s: short enough that a goal's points still show up almost live, long
// enough that any number of concurrent pollers within the same window
// share the one computation instead of each paying for their own — see
// computeLeaderboard's comment. Uses Next's Data Cache (the same shared,
// cross-instance cache `fetch(..., {next:{revalidate}})` already relies on
// elsewhere in this app), not an in-memory Map, so this actually holds
// under multiple concurrent serverless instances rather than only helping
// requests that happen to land on the same warm one.
const getLeaderboardCached = unstable_cache(computeLeaderboard, ["fantasy-leaderboard"], { revalidate: 30 });

// Reads every device's synced squad for a journée (see
// app/actions/fantasy-sync.ts) and computes points against the same real
// player stats Fantasy itself uses. Returns null (not []) when Supabase
// isn't configured, so the page can tell "nobody's played yet" apart from
// "leaderboard unavailable".
export function getLeaderboard(journee: number): Promise<LeaderboardEntry[] | null> {
  return getLeaderboardCached(journee);
}

export interface MonthlyLeaderboardEntry {
  deviceId: string;
  userId: string | null;
  username: string;
  points: number;
  journeesPlayed: number;
}

// Sums each identity's per-journée points (the same real scoring the weekly
// view reads, just aggregated instead of read fresh — so the two views
// never disagree on a shared journée) across every journée whose calendar
// week starts inside the given month. `monthStart` must be the first of the
// month at UTC midnight (see getAvailableLeaderboardMonths).
export async function getMonthlyLeaderboard(monthStart: Date): Promise<MonthlyLeaderboardEntry[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { activeJournee } = getGameweekInfo();
  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));

  const journeesInMonth: number[] = [];
  for (let journee = 1; journee <= activeJournee; journee++) {
    const { start } = getJourneeWeekRange(journee);
    if (start >= monthStart && start < monthEnd) journeesInMonth.push(journee);
  }
  if (journeesInMonth.length === 0) return [];

  const perJournee = await Promise.all(journeesInMonth.map((journee) => getLeaderboard(journee)));

  const totals = new Map<string, MonthlyLeaderboardEntry>();
  for (const entries of perJournee) {
    if (!entries) continue;
    for (const entry of entries) {
      const key = entry.userId ?? entry.deviceId;
      const existing = totals.get(key);
      if (existing) {
        existing.points += entry.points;
        existing.journeesPlayed += 1;
      } else {
        totals.set(key, {
          deviceId: entry.deviceId,
          userId: entry.userId,
          username: entry.username,
          points: entry.points,
          journeesPlayed: 1,
        });
      }
    }
  }

  return Array.from(totals.values()).sort((a, b) => b.points - a.points);
}
