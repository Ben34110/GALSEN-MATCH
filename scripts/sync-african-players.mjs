// One-off/occasional sync script (NOT part of the Next.js runtime).
//
// v2 methodology change: the original version filtered players from the 5
// big leagues by their `nationality` field (birth/passport country). That
// misses dual-nationals who represent an African nation without being born
// there — e.g. Habib Diarra (Sunderland) has nationality "France" but plays
// internationally for Senegal, so he was silently excluded.
//
// This version instead enumerates each African nation's NATIONAL TEAM squad
// directly (the actual source of truth for "who represents this country"),
// then looks up each player's real club/goals/assists for the season. Much
// cheaper too: ~54 squad calls + ~1 detail call per capped player, instead
// of paging through every player in 5 leagues.
//
// Run with: node scripts/sync-african-players.mjs
// Reads API_FOOTBALL_KEY from .env.local (parsed manually — this script
// runs outside Next.js).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
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
const SEASON = 2025; // most recent complete season with full player stats coverage

// All 54 CAF member nations' senior national team ids, found via
// GET /teams?search=<country name> and taking the `national: true` entry.
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

const NATION_NAME_SET = new Set(NATIONAL_TEAMS.map((n) => n.name.toLowerCase()));
const YOUTH_TEAM_RE = /\bU1[5-9]\b|\bU2[0-3]\b/i;

function isClubStatEntry(teamName) {
  if (!teamName) return false;
  if (NATION_NAME_SET.has(teamName.toLowerCase())) return false;
  if (YOUTH_TEAM_RE.test(teamName)) return false;
  return true;
}

const CACHE_DIR = path.join(ROOT, ".cache/api-football");
mkdirSync(CACHE_DIR, { recursive: true });

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

  // Only real network calls get throttled — cache hits return above, before
  // this line, so re-runs that are mostly cached stay fast.
  await new Promise((resolve) => setTimeout(resolve, 300));

  const url = new URL(`${BASE_URL}${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { "x-apisports-key": API_KEY } });
  const json = await res.json();
  if (json.errors && !Array.isArray(json.errors) && Object.keys(json.errors).length > 0) {
    throw new Error(`API error for ${pathname}: ${JSON.stringify(json.errors)}`);
  }

  writeFileSync(cachePath, JSON.stringify(json));
  return json;
}

// Small concurrency-limited pool — this script makes ~1500-2000 requests;
// running them 100% serially would take far too long, but unbounded
// parallelism risks the per-minute rate limit.
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

async function fetchNationalSquad(nation) {
  try {
    const result = await apiGet("/players/squads", { team: nation.id });
    const players = result.response[0]?.players ?? [];
    console.log(`[${nation.name}] ${players.length} players`);
    return players.map((p) => ({ ...p, nationality: nation.name }));
  } catch (err) {
    console.warn(`[${nation.name}] failed: ${err.message}`);
    return [];
  }
}

async function fetchPlayerClubDetail(playerId) {
  try {
    const result = await apiGet("/players", { id: playerId, season: SEASON });
    const entry = result.response[0];
    if (!entry) return null;

    const clubEntries = (entry.statistics ?? []).filter((s) => isClubStatEntry(s.team?.name));
    const best = clubEntries.sort((a, b) => (b.games.appearences ?? 0) - (a.games.appearences ?? 0))[0];

    return {
      firstname: entry.player.firstname,
      lastname: entry.player.lastname,
      age: entry.player.age,
      position: best?.games?.position ?? null,
      teamId: best?.team?.id ?? null,
      teamName: best?.team?.name ?? null,
      teamLogo: best?.team?.logo ?? null,
      leagueName: best?.league?.name ?? null,
      appearances: best?.games?.appearences ?? 0,
      goals: best?.goals?.total ?? 0,
      assists: best?.goals?.assists ?? 0,
    };
  } catch (err) {
    console.warn(`  player ${playerId} detail failed: ${err.message}`);
    return null;
  }
}

async function main() {
  const squadResults = [];
  for (const nation of NATIONAL_TEAMS) {
    const players = await fetchNationalSquad(nation);
    squadResults.push(...players);
  }

  console.log(`\nTotal squad entries (all 54 nations): ${squadResults.length}`);

  // A handful of players can appear in more than one nation's recent squad
  // list only in edge cases (shouldn't normally happen); keep the first.
  const seen = new Set();
  const uniquePlayers = squadResults.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  console.log(`Unique players: ${uniquePlayers.length}. Fetching club details...`);

  let done = 0;
  const detailed = await runPool(uniquePlayers, 2, async (player) => {
    const detail = await fetchPlayerClubDetail(player.id);
    done += 1;
    if (done % 50 === 0) console.log(`  ...${done}/${uniquePlayers.length} player details fetched`);
    return {
      id: player.id,
      name: player.name,
      firstname: detail?.firstname ?? null,
      lastname: detail?.lastname ?? null,
      age: detail?.age ?? player.age,
      nationality: player.nationality,
      photo: player.photo,
      position: detail?.position ?? player.position,
      teamId: detail?.teamId ?? null,
      teamName: detail?.teamName ?? null,
      teamLogo: detail?.teamLogo ?? null,
      leagueName: detail?.leagueName ?? "Sélection nationale",
      appearances: detail?.appearances ?? 0,
      goals: detail?.goals ?? 0,
      assists: detail?.assists ?? 0,
    };
  });

  console.log(`\nDone. ${detailed.length} African players (real national team squads).`);

  const byNationality = {};
  for (const p of detailed) byNationality[p.nationality] = (byNationality[p.nationality] ?? 0) + 1;
  console.log("\nBreakdown by nationality:");
  for (const [nat, count] of Object.entries(byNationality).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${nat}: ${count}`);
  }

  const outDir = path.join(ROOT, "src/lib/data/generated");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "african-players.json");
  writeFileSync(outPath, JSON.stringify(detailed, null, 2));
  console.log(`\nWrote ${detailed.length} players to ${path.relative(ROOT, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
