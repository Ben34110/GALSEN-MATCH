// One-off/occasional sync script (NOT part of the Next.js runtime) that
// crawls all players across the 5 "big" leagues + Ligue 1 Sénégal for the
// most recent complete season, filters to African nationalities, and writes
// the result to src/lib/data/generated/african-players.json for the app to
// import directly — no runtime API calls needed to browse this list.
//
// Run with: node scripts/sync-african-players.mjs
// Reads API_FOOTBALL_KEY from .env.local (parsed manually — this script
// runs outside Next.js, so next's automatic env loading doesn't apply).

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

const LEAGUES = [
  { id: 403, name: "Ligue 1 Sénégal" },
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 135, name: "Serie A" },
  { id: 78, name: "Bundesliga" },
  { id: 61, name: "Ligue 1" },
];

// All 54 AU member states + common alternate spellings/aliases this API (or
// its underlying data) might use. Verified against a live /countries pull,
// but nationality strings for countries without their own tracked league
// (e.g. Chad, Niger, Cape Verde) aren't in that list, so this is hand-built
// from general African-nation knowledge and cross-checked against the
// unique nationality strings actually observed during the crawl (see the
// "unmatched but suspicious" log at the end of this script).
const AFRICAN_ALIASES = {
  algeria: "Algeria",
  angola: "Angola",
  benin: "Benin",
  botswana: "Botswana",
  "burkina faso": "Burkina Faso",
  "burkina-faso": "Burkina Faso",
  burundi: "Burundi",
  cameroon: "Cameroon",
  "cabo verde": "Cape Verde",
  "cape verde": "Cape Verde",
  "central african republic": "Central African Republic",
  chad: "Chad",
  comoros: "Comoros",
  congo: "Congo",
  "congo dr": "DR Congo",
  "congo-dr": "DR Congo",
  "dr congo": "DR Congo",
  "democratic republic of the congo": "DR Congo",
  "republic of the congo": "Congo",
  djibouti: "Djibouti",
  egypt: "Egypt",
  "equatorial guinea": "Equatorial Guinea",
  eritrea: "Eritrea",
  eswatini: "Eswatini",
  swaziland: "Eswatini",
  ethiopia: "Ethiopia",
  gabon: "Gabon",
  gambia: "Gambia",
  "the gambia": "Gambia",
  ghana: "Ghana",
  guinea: "Guinea",
  "guinea-bissau": "Guinea-Bissau",
  "guinea bissau": "Guinea-Bissau",
  "ivory coast": "Ivory Coast",
  "ivory-coast": "Ivory Coast",
  "cote d'ivoire": "Ivory Coast",
  "côte d'ivoire": "Ivory Coast",
  kenya: "Kenya",
  lesotho: "Lesotho",
  liberia: "Liberia",
  libya: "Libya",
  madagascar: "Madagascar",
  malawi: "Malawi",
  mali: "Mali",
  mauritania: "Mauritania",
  mauritius: "Mauritius",
  morocco: "Morocco",
  mozambique: "Mozambique",
  namibia: "Namibia",
  niger: "Niger",
  nigeria: "Nigeria",
  rwanda: "Rwanda",
  "sao tome and principe": "São Tomé and Príncipe",
  senegal: "Senegal",
  seychelles: "Seychelles",
  "sierra leone": "Sierra Leone",
  somalia: "Somalia",
  "south africa": "South Africa",
  "south-africa": "South Africa",
  "south sudan": "South Sudan",
  sudan: "Sudan",
  tanzania: "Tanzania",
  togo: "Togo",
  tunisia: "Tunisia",
  uganda: "Uganda",
  zambia: "Zambia",
  zimbabwe: "Zimbabwe",
};

function normalizeNationality(raw) {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return AFRICAN_ALIASES[key] ?? null;
}

const CACHE_DIR = path.join(ROOT, ".cache/api-football");
mkdirSync(CACHE_DIR, { recursive: true });

// Caches raw responses to disk so re-running this script while fixing a bug
// in the filtering/mapping logic below doesn't re-spend API quota — only a
// cache miss (first run, or a genuinely new query) hits the network.
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function crawlLeague(league) {
  const players = [];
  const first = await apiGet("/players", { league: league.id, season: SEASON, page: 1 });
  const totalPages = first.paging.total;
  console.log(`[${league.name}] ${totalPages} pages (~${totalPages * 20} players)`);

  let pageData = first.response;
  for (let page = 1; page <= totalPages; page++) {
    if (page > 1) {
      await sleep(120);
      const result = await apiGet("/players", { league: league.id, season: SEASON, page });
      pageData = result.response;
    }
    for (const entry of pageData) {
      players.push({ entry, leagueName: league.name });
    }
    if (page % 10 === 0 || page === totalPages) {
      console.log(`  [${league.name}] page ${page}/${totalPages}`);
    }
  }
  return players;
}

async function main() {
  const allEntries = [];
  for (const league of LEAGUES) {
    const entries = await crawlLeague(league);
    allEntries.push(...entries);
  }

  console.log(`\nTotal player entries scanned: ${allEntries.length}`);

  const uniqueNationalities = new Set();
  const africanPlayers = [];
  const seenIds = new Set();

  for (const { entry, leagueName } of allEntries) {
    const player = entry.player;
    if (player.nationality) uniqueNationalities.add(player.nationality);

    const normalized = normalizeNationality(player.nationality);
    if (!normalized) continue;
    if (seenIds.has(player.id)) continue; // a player can appear on multiple pages/leagues via transfers
    seenIds.add(player.id);

    const stat = entry.statistics?.[0];
    africanPlayers.push({
      id: player.id,
      name: player.name,
      firstname: player.firstname,
      lastname: player.lastname,
      age: player.age,
      nationality: normalized,
      photo: player.photo,
      position: stat?.games?.position ?? null,
      teamName: stat?.team?.name ?? null,
      teamLogo: stat?.team?.logo ?? null,
      leagueName,
      appearances: stat?.games?.appearences ?? 0,
      goals: stat?.goals?.total ?? 0,
      assists: stat?.goals?.assists ?? 0,
    });
  }

  console.log(`African players found: ${africanPlayers.length}`);

  // Nationalities seen but not matched — sanity check for missed aliases.
  const unmatched = [...uniqueNationalities].filter((n) => !normalizeNationality(n)).sort();
  console.log(`\nAll ${uniqueNationalities.size} unique nationalities encountered (unmatched ones you should eyeball):`);
  console.log(unmatched.join(", "));

  const byNationality = {};
  for (const p of africanPlayers) byNationality[p.nationality] = (byNationality[p.nationality] ?? 0) + 1;
  console.log("\nBreakdown by nationality:");
  for (const [nat, count] of Object.entries(byNationality).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${nat}: ${count}`);
  }

  const outDir = path.join(ROOT, "src/lib/data/generated");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "african-players.json");
  writeFileSync(outPath, JSON.stringify(africanPlayers, null, 2));
  console.log(`\nWrote ${africanPlayers.length} players to ${path.relative(ROOT, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
