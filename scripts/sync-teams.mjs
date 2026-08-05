// One-off/occasional sync script (NOT part of the Next.js runtime) that
// fetches all teams across the 5 big European leagues and writes the
// result to src/lib/data/generated/teams.json — a fast, searchable team
// directory for the "favorite team" feature (see components/live/*).
//
// Run with: node scripts/sync-teams.mjs
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
const SEASON = 2025; // most recent complete season — rosters barely change league-to-league anyway

const LEAGUES = [
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 135, name: "Serie A" },
  { id: 78, name: "Bundesliga" },
  { id: 61, name: "Ligue 1" },
];

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

async function main() {
  const allTeams = [];

  for (const league of LEAGUES) {
    const result = await apiGet("/teams", { league: league.id, season: SEASON });
    console.log(`[${league.name}] ${result.results} teams`);
    for (const entry of result.response) {
      allTeams.push({
        id: entry.team.id,
        name: entry.team.name,
        logo: entry.team.logo,
        country: entry.team.country,
        leagueId: league.id,
        leagueName: league.name,
      });
    }
  }

  console.log(`\nTotal teams: ${allTeams.length}`);

  const outDir = path.join(ROOT, "src/lib/data/generated");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "teams.json");
  writeFileSync(outPath, JSON.stringify(allTeams, null, 2));
  console.log(`Wrote ${allTeams.length} teams to ${path.relative(ROOT, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
