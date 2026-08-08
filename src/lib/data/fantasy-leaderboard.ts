import { getSupabaseAdmin } from "@/lib/supabase";
import { getAfricanPlayers, positionCode } from "@/lib/data/african-players";
import { calculateRealLineupPoints } from "@/services/real-player-scoring";
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

  return data
    .map((row): LeaderboardEntry => {
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
        points: calculateRealLineupPoints(scoringEntries, row.captain_id),
        filled: playerIds.length,
      };
    })
    .sort((a, b) => b.points - a.points);
}
