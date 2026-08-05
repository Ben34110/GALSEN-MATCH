import data from "@/lib/data/generated/african-players.json";
import type { AfricanPlayer } from "@/types";

// Real data, pre-crawled (not mock, not live-fetched at request time) — see
// scripts/sync-african-players.mjs for how this file is generated and how
// to re-run it to refresh the dataset.
export function getAfricanPlayers(): AfricanPlayer[] {
  return data as AfricanPlayer[];
}
