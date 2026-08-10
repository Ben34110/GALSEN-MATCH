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

// Reads every device's synced squad for a journée (see
// app/actions/fantasy-sync.ts) and computes points at read time against the
// same real player stats Fantasy itself uses — so a leaderboard read is
// never stale relative to a stat refresh, unlike if points were stored
// alongside the squad. Returns null (not []) when Supabase isn't
// configured, so the page can tell "nobody's played yet" apart from
// "leaderboard unavailable".
export async function getLeaderboard(journee: number): Promise<LeaderboardEntry[] | null> {
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
