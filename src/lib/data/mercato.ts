import { getSupabaseAdmin } from "@/lib/supabase";
import type { MercatoTransfer } from "@/types";

const MERCATO_WINDOW_DAYS = 180;
const MERCATO_MAX_COUNT = 40;

// Server-only — reads the `mercato_transfers` table, upserted daily by
// scripts/sync-mercato.mjs via a GitHub Actions schedule (see that script
// for details). Returns null (not []) when Supabase isn't configured or
// the read fails, so the page can tell "no recent transfers" apart from
// "unavailable" — same convention as getArticles/getLeaderboard.
export async function getMercatoTransfers(): Promise<MercatoTransfer[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const cutoff = new Date(Date.now() - MERCATO_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("mercato_transfers")
    .select("player_id, player_name, player_photo, nationality, transfer_date, type, club_from, club_to")
    .gte("transfer_date", cutoff)
    .order("transfer_date", { ascending: false })
    .limit(MERCATO_MAX_COUNT);
  if (error || !data) return null;

  return data.map(
    (row): MercatoTransfer => ({
      playerId: row.player_id,
      playerName: row.player_name,
      playerPhoto: row.player_photo,
      nationality: row.nationality,
      date: row.transfer_date,
      type: row.type,
      clubFrom: row.club_from,
      clubTo: row.club_to,
    })
  );
}
