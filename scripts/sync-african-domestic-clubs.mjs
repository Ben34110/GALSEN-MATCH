// One-off/occasional sync script (NOT part of the Next.js runtime) that
// fetches every club in the ~28 static-tier African domestic leagues
// discovered by scripts/discover-african-leagues.mjs, and writes the
// result to src/lib/data/generated/african-domestic-clubs.json.
//
// Deliberately NOT sync-teams.mjs's output file, and never imported by
// team-directory.ts — this dataset backs only the read-only "Championnats
// africains" tab (lib/data/domestic-leagues.ts), and must stay out of the
// favorite-club search / global search / teams.json entirely (see
// DomesticClub's own doc comment in src/types/index.ts for why).
//
// Run with: node scripts/sync-african-domestic-clubs.mjs
// Reads API_FOOTBALL_KEY from .env.local (parsed manually — this script
// runs outside Next.js). Re-run after discover-african-leagues.mjs any
// time that script's output changes.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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
if (!API_KEY) {
  console.error("API_FOOTBALL_KEY missing from .env.local");
  process.exit(1);
}

const BASE_URL = "https://v3.football.api-sports.io";
const CACHE_DIR = path.join(ROOT, ".cache/api-football");
mkdirSync(CACHE_DIR, { recursive: true });

// Retries on a per-minute rate limit (same shape as every other script in
// this directory) rather than throwing outright — this script's calls can
// land alongside sync-african-players.mjs's much heavier request volume
// (both share the same account-wide per-minute limit, not just the daily
// one), confirmed in practice: a plain run without this retry threw
// "Too many requests" mid-way through a concurrent backfill.
async function apiGet(pathname, params) {
  const cacheKey = `${pathname.replace(/\//g, "_")}_${Object.entries(params)
    .map(([k, v]) => `${k}-${v}`)
    .join("_")}.json`;
  const cachePath = path.join(CACHE_DIR, cacheKey);

  try {
    return JSON.parse(readFileSync(cachePath, "utf-8"));
  } catch {
    // cache miss — fall through to a live request
  }

  const url = new URL(`${BASE_URL}${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "x-apisports-key": API_KEY } });
    const json = await res.json();
    const rateLimited = json.errors && !Array.isArray(json.errors) && "rateLimit" in json.errors;
    if (rateLimited) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (json.errors && !Array.isArray(json.errors) && Object.keys(json.errors).length > 0) {
      throw new Error(`API error for ${pathname}: ${JSON.stringify(json.errors)}`);
    }
    writeFileSync(cachePath, JSON.stringify(json));
    return json;
  }
  throw new Error(`rate-limited after retries: ${pathname}`);
}

async function main() {
  const leaguesPath = path.join(ROOT, "src/lib/data/generated/african-domestic-leagues.json");
  const discovered = JSON.parse(readFileSync(leaguesPath, "utf-8"));
  const usable = discovered.filter((entry) => entry.status === "OK");

  console.log(`Fetching clubs for ${usable.length} static-tier leagues...\n`);

  const allClubs = [];
  for (const league of usable) {
    const result = await apiGet("/teams", { league: league.leagueId, season: league.season });
    console.log(`[${league.country}] ${league.leagueName}: ${result.response?.length ?? 0} teams`);
    for (const entry of result.response ?? []) {
      allClubs.push({
        id: entry.team.id,
        name: entry.team.name,
        logo: entry.team.logo,
        country: league.country,
        leagueId: league.leagueId,
        leagueName: league.leagueName,
      });
    }
  }

  console.log(`\nTotal clubs: ${allClubs.length}`);

  const outDir = path.join(ROOT, "src/lib/data/generated");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "african-domestic-clubs.json");
  writeFileSync(outPath, JSON.stringify(allClubs, null, 2));
  console.log(`Wrote ${allClubs.length} clubs to ${path.relative(ROOT, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
