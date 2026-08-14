// One-off diagnostic script (NOT part of the Next.js runtime, not part of
// sync-african-players.mjs's own pipeline). That script's player pool comes
// from /players/squads?team=<nation> — a CURRENT squad snapshot that, as
// found by hand for Kondogbia/Tchato/Mendy, is missing real internationals
// who were capped even once but have since fallen out of the snapshot (or
// were never in it to begin with — that endpoint has proven incomplete for
// several federations). This script instead queries /players?team=<nation>
// &season=<year>, which returns everyone with an actual recorded STATS
// entry for that national team that season — a real call-up, not a
// point-in-time roster guess — across the last 3 completed seasons, and
// diffs the result against src/lib/data/generated/african-players.json to
// find who's missing.
//
// Deliberately NOT auto-added to the JSON: this only produces a report
// (missing-call-ups-report.json) for manual review, same as every player
// added by hand so far this session — a real call-up can still be a
// duplicate id, a youth-only cap, or a player who's since retired
// internationally, none of which this script can tell apart on its own.
//
// Run with: node scripts/find-missing-call-ups.mjs
// Reads API_FOOTBALL_KEY from .env.local, same as sync-african-players.mjs.

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

// Copied from sync-african-players.mjs rather than imported — that file
// runs its own (expensive, ~1500+ request) main() unconditionally at
// import time, so importing from it here would trigger a full resync.
// Keep this list in sync with that file's copy if either ever changes.
const NATIONAL_TEAMS = [
  { name: "Algeria", id: 1532 },
  { name: "Angola", id: 1529 },
  { name: "Benin", id: 1516 },
  { name: "Botswana", id: 1520 },
  { name: "Burkina Faso", id: 1502 },
  { name: "Burundi", id: 1528 },
  { name: "Cameroon", id: 1530 },
  { name: "Cape Verde", id: 1533 },
  { name: "Central African Republic", id: 1527 },
  { name: "Chad", id: 1523 },
  { name: "Comoros", id: 1524 },
  { name: "DR Congo", id: 1508 },
  { name: "Congo", id: 1517 },
  { name: "Djibouti", id: 1535 },
  { name: "Egypt", id: 32 },
  { name: "Equatorial Guinea", id: 1521 },
  { name: "Eritrea", id: 1498 },
  { name: "Eswatini", id: 2995 },
  { name: "Ethiopia", id: 1506 },
  { name: "Gabon", id: 1503 },
  { name: "Gambia", id: 1492 },
  { name: "Ghana", id: 1504 },
  { name: "Guinea", id: 1509 },
  { name: "Guinea-Bissau", id: 1513 },
  { name: "Ivory Coast", id: 1501 },
  { name: "Kenya", id: 1511 },
  { name: "Lesotho", id: 1518 },
  { name: "Liberia", id: 1525 },
  { name: "Libya", id: 1526 },
  { name: "Madagascar", id: 1490 },
  { name: "Malawi", id: 1495 },
  { name: "Mali", id: 1500 },
  { name: "Mauritania", id: 1491 },
  { name: "Mauritius", id: 1497 },
  { name: "Morocco", id: 31 },
  { name: "Mozambique", id: 1512 },
  { name: "Namibia", id: 1493 },
  { name: "Niger", id: 1505 },
  { name: "Nigeria", id: 19 },
  { name: "Rwanda", id: 1514 },
  { name: "Senegal", id: 13 },
  { name: "Seychelles", id: 1515 },
  { name: "Sierra Leone", id: 1499 },
  { name: "Somalia", id: 8050 },
  { name: "South Africa", id: 1531 },
  { name: "South Sudan", id: 1496 },
  { name: "Sudan", id: 1510 },
  { name: "Tanzania", id: 1489 },
  { name: "Togo", id: 1534 },
  { name: "Tunisia", id: 28 },
  { name: "Uganda", id: 1519 },
  { name: "Zambia", id: 1507 },
  { name: "Zimbabwe", id: 1522 },
];

// "Depuis 3 saisons" — the last 3 completed seasons. 2026 is excluded (only
// just started, sparse/misleading data — see the Kondogbia/Mendy season=2026
// checks earlier this session).
const SEASONS = [2025, 2024, 2023];

const CACHE_DIR = path.join(ROOT, ".cache/api-football");
mkdirSync(CACHE_DIR, { recursive: true });

// Hard stop on LIVE (non-cached) requests — the app's own cron jobs
// (api/cron/poll every 1-2 min, api/cron/fetch-news every 30 min) share
// this same daily quota (Pro plan, 7500/day) and must not be starved by a
// one-off diagnostic script. Checked before each live fetch; a re-run
// later picks up exactly where this stopped, since every completed
// request is cached to disk and costs nothing to re-read.
const MAX_LIVE_REQUESTS = 400;
let liveRequestCount = 0;
let stoppedEarly = false;

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

  if (liveRequestCount >= MAX_LIVE_REQUESTS) {
    stoppedEarly = true;
    throw new Error("LIVE_REQUEST_BUDGET_EXHAUSTED");
  }
  liveRequestCount += 1;

  await new Promise((resolve) => setTimeout(resolve, 300));

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
    writeFileSync(cachePath, JSON.stringify(json));
    return json;
  }
  throw new Error(`API rate-limited for ${pathname} after retries`);
}

// Paginates through every page for one (nation, season) — /players is
// fixed at 20 results/page with no way to request a bigger page, so a
// well-followed federation (e.g. Cameroon: 4 pages for 2025 alone) needs
// several requests per season.
async function fetchCallUps(nation, season) {
  const players = [];
  let page = 1;
  while (true) {
    const result = await apiGet("/players", { team: nation.id, season, page });
    for (const r of result.response ?? []) {
      players.push({ id: r.player.id, name: r.player.name, nationality: r.player.nationality ?? nation.name });
    }
    const totalPages = result.paging?.total ?? 1;
    if (page >= totalPages) break;
    page += 1;
  }
  return players;
}

async function main() {
  const playersPath = path.join(ROOT, "src/lib/data/generated/african-players.json");
  const existing = JSON.parse(readFileSync(playersPath, "utf-8"));
  const existingIds = new Set(existing.map((p) => p.id));

  // id -> { id, name, nationality, seasons: Set<number> }
  const callUps = new Map();
  const completedNations = [];

  outer: for (const nation of NATIONAL_TEAMS) {
    for (const season of SEASONS) {
      try {
        const players = await fetchCallUps(nation, season);
        for (const p of players) {
          const entry = callUps.get(p.id) ?? { id: p.id, name: p.name, nationality: p.nationality, seasons: new Set() };
          entry.seasons.add(season);
          callUps.set(p.id, entry);
        }
      } catch (err) {
        if (err.message === "LIVE_REQUEST_BUDGET_EXHAUSTED") {
          console.warn(`\nStopping: live request budget (${MAX_LIVE_REQUESTS}) reached at [${nation.name} ${season}]. Re-run later to continue (already-fetched nation/seasons are cached and won't be re-charged).`);
          break outer;
        }
        console.warn(`[${nation.name} ${season}] failed: ${err.message}`);
      }
    }
    if (!stoppedEarly) completedNations.push(nation.name);
    console.log(`[${nation.name}] done (${SEASONS.length} seasons) — ${liveRequestCount}/${MAX_LIVE_REQUESTS} live requests used so far`);
  }

  const missing = Array.from(callUps.values())
    .filter((p) => !existingIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.name, nationality: p.nationality, seasons: Array.from(p.seasons).sort() }))
    .sort((a, b) => a.nationality.localeCompare(b.nationality) || a.name.localeCompare(b.name));

  const reportPath = path.join(ROOT, ".cache/missing-call-ups-report.json");
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        seasonsChecked: SEASONS,
        nationsCompleted: completedNations.length,
        nationsTotal: NATIONAL_TEAMS.length,
        stoppedEarly,
        liveRequestsUsed: liveRequestCount,
        missingCount: missing.length,
        missing,
      },
      null,
      2
    )
  );

  console.log(`\n${completedNations.length}/${NATIONAL_TEAMS.length} nations fully checked across ${SEASONS.join(", ")}.`);
  console.log(`${missing.length} players called up at least once but not in african-players.json.`);
  console.log(`Report written to ${path.relative(ROOT, reportPath)}`);
  if (stoppedEarly) console.log(`Stopped early on request budget — re-run to cover the remaining nations.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
