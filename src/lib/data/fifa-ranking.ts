import data from "@/lib/data/generated/fifa-ranking.json";
import type { FifaRankingRow } from "@/types";

// Real data, pre-scraped (see scripts/sync-fifa-ranking.mjs) — a static
// list refreshed by re-running that script, same pattern as
// team-directory.ts / african-players.ts.
export function getFifaRanking(): FifaRankingRow[] {
  return data as FifaRankingRow[];
}
