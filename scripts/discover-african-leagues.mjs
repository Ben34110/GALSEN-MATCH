// One-off/occasional sync script (NOT part of the Next.js runtime) that
// finds each non-live-tier African country's top-flight league id, for
// scripts/sync-african-domestic-clubs.mjs to consume. Separate from
// sync-teams.mjs's hardcoded LEAGUES array on purpose — those 9 African
// leagues (+ 5 European) were found and verified by hand one at a time;
// doing that for the remaining 45 CAF federations isn't practical, so this
// automates the discovery via /leagues?country=<name>, filtered to
// `type === "League"` entries with a current season.
//
// Confirmed by a real run (2026-10-09): of the 44 non-live-tier countries
// checked, 28 resolve to a usable current-season league with teams, 16 have
// no current-season league tracked by API-Football at all (not a quota
// problem — the data genuinely doesn't exist there: Burkina Faso, Cape
// Verde, Central African Republic, Chad, Comoros, DR Congo, Djibouti,
// Equatorial Guinea, Eritrea, Guinea-Bissau, Madagascar, Mozambique, Niger,
// Seychelles, Sierra Leone, South Sudan). Re-run periodically (coverage can
// improve over time) via `npm run discover:african-leagues`.
//
// Run with: node scripts/discover-african-leagues.mjs
// Reads API_FOOTBALL_KEY from .env.local (parsed manually — this script
// runs outside Next.js).

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

async function apiGet(pathname, params) {
  const url = new URL(`${BASE_URL}${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "x-apisports-key": API_KEY } });
    const json = await res.json();
    const rateLimited = json.errors && !Array.isArray(json.errors) && "rateLimit" in json.errors;
    if (rateLimited) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    return json;
  }
  throw new Error(`rate-limited after retries: ${pathname}`);
}

// All 54 CAF nations — copied from NATIONAL_TEAMS in
// sync-african-players.mjs (name only, the league discovery below doesn't
// need the national-team id). Kept as a separate literal, same reasoning as
// every other script in this directory not importing from src/.
const ALL_NATIONS = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", "Cape Verde",
  "Central African Republic", "Chad", "Comoros", "DR Congo", "Congo", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea",
  "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
  "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria",
  "Rwanda", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
  "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
];

// Already hardcoded by hand in sync-teams.mjs's LEAGUES — never
// rediscovered here, those stay the authoritative "live tier" source.
const LIVE_TIER_NATIONS = new Set([
  "Senegal", "Nigeria", "Egypt", "Morocco", "Algeria", "Tunisia", "Ivory Coast", "Ghana", "South Africa",
]);

// API-Football's /leagues?country= expects its own exact country string —
// seeded for the handful of known mismatches (see
// lib/data/group-stage-helpers.ts's NATION_NAME_ALIASES for the same class
// of problem elsewhere in this app); extend this if a future re-run finds
// a NO_CURRENT_LEAGUE result that's actually a naming mismatch rather than
// genuinely untracked data.
const COUNTRY_QUERY_ALIASES = {};

// Countries where /leagues?country= returns more than one current-season
// "League"-type competition (confirmed: Cameroon, Kenya) — pins the pick
// by hand instead of the discovery heuristic's "richest coverage" guess,
// reviewed once against real football knowledge.
const MANUAL_LEAGUE_OVERRIDES = {
  Cameroon: { leagueId: 411, leagueName: "Elite One" },
  Kenya: { leagueId: 277, leagueName: "Super League" },
};

const STATIC_TIER_NATIONS = ALL_NATIONS.filter((n) => !LIVE_TIER_NATIONS.has(n));

async function discoverCountry(country) {
  if (MANUAL_LEAGUE_OVERRIDES[country]) {
    const override = MANUAL_LEAGUE_OVERRIDES[country];
    const lg = await apiGet("/leagues", { id: override.leagueId, current: "true" });
    const season = lg.response?.[0]?.seasons?.find((s) => s.current);
    return { country, status: "OK", leagueId: override.leagueId, leagueName: override.leagueName, season: season?.year ?? null };
  }

  const queryName = COUNTRY_QUERY_ALIASES[country] ?? country;
  const lg = await apiGet("/leagues", { country: queryName });
  const leagues = (lg.response ?? []).filter((l) => l.league.type === "League");
  const withCurrentSeason = leagues
    .map((l) => ({ ...l, currentSeason: l.seasons.find((s) => s.current) }))
    .filter((l) => l.currentSeason);

  if (withCurrentSeason.length === 0) {
    return { country, status: "NO_CURRENT_LEAGUE" };
  }

  const best = withCurrentSeason.find((l) => l.currentSeason.coverage?.fixtures?.events) ?? withCurrentSeason[0];
  const teams = await apiGet("/teams", { league: best.league.id, season: best.currentSeason.year });
  const teamCount = teams.response?.length ?? 0;

  if (teamCount === 0) {
    return { country, status: "LEAGUE_FOUND_NO_TEAMS", leagueId: best.league.id, leagueName: best.league.name };
  }

  return {
    country,
    status: "OK",
    leagueId: best.league.id,
    leagueName: best.league.name,
    season: best.currentSeason.year,
    teamCount,
    ambiguous: withCurrentSeason.length > 1,
  };
}

async function main() {
  console.log(`Discovering top-flight leagues for ${STATIC_TIER_NATIONS.length} static-tier countries...\n`);
  const results = [];
  for (const country of STATIC_TIER_NATIONS) {
    try {
      const result = await discoverCountry(country);
      results.push(result);
      console.log(`  ${country.padEnd(28)} ${result.status}${result.leagueName ? ` — ${result.leagueName} (id ${result.leagueId})` : ""}`);
    } catch (err) {
      results.push({ country, status: "ERROR", error: err.message });
      console.log(`  ${country.padEnd(28)} ERROR: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  const ok = results.filter((r) => r.status === "OK");
  console.log(`\n${ok.length}/${STATIC_TIER_NATIONS.length} countries have a usable current-season top-flight league.`);

  const outDir = path.join(ROOT, "src/lib/data/generated");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "african-domestic-leagues.json"), JSON.stringify(results, null, 2));
  console.log(`Wrote ${results.length} entries to src/lib/data/generated/african-domestic-leagues.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
