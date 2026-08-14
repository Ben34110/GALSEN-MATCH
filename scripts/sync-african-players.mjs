// One-off/occasional sync script (NOT part of the Next.js runtime).
//
// v2 methodology change: the original version filtered players from the 5
// big leagues by their `nationality` field (birth/passport country). That
// misses dual-nationals who represent an African nation without being born
// there — e.g. Habib Diarra (Sunderland) has nationality "France" but plays
// internationally for Senegal, so he was silently excluded.
//
// v3 change: /players/squads?team=<nation> (v2's only enumeration source)
// turned out to be far more incomplete than expected — confirmed by hand for
// several nations (missing Kondogbia for CAR, Tchato for Cameroon, Mendy for
// Senegal — see MANUAL_ADDITIONS), and confirmed at scale by a diagnostic
// sweep (scripts/find-missing-call-ups.mjs) that found ~2325 real,
// verifiable internationals missing entirely, including CAF-level stars like
// André Onana, Vincent Aboubakar, and André Zambo Anguissa for Cameroon —
// the squad-list endpoint for that team returned only 25 mostly-fringe
// players. This version additionally enumerates /players?team=<nation>
// &season=<year> across the last 3 seasons (CALL_UP_SEASONS below), which
// returns anyone with a real recorded statistics entry for that national
// team — an actual call-up, not a point-in-time roster guess. That raw
// endpoint has its own real (if less common) data-quality issue — a handful
// of entries get cross-tagged with a foreign domestic league under the
// national team's id (e.g. a Costa Rican player's stats block showing
// team.id = Liberia's id under a "Primera División Costa-Rica" league) — so
// fetchNationalCallUps only keeps an entry if its statistics block actually
// shows a `league.country` of "World" or null (real international
// competitions: Friendlies, AFCON, World Cup qualifiers, ...), which a
// contaminated domestic-league entry never has.
//
// Resumable by design, since a full run now costs several thousand
// requests (every new candidate needs the same ~3-call detail fetch as
// before) — far more than fits in one day of this app's own API quota
// alongside its live cron traffic. Every run loads whatever's already in
// african-players.json and treats those entries as already-resolved (never
// re-fetched, never lost) — only genuinely new candidates get detail-
// fetched, up to MAX_LIVE_REQUESTS live (non-cached) requests, after which
// the run stops cleanly and writes out everything resolved so far. Re-run
// on a later day (once quota resets) to keep making progress; the on-disk
// response cache (.cache/api-football/) also means anything already fetched
// this run is free to re-read even mid-development.
//
// Run with: node scripts/sync-african-players.mjs
// Reads API_FOOTBALL_KEY from .env.local (parsed manually — this script
// runs outside Next.js).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Must not crash without .env.local — see sync-mercato.mjs's identical
// guard, needed the moment this runs somewhere .env.local is guaranteed
// not to exist: GitHub Actions (env vars come from the workflow's `env:`
// block, sourced from repo secrets).
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
// Two different seasons on purpose: STATS_SEASON is the most recent
// *completed* season — it's the one with meaningful appearances/goals/
// assists to rank players by. CLUB_SEASON is the season in progress right
// now — querying it gets each player's actual current club post-transfer-
// window, which STATS_SEASON alone gets wrong for anyone who moved since
// (and returns nothing at all for anyone who didn't play in STATS_SEASON,
// e.g. a debutant — see fetchPlayerClubDetail).
const STATS_SEASON = 2025;
const CLUB_SEASON = 2026;

// API-Football's `games.position` is derived per-competition from lineup
// data, and disagrees with itself across competitions for the same player
// in the same season — e.g. El Hadji Malick Diouf (409303) is tagged
// "Defender" in West Ham's FA Cup and Senegal's AFCON entries, but
// "Midfielder" in the Premier League entry (the one bestClubEntry() picks,
// since it has the most appearances). Even a majority vote across every
// competition entry still leans "Midfielder" 4-3, so no selection
// heuristic fixes this — only a manual correction does. Add an entry here
// (player id -> known-correct position) when a report like this is
// confirmed against reality (he's West Ham's starting left-back), applied
// as the final word after every API-derived guess.
const POSITION_OVERRIDES = {
  409303: "Defender", // El Hadji Malick Diouf — West Ham left-back
  926: "Midfielder", // Geoffrey Kondogbia — Marseille's Ligue 1 entry tags him "Defender", but he's a career defensive midfielder (Sevilla, Monaco, Inter, Valencia, Atlético Madrid, Marseille) — same per-competition tagging quirk as Diouf above.
};

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

// Players confirmed (by hand, via their real API-Football `nationality`
// field) to be eligible for an African nation but absent from that
// nation's current /players/squads listing — not yet capped at senior
// level, so the squad-enumeration method above (see the file's opening
// comment) has no way to find them on its own. Shaped like a
// fetchNationalSquad() entry so it merges into the same pipeline below and
// gets its club/position/stats resolved exactly like everyone else.
const MANUAL_ADDITIONS = [
  {
    id: 437901,
    name: "P. Fall",
    age: 21,
    number: 11,
    position: "Attacker",
    photo: "https://media.api-sports.io/football/players/437901.png",
    nationality: "Senegal", // Pape Moussa Fall, FC Metz
  },
  {
    id: 926,
    name: "G. Kondogbia",
    age: 33,
    number: 19,
    position: "Midfielder",
    photo: "https://media.api-sports.io/football/players/926.png",
    // Geoffrey Kondogbia, Marseille — missing from /players/squads?team=1527
    // (Central African Republic) despite 6 caps this season alone
    // (Friendlies + AFCON qualifiers per /players?id=926&season=2025) — that
    // squad-list endpoint is simply incomplete for this federation (only 20
    // players returned total). See POSITION_OVERRIDES above for why his
    // position is pinned here too.
    nationality: "Central African Republic",
  },
  {
    id: 179399,
    name: "E. Tchato",
    age: 23,
    number: 29,
    position: "Defender",
    photo: "https://media.api-sports.io/football/players/179399.png",
    // Enzo Tchato, Montpellier — same /players/squads gap as Kondogbia
    // above, this time for Cameroon (team 1530, 25 players returned, no
    // match). Confirmed active: 29 Ligue 2 apps this season plus an AFCON
    // qualifiers squad entry. Note: API-Football also has a second,
    // statless duplicate id (275671) for this exact player — 179399 is the
    // one with real season stats, use that one if this ever needs
    // reconciling by hand again.
    nationality: "Cameroon",
  },
  {
    id: 18785,
    name: "N. Mendy",
    age: 34,
    number: 6,
    position: "Midfielder",
    photo: "https://media.api-sports.io/football/players/18785.png",
    // Nampalys Mendy — same /players/squads gap again, this time for
    // Senegal (team 13, 26 players returned, includes two OTHER Mendys —
    // É. Mendy the goalkeeper and A. Mendy — but not him). Just transferred
    // Watford -> Metz (2026-07-30, confirmed via /transfers and his
    // season=2026 stats, which is why STATS_SEASON=2025 alone would've
    // shown him at Watford instead).
    nationality: "Senegal",
  },
];

function isClubStatEntry(teamName) {
  if (!teamName) return false;
  if (NATION_NAME_SET.has(teamName.toLowerCase())) return false;
  if (YOUTH_TEAM_RE.test(teamName)) return false;
  return true;
}

const CACHE_DIR = path.join(ROOT, ".cache/api-football");
mkdirSync(CACHE_DIR, { recursive: true });

// Hard stop on LIVE (non-cached) requests — this app's own cron jobs
// (api/cron/poll every 1-2 min, api/cron/fetch-news every 30 min) share
// this same daily quota and must not be starved by this script running
// long. Override via SYNC_MAX_LIVE_REQUESTS if a day's remaining quota is
// known to be larger/smaller than the conservative default. Checked inside
// apiGet, before each live fetch; cache hits are never throttled or
// counted against this, so a mostly-cached re-run stays fast and free.
const MAX_LIVE_REQUESTS = Number(process.env.SYNC_MAX_LIVE_REQUESTS ?? 600);
let liveRequestCount = 0;
let stoppedOnBudget = false;

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
    stoppedOnBudget = true;
    throw new Error("LIVE_REQUEST_BUDGET_EXHAUSTED");
  }
  liveRequestCount += 1;

  // Only real network calls get throttled — cache hits return above, before
  // this line, so re-runs that are mostly cached stay fast.
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

// "Depuis 3 saisons" — the last 3 completed seasons. 2026 is excluded (only
// just started this early in the year — see fetchPlayerClubDetail's own
// CLUB_SEASON, which still separately picks up anyone who's already played
// in it for club purposes).
const CALL_UP_SEASONS = [2025, 2024, 2023];

// The real-call-ups counterpart to fetchNationalSquad above — see this
// file's opening comment for why both sources are needed and how the
// league.country check below rejects the cross-tagged-domestic-league
// contamination found in this endpoint's raw data.
async function fetchNationalCallUps(nation, season) {
  const verified = [];
  let page = 1;
  while (true) {
    let result;
    try {
      result = await apiGet("/players", { team: nation.id, season, page });
    } catch (err) {
      if (err.message === "LIVE_REQUEST_BUDGET_EXHAUSTED") throw err;
      console.warn(`[${nation.name} ${season} p${page}] failed: ${err.message}`);
      break;
    }
    for (const r of result.response ?? []) {
      const nationalEntry = (r.statistics ?? []).find(
        (s) => s.team?.id === nation.id && (s.league?.country === "World" || s.league?.country == null)
      );
      if (!nationalEntry) continue; // contaminated/unverifiable entry — skip
      verified.push({
        id: r.player.id,
        name: r.player.name,
        age: r.player.age,
        photo: r.player.photo,
        position: nationalEntry.games?.position ?? null,
        nationality: nation.name,
      });
    }
    const totalPages = result.paging?.total ?? 1;
    if (page >= totalPages) break;
    page += 1;
  }
  return verified;
}

function bestClubEntry(entry) {
  const clubEntries = (entry?.statistics ?? []).filter((s) => isClubStatEntry(s.team?.name));
  return clubEntries.sort((a, b) => (b.games.appearences ?? 0) - (a.games.appearences ?? 0))[0];
}

// /players season stats only report a club once the player has actually
// featured in a match there. Right after a transfer — before their debut —
// they still show the OLD club, sometimes for weeks. /transfers is recorded
// the moment the move is registered, so its most recent entry is
// authoritative for "who do they play for right now" even when match stats
// haven't caught up yet (e.g. Nicolas Jackson returning from a Bayern
// München loan to Chelsea before playing a single game there).
//
// This also doubles as the data source for the Mercato feature (see
// mercatoTransfers below) — the full record (date/fee/both clubs) is kept
// here rather than just the incoming team, so that page reuses this exact
// call instead of re-fetching /transfers for the same ~1400 players a
// second time.
async function fetchLatestTransferRecord(playerId) {
  try {
    const result = await apiGet("/transfers", { player: playerId });
    const transfers = result.response[0]?.transfers ?? [];
    // "Free agent" entries use a placeholder team (id: null, name set to the
    // player's own name, e.g. "Salah Mohamed") instead of a real club — not
    // a club to display, so skip back to the last transfer with a real one.
    const realMoves = transfers.filter((t) => t.teams?.in?.id != null);
    if (realMoves.length === 0) return null;
    const [latest] = [...realMoves].sort((a, b) => new Date(b.date) - new Date(a.date));
    return { date: latest.date, type: latest.type ?? null, teamIn: latest.teams.in, teamOut: latest.teams.out ?? null };
  } catch (err) {
    console.warn(`  player ${playerId} transfers failed: ${err.message}`);
    return null;
  }
}

async function fetchPlayerClubDetail(playerId) {
  try {
    // Sequential, not Promise.all — each worker already runs at a controlled
    // concurrency (see runPool below); doubling that per-player by firing 2
    // requests at once was enough extra burst to trip the per-minute rate
    // limit on a fresh (uncached) run.
    const statsResult = await apiGet("/players", { id: playerId, season: STATS_SEASON });
    const clubResult = await apiGet("/players", { id: playerId, season: CLUB_SEASON });
    const statsEntry = statsResult.response[0];
    const clubSeasonEntry = clubResult.response[0];
    if (!statsEntry && !clubSeasonEntry) return null;

    const statsBest = bestClubEntry(statsEntry);
    // Prefer the current season's club (post-transfer-window); fall back to
    // last season's if the player has no CLUB_SEASON entry yet.
    let clubBest = bestClubEntry(clubSeasonEntry) ?? statsBest;

    const latestTransfer = await fetchLatestTransferRecord(playerId);
    if (latestTransfer?.teamIn && latestTransfer.teamIn.id !== clubBest?.team?.id) {
      clubBest = { team: latestTransfer.teamIn, league: clubBest?.league, games: clubBest?.games };
    }

    const source = statsEntry ?? clubSeasonEntry;
    return {
      firstname: source.player.firstname,
      lastname: source.player.lastname,
      age: source.player.age,
      position: clubBest?.games?.position ?? statsBest?.games?.position ?? null,
      teamId: clubBest?.team?.id ?? null,
      teamName: clubBest?.team?.name ?? null,
      teamLogo: clubBest?.team?.logo ?? null,
      leagueName: clubBest?.league?.name ?? null,
      appearances: statsBest?.games?.appearences ?? 0,
      goals: statsBest?.goals?.total ?? 0,
      assists: statsBest?.goals?.assists ?? 0,
    };
  } catch (err) {
    console.warn(`  player ${playerId} detail failed: ${err.message}`);
    return null;
  }
}

async function main() {
  const outDir = path.join(ROOT, "src/lib/data/generated");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "african-players.json");

  // Every entry already here is preserved as-is, never re-fetched or
  // dropped — the whole point of the resumable design described in this
  // file's opening comment. An interrupted run still leaves a strictly
  // larger, never-corrupted file; a "complete" run just finds nothing new
  // to fetch for anyone already resolved.
  let existing = [];
  try {
    existing = JSON.parse(readFileSync(outPath, "utf-8"));
  } catch {
    // first run ever, or file not written yet — nothing to preserve
  }
  const existingById = new Map(existing.map((p) => [p.id, p]));

  const squadResults = [];
  outer: for (const nation of NATIONAL_TEAMS) {
    squadResults.push(...(await fetchNationalSquad(nation)));
    for (const season of CALL_UP_SEASONS) {
      try {
        squadResults.push(...(await fetchNationalCallUps(nation, season)));
      } catch (err) {
        if (err.message === "LIVE_REQUEST_BUDGET_EXHAUSTED") {
          console.warn(`\nEnumeration stopped early on request budget at [${nation.name} ${season}] — re-run later to cover the rest.`);
          break outer;
        }
        throw err;
      }
    }
  }
  squadResults.push(...MANUAL_ADDITIONS);

  console.log(`\nTotal squad/call-up entries (all nations, seasons ${CALL_UP_SEASONS.join("/")} + manual additions): ${squadResults.length}`);

  // A handful of players can appear more than once (squad list + several
  // seasons' call-ups all surfacing the same id) — keep the first.
  const seen = new Set();
  const uniqueCandidates = squadResults.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const toFetch = uniqueCandidates.filter((p) => !existingById.has(p.id));
  console.log(`${uniqueCandidates.length} unique candidates total — ${existingById.size} already resolved, ${toFetch.length} need fetching this run.`);

  let done = 0;
  const newlyDetailed = await runPool(toFetch, 2, async (player) => {
    const detail = await fetchPlayerClubDetail(player.id);
    done += 1;
    if (done % 50 === 0) console.log(`  ...${done}/${toFetch.length} (${liveRequestCount}/${MAX_LIVE_REQUESTS} live requests used)`);
    if (!detail) return null; // failed, or budget-exhausted — stays missing for the next run
    return {
      id: player.id,
      name: player.name,
      firstname: detail.firstname,
      lastname: detail.lastname,
      age: detail.age ?? player.age,
      nationality: player.nationality,
      photo: player.photo,
      position: POSITION_OVERRIDES[player.id] ?? detail.position ?? player.position,
      teamId: detail.teamId,
      teamName: detail.teamName,
      teamLogo: detail.teamLogo,
      leagueName: detail.leagueName ?? "Sélection nationale",
      appearances: detail.appearances ?? 0,
      goals: detail.goals ?? 0,
      assists: detail.assists ?? 0,
    };
  });

  const resolvedThisRun = newlyDetailed.filter(Boolean);
  const merged = [...existing, ...resolvedThisRun];

  const byNationality = {};
  for (const p of merged) byNationality[p.nationality] = (byNationality[p.nationality] ?? 0) + 1;
  console.log("\nBreakdown by nationality:");
  for (const [nat, count] of Object.entries(byNationality).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${nat}: ${count}`);
  }

  writeFileSync(outPath, JSON.stringify(merged, null, 2));
  const stillPending = toFetch.length - resolvedThisRun.length;
  console.log(`\nWrote ${merged.length} players to ${path.relative(ROOT, outPath)} (was ${existing.length}, +${resolvedThisRun.length} new this run).`);
  if (stillPending > 0 || stoppedOnBudget) {
    console.log(`${stillPending} candidates still pending — re-run (ideally on a later day, once quota resets) to keep going.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
