// Scheduled sync (NOT part of the Next.js runtime) — writes to Supabase
// directly instead of a generated JSON file, so the app picks up fresh
// data on the next request with no rebuild/redeploy needed. Run every 3
// days by .github/workflows/sync-mercato.yml — this alone is ~1400
// API-Football calls, enough to meaningfully eat into a daily quota, so
// it deliberately isn't daily (also runnable manually, locally, with
// `node scripts/sync-mercato.mjs`).
//
// Deliberately reuses the already-committed src/lib/data/generated/
// african-players.json for the player-ID list rather than re-fetching all
// 54 national squads — that list only changes when someone runs
// `npm run sync:players` by hand, so there's no need to re-derive it here.
// This script only asks API-Football "has anything changed for these
// players?" via /transfers, one call per player, every run — no disk
// cache (see below), always live.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Unlike the other sync-*.mjs scripts, this only runs where .env.local is
// guaranteed NOT to exist: GitHub Actions (env vars come from the
// workflow's `env:` block, sourced from repo secrets). Still supports a
// local .env.local for manual runs, but must not crash without one.
function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const API_KEY = process.env.API_FOOTBALL_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

for (const [name, value] of Object.entries({ API_FOOTBALL_KEY: API_KEY, NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })) {
  if (!value) {
    console.error(`${name} missing — set it in .env.local (local run) or as a GitHub Actions secret (scheduled run).`);
    process.exit(1);
  }
}

const BASE_URL = "https://v3.football.api-sports.io";

// No cache wrapper here on purpose — see the file header. Still retries on
// the per-minute rate limit, same backoff shape as sync-african-players.mjs.
async function apiGet(pathname, params) {
  const url = new URL(`${BASE_URL}${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "x-apisports-key": API_KEY } });
    const json = await res.json();
    const rateLimited = json.errors && !Array.isArray(json.errors) && "rateLimit" in json.errors;
    if (rateLimited) {
      const waitMs = 2000 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }
    if (json.errors && !Array.isArray(json.errors) && Object.keys(json.errors).length > 0) {
      throw new Error(`API error for ${pathname}: ${JSON.stringify(json.errors)}`);
    }
    return json;
  }
  throw new Error(`API rate-limited for ${pathname} after retries`);
}

async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runOne() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runOne));
  return results;
}

// Same shape/reasoning as sync-african-players.mjs's fetchLatestTransferRecord.
async function fetchLatestTransferRecord(playerId) {
  try {
    const result = await apiGet("/transfers", { player: playerId });
    const transfers = result.response[0]?.transfers ?? [];
    const realMoves = transfers.filter((t) => t.teams?.in?.id != null);
    if (realMoves.length === 0) return null;
    const [latest] = [...realMoves].sort((a, b) => new Date(b.date) - new Date(a.date));
    return { date: latest.date, type: latest.type ?? null, teamIn: latest.teams.in, teamOut: latest.teams.out ?? null };
  } catch (err) {
    console.warn(`  player ${playerId} transfers failed: ${err.message}`);
    return null;
  }
}

async function main() {
  const playersPath = path.join(ROOT, "src/lib/data/generated/african-players.json");
  const players = JSON.parse(readFileSync(playersPath, "utf-8"));
  console.log(`Checking /transfers for ${players.length} African players...`);

  let done = 0;
  const rows = [];
  await runPool(players, 3, async (player) => {
    const transfer = await fetchLatestTransferRecord(player.id);
    done += 1;
    if (done % 100 === 0) console.log(`  ...${done}/${players.length} checked`);
    if (transfer?.teamIn) {
      rows.push({
        player_id: player.id,
        player_name: player.name,
        player_photo: player.photo,
        nationality: player.nationality,
        transfer_date: transfer.date,
        type: transfer.type,
        club_from: transfer.teamOut,
        club_to: transfer.teamIn,
      });
    }
  });

  console.log(`\n${rows.length} players have a recorded transfer. Upserting to Supabase...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.from("mercato_transfers").upsert(rows, { onConflict: "player_id" });
  if (error) {
    console.error("Supabase upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`Wrote ${rows.length} rows to mercato_transfers.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
