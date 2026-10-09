// One-off/occasional sync script (NOT part of the Next.js runtime) that
// finds African-nationality players in the ~28 static-tier African
// domestic leagues (src/lib/data/generated/african-domestic-clubs.json,
// written by sync-african-domestic-clubs.mjs) and writes them straight to
// Supabase's `players` table — the same table global search already reads
// (see lib/data/global-search.ts), never src/lib/data/generated/
// african-players.json (that file stays scoped to internationals, feeding
// Fantasy/onboarding/the poll cron — not what this script is for).
//
// Two real API-Football data gaps confirmed by hand (2026-10-09), not a
// quota problem:
// 1. /fixtures/players (ratings) returns 0 results for every static-tier
//    league tested — these players will never have a Fantasy-style rating,
//    irrelevant here anyway since they never enter african-players.json.
// 2. /players?id=&season= (the nationality+stats lookup below) returns NO
//    DATA AT ALL for roughly 2/3 of domestic-league squad members, worse
//    for less-followed clubs. When it does return data, nationality is
//    100% reliable (confirmed on a 30-player sample). Per an explicit
//    decision: a candidate with no resolvable nationality is EXCLUDED, not
//    assumed African just because their club is — no "club is African so
//    player is African" fallback. This means this script's real yield is
//    roughly a third of the raw roster count, by design, not a bug.
//
// Run with: node scripts/sync-domestic-players.mjs
// Reads API_FOOTBALL_KEY/NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
// from .env.local (parsed manually — this script runs outside Next.js).

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

for (const [name, value] of Object.entries({ API_FOOTBALL_KEY: API_KEY, NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })) {
  if (!value) {
    console.error(`${name} missing — set it in .env.local (local run) or as a GitHub Actions secret (scheduled run).`);
    process.exit(1);
  }
}

const BASE_URL = "https://v3.football.api-sports.io";

// Hard stop on LIVE (non-cached — this script has no disk cache at all,
// every run is fully live) requests, shared account-wide with poll/
// mercato/sync-african-players.mjs. 1 call per squad-enumeration + 1 call
// per per-player nationality/stats check (far cheaper than
// sync-african-players.mjs's 3-call detail fetch — no /transfers call here,
// a domestic player's club is already known exactly from which roster they
// were found on). Generous default since this only runs weekly and the
// account is on a 75,000/day plan.
const MAX_LIVE_REQUESTS = Number(process.env.SYNC_MAX_LIVE_REQUESTS ?? 12000);
let liveRequestCount = 0;
let stoppedOnBudget = false;

async function apiGet(pathname, params) {
  if (liveRequestCount >= MAX_LIVE_REQUESTS) {
    stoppedOnBudget = true;
    throw new Error("LIVE_REQUEST_BUDGET_EXHAUSTED");
  }
  liveRequestCount += 1;
  await new Promise((resolve) => setTimeout(resolve, 250));

  const url = new URL(`${BASE_URL}${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "x-apisports-key": API_KEY } });
    const json = await res.json();
    const rateLimited = json.errors && !Array.isArray(json.errors) && "rateLimit" in json.errors;
    if (rateLimited) {
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
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

// Same 54 CAF nation names as NATIONAL_TEAMS in sync-african-players.mjs —
// copied, not imported, same reasoning as every other script here. What
// matters is this matches API-Football's own player.nationality string
// convention (English names: "Morocco" not "Maroc", "Ivory Coast" not
// "Côte d'Ivoire") — confirmed against real responses while building this
// script.
const AFRICAN_NATIONALITIES = new Set([
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", "Cape Verde",
  "Central African Republic", "Chad", "Comoros", "DR Congo", "Congo", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea",
  "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
  "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria",
  "Rwanda", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
  "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
]);

function normalizeForSearch(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

async function fetchSquad(clubId) {
  try {
    const result = await apiGet("/players/squads", { team: clubId });
    return result.response?.[0]?.players ?? [];
  } catch (err) {
    console.warn(`  squad fetch failed for club ${clubId}: ${err.message}`);
    return [];
  }
}

const CURRENT_SEASON = new Date().getFullYear();

// Single call — unlike sync-african-players.mjs's fetchPlayerClubDetail,
// no /transfers call: the club is already known exactly (whichever club's
// roster this candidate came from), no "which club are they at right now"
// ambiguity to resolve.
async function fetchNationalityAndStats(playerId) {
  for (const season of [CURRENT_SEASON, CURRENT_SEASON - 1]) {
    const result = await apiGet("/players", { id: playerId, season });
    const entry = result.response?.[0];
    if (entry) return entry;
  }
  return null;
}

async function main() {
  const clubsPath = path.join(ROOT, "src/lib/data/generated/african-domestic-clubs.json");
  const playersPath = path.join(ROOT, "src/lib/data/generated/african-players.json");
  const clubs = JSON.parse(readFileSync(clubsPath, "utf-8"));

  // Ordering rule: never overwrite an authoritative international record
  // with a thinner domestic one — a player already resolved by
  // sync-african-players.mjs (richer stats, multi-season history) is
  // skipped entirely here, regardless of what this script would otherwise
  // find for them.
  let internationalIds = new Set();
  try {
    const internationals = JSON.parse(readFileSync(playersPath, "utf-8"));
    internationalIds = new Set(internationals.map((p) => p.id));
  } catch {
    // no international dataset yet — nothing to exclude
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Resumability: a player already written here by a previous run is
  // skipped — re-checking them weekly has some value (API-Football's
  // coverage can improve over time) but isn't worth the budget on every
  // run; the un-covered ~2/3 majority (no nationality data at all) DOES
  // get re-attempted every run, since there's no cheap way to distinguish
  // "permanently uncovered" from "not covered yet" without storing a
  // separate tombstone list this script doesn't bother with — acceptable
  // at this cadence (weekly) and budget (12k/run on a 75k/day plan).
  const { data: existingDomestic } = await supabase.from("players").select("id").eq("source", "domestic");
  const alreadyResolvedIds = new Set((existingDomestic ?? []).map((r) => r.id));

  console.log(`${clubs.length} clubs, ${internationalIds.size} known internationals to skip, ${alreadyResolvedIds.size} domestic players already resolved.\n`);

  const allCandidates = [];
  for (const club of clubs) {
    const squad = await fetchSquad(club.id);
    for (const player of squad) {
      if (internationalIds.has(player.id) || alreadyResolvedIds.has(player.id)) continue;
      allCandidates.push({ ...player, club });
    }
  }
  console.log(`${allCandidates.length} new candidates to check (squad fetch used ${liveRequestCount} requests).\n`);

  let checked = 0;
  let found = 0;
  const rows = await runPool(allCandidates, 3, async (candidate) => {
    checked += 1;
    if (checked % 200 === 0) console.log(`  ...${checked}/${allCandidates.length} checked, ${found} African players found so far (${liveRequestCount}/${MAX_LIVE_REQUESTS} live requests used)`);

    let entry;
    try {
      entry = await fetchNationalityAndStats(candidate.id);
    } catch {
      // Budget exhausted, or a transient per-player API error — stays
      // unresolved for the next run either way (same pattern as
      // sync-african-players.mjs's fetchPlayerClubDetail).
      return null;
    }
    if (!entry) return null; // no data at all — excluded, see file header

    const nationality = entry.player?.nationality;
    if (!nationality || !AFRICAN_NATIONALITIES.has(nationality)) return null;

    const stat = entry.statistics?.find((s) => s.team?.id === candidate.club.id) ?? entry.statistics?.[0];
    found += 1;

    const name = candidate.name ?? `${entry.player.firstname ?? ""} ${entry.player.lastname ?? ""}`.trim();
    return {
      id: candidate.id,
      name,
      firstname: entry.player.firstname ?? null,
      lastname: entry.player.lastname ?? null,
      age: entry.player.age ?? candidate.age ?? null,
      nationality,
      photo: candidate.photo || entry.player.photo,
      position: candidate.position ?? stat?.games?.position ?? null,
      team_id: candidate.club.id,
      team_name: candidate.club.name,
      team_logo: candidate.club.logo,
      league_name: candidate.club.leagueName,
      appearances: stat?.games?.appearences ?? 0,
      goals: stat?.goals?.total ?? 0,
      assists: stat?.goals?.assists ?? 0,
      source: "domestic",
      search_text: normalizeForSearch([name, entry.player.firstname, entry.player.lastname, nationality, candidate.club.name].filter(Boolean).join(" ")),
    };
  });

  const toWrite = (rows ?? []).filter(Boolean);
  console.log(`\n${toWrite.length} African domestic players found (out of ${checked} checked). Upserting to Supabase...`);

  for (let i = 0; i < toWrite.length; i += 500) {
    const batch = toWrite.slice(i, i + 500);
    const { error } = await supabase.from("players").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`Supabase upsert failed (batch starting at ${i}):`, error.message);
      process.exit(1);
    }
  }

  console.log(`Wrote ${toWrite.length} domestic players to Supabase.`);
  if (stoppedOnBudget) {
    console.log("Stopped early on request budget — re-run to keep going through the remaining candidates.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
