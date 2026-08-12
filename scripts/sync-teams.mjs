// One-off/occasional sync script (NOT part of the Next.js runtime) that
// fetches all teams across every tracked African league + the 5 big
// European leagues (re-added for the global search feature — see
// lib/data/global-search.ts) and writes the result, plus all 54 CAF
// national teams, to src/lib/data/generated/teams.json — a fast,
// searchable team directory for both the favorite-club feature in Profil
// (components/profil/preferences-editor.tsx) and global search's team/club/
// national-team results.
//
// National teams cost zero extra requests: their real API-Football ids are
// already known (copied from NATIONAL_TEAMS in sync-african-players.mjs,
// itself found via GET /teams?search=<country name>), so they're appended
// directly instead of looked up.
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

const LEAGUES = [
  { id: 403, name: "Ligue 1 Sénégal" },
  { id: 399, name: "NPFL (Nigeria)" },
  { id: 233, name: "Premier League (Égypte)" },
  { id: 200, name: "Botola Pro (Maroc)" },
  { id: 186, name: "Ligue 1 (Algérie)" },
  { id: 202, name: "Ligue 1 (Tunisie)" },
  { id: 386, name: "Ligue 1 (Côte d'Ivoire)" },
  { id: 570, name: "Premier League (Ghana)" },
  { id: 288, name: "Premier Soccer League (Afrique du Sud)" },
  // The 5 big European leagues, standard API-Football ids.
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 135, name: "Serie A" },
  { id: 78, name: "Bundesliga" },
  { id: 61, name: "Ligue 1" },
];

// Copied from NATIONAL_TEAMS in sync-african-players.mjs — kept as a
// separate literal (not imported) so this script stays a standalone .mjs
// file, same reasoning as that script's own header comment. Appended
// straight into the output with no API call: crest URL follows the same
// media.api-sports.io/football/teams/<id>.png convention used everywhere
// else a national team crest is shown (see lib/data/african-nations.ts).
const NATIONAL_TEAMS = [
  { name: "Algeria", id: 1532 }, { name: "Angola", id: 1529 }, { name: "Benin", id: 1516 },
  { name: "Botswana", id: 1520 }, { name: "Burkina Faso", id: 1502 }, { name: "Burundi", id: 1528 },
  { name: "Cameroon", id: 1530 }, { name: "Cape Verde", id: 1533 }, { name: "Central African Republic", id: 1527 },
  { name: "Chad", id: 1523 }, { name: "Comoros", id: 1524 }, { name: "DR Congo", id: 1508 },
  { name: "Congo", id: 1517 }, { name: "Djibouti", id: 1535 }, { name: "Egypt", id: 32 },
  { name: "Equatorial Guinea", id: 1521 }, { name: "Eritrea", id: 1498 }, { name: "Eswatini", id: 2995 },
  { name: "Ethiopia", id: 1506 }, { name: "Gabon", id: 1503 }, { name: "Gambia", id: 1492 },
  { name: "Ghana", id: 1504 }, { name: "Guinea", id: 1509 }, { name: "Guinea-Bissau", id: 1513 },
  { name: "Ivory Coast", id: 1501 }, { name: "Kenya", id: 1511 }, { name: "Lesotho", id: 1518 },
  { name: "Liberia", id: 1525 }, { name: "Libya", id: 1526 }, { name: "Madagascar", id: 1490 },
  { name: "Malawi", id: 1495 }, { name: "Mali", id: 1500 }, { name: "Mauritania", id: 1491 },
  { name: "Mauritius", id: 1497 }, { name: "Morocco", id: 31 }, { name: "Mozambique", id: 1512 },
  { name: "Namibia", id: 1493 }, { name: "Niger", id: 1505 }, { name: "Nigeria", id: 19 },
  { name: "Rwanda", id: 1514 }, { name: "Senegal", id: 13 }, { name: "Seychelles", id: 1515 },
  { name: "Sierra Leone", id: 1499 }, { name: "Somalia", id: 8050 }, { name: "South Africa", id: 1531 },
  { name: "South Sudan", id: 1496 }, { name: "Sudan", id: 1510 }, { name: "Tanzania", id: 1489 },
  { name: "Togo", id: 1534 }, { name: "Tunisia", id: 28 }, { name: "Uganda", id: 1519 },
  { name: "Zambia", id: 1507 }, { name: "Zimbabwe", id: 1522 },
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

// Each league runs on its own season-numbering convention — Morocco and
// Ivory Coast's real "current" season is 2025 while most of Europe is
// already on 2026 at the same point in the calendar. Resolved per league,
// same as getLeagueCurrentSeason() in lib/api-football.ts at runtime,
// instead of a single guessed season applied to everyone (that's how Rodez,
// an actual Ligue 2 club caught up in a relegation barrage under the wrong
// season, ended up listed under "Ligue 1").
async function currentSeasonFor(leagueId) {
  const result = await apiGet("/leagues", { id: leagueId, current: "true" });
  const season = result.response[0]?.seasons.find((s) => s.current);
  return season?.year ?? null;
}

async function main() {
  const allTeams = [];

  for (const league of LEAGUES) {
    const season = await currentSeasonFor(league.id);
    if (!season) {
      console.warn(`[${league.name}] could not resolve current season, skipping`);
      continue;
    }
    const result = await apiGet("/teams", { league: league.id, season });
    console.log(`[${league.name}] season ${season}: ${result.results} teams`);
    for (const entry of result.response) {
      allTeams.push({
        id: entry.team.id,
        name: entry.team.name,
        logo: entry.team.logo,
        country: entry.team.country,
        leagueId: league.id,
        leagueName: league.name,
        type: "club",
      });
    }
  }

  for (const nation of NATIONAL_TEAMS) {
    allTeams.push({
      id: nation.id,
      name: nation.name,
      logo: `https://media.api-sports.io/football/teams/${nation.id}.png`,
      country: nation.name,
      leagueId: 0,
      leagueName: "Équipe nationale",
      type: "national",
    });
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
