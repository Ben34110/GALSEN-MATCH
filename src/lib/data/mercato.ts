import data from "@/lib/data/generated/mercato.json";
import type { MercatoTransfer } from "@/types";

// Real data, pre-fetched (see scripts/sync-african-players.mjs's
// fetchLatestTransferRecord) — a static list refreshed by re-running
// `npm run sync:players`, same pattern as fifa-ranking.ts / african-players.ts.
export function getMercatoTransfers(): MercatoTransfer[] {
  return data as MercatoTransfer[];
}
