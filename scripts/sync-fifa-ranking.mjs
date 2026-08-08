// One-off/occasional sync script (NOT part of the Next.js runtime) that
// scrapes the FIFA World Ranking, pre-filtered to CAF (African) nations,
// from futbor.com — no live API exposes this at all: API-Football doesn't
// have it, and FIFA's own site plus the usual mirrors (worldfootball.net,
// Wikipedia's full-table view) are all bot-blocked or don't publish a full
// current table. futbor.com's /fr/fifa-rankings/africa page is real,
// unblocked, and server-rendered with exactly the columns needed (verified
// by hand: 54 rows, one per CAF member).
//
// Unlike scripts/sync-teams.mjs / sync-african-players.mjs, this is the
// first HTML-scrape sync script in the repo (the other two consume
// API-Football's JSON directly) and needs no API key — a single page
// fetch, no auth, no per-endpoint cache.
//
// Run with: node scripts/sync-fifa-ranking.mjs
// Re-run by hand whenever FIFA publishes a ranking update (roughly
// monthly) — there's no cron for this, same "refresh on demand" model as
// the other two sync scripts.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SOURCE_URL = "https://futbor.com/fr/fifa-rankings/africa";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// futbor names a handful of nations differently than
// src/lib/data/african-nations.ts's `nationality` field (the single
// source of truth every other country-aware feature in this app already
// keys off) — normalized here so fifa-ranking-table.tsx can do a direct
// `nationality === row.country` lookup for the crest/French label instead
// of every consumer re-deriving its own alias table. São Tomé and Príncipe
// has no entry in african-nations.ts at all (a real gap — that 54-nation
// list turned out to only have 53) and is left unmapped on purpose; the
// table renders it with a generic icon and its scraped name rather than
// silently dropping a real CAF member from the ranking.
const NATION_NAME_ALIASES = {
  "Côte d'Ivoire": "Ivory Coast",
  "Congo DR": "DR Congo",
  "Cabo Verde": "Cape Verde",
  "The Gambia": "Gambia",
};

// CAF currently has 54 member associations — a real scrape should land
// close to that. Catches a structural change (a redesign, a blocked
// request returning a login/challenge page, etc.) as a hard failure
// instead of silently writing a near-empty or garbage file.
const MIN_EXPECTED_ROWS = 45;

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function parseRow(rowHtml) {
  const rankMatch = rowHtml.match(/<td class="rank"[^>]*>\s*(\d+)(?:st|nd|rd|th)/);
  const countryMatch = rowHtml.match(/<strong>([^<]+)<\/strong>/);
  const pointsMatch = rowHtml.match(/<td class="points"[^>]*>\s*([\d,.]+)\s*<\/td>/);
  const previousPointsMatch = rowHtml.match(/<td class="previous-points"[^>]*>\s*([\d,.]+)\s*<\/td>/);
  const deltaMatch = rowHtml.match(/<td class="delta[^"]*"[^>]*>\s*([+-]?[\d,.]+)\s*<\/td>/);

  if (!rankMatch || !countryMatch || !pointsMatch || !previousPointsMatch || !deltaMatch) {
    return null;
  }

  // e.g. <small class="rank-up">1 ▲</small> — the leading number is how
  // many places the rank moved since last month, which is what was
  // literally asked for ("progression de places par rapport au mois
  // précédent"), distinct from the points delta above.
  const movementMatch = rowHtml.match(/<small class="(rank-up|rank-down)">\s*(\d+)/);
  const movement = movementMatch ? (movementMatch[1] === "rank-up" ? "up" : "down") : "same";
  const placesMoved = movementMatch ? Number(movementMatch[2]) : 0;

  return {
    worldRank: Number(rankMatch[1]),
    country: (() => {
      const name = decodeHtmlEntities(countryMatch[1].trim());
      return NATION_NAME_ALIASES[name] ?? name;
    })(),
    points: Number(pointsMatch[1].replace(/,/g, "")),
    previousPoints: Number(previousPointsMatch[1].replace(/,/g, "")),
    delta: Number(deltaMatch[1].replace(/,/g, "")),
    movement,
    placesMoved,
  };
}

async function main() {
  const res = await fetch(SOURCE_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    console.error(`Fetch failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const html = await res.text();

  // futbor's sidebar states the ranking's effective date in English even
  // on the French page (e.g. "July 20, 2026") — captured so the app can
  // tell readers which month's ranking they're looking at, since FIFA only
  // republishes this roughly monthly and the data can lag by a few weeks.
  // Parsed by hand rather than `new Date(...).toISOString()`: that route
  // parses "July 20, 2026" as LOCAL midnight, then converts to UTC — which
  // silently rolls the date back a day whenever the sync runs in a
  // timezone ahead of UTC (confirmed: CEST turned "July 20" into
  // "2026-07-19"). This is a plain calendar date, not an instant, so it
  // must never pass through a timezone conversion at all.
  const MONTHS = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const dateMatch = html.match(/Date du classement<\/span>\s*<strong>([^<]+)<\/strong>/);
  if (!dateMatch) {
    console.error("Could not find the ranking's effective date — page structure may have changed.");
    process.exit(1);
  }
  const parts = dateMatch[1].trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  const monthIndex = parts ? MONTHS.indexOf(parts[1].toLowerCase()) : -1;
  if (!parts || monthIndex === -1) {
    console.error(`Could not parse the ranking date "${dateMatch[1]}" — page structure may have changed.`);
    process.exit(1);
  }
  const rankingDate = `${parts[3]}-${String(monthIndex + 1).padStart(2, "0")}-${parts[2].padStart(2, "0")}`;

  const tbodyStart = html.indexOf("<tbody");
  const tbodyEnd = html.indexOf("</tbody>", tbodyStart);
  if (tbodyStart === -1 || tbodyEnd === -1) {
    console.error("Could not find the rankings <tbody> — page structure may have changed.");
    process.exit(1);
  }
  const tbody = html.slice(tbodyStart, tbodyEnd);
  const rowsHtml = tbody.match(/<tr>[\s\S]*?<\/tr>/g) ?? [];

  if (rowsHtml.length < MIN_EXPECTED_ROWS) {
    console.error(`Only found ${rowsHtml.length} rows, expected at least ${MIN_EXPECTED_ROWS} — bailing out rather than writing a bad file.`);
    process.exit(1);
  }

  const parsed = [];
  for (const [index, rowHtml] of rowsHtml.entries()) {
    const row = parseRow(rowHtml);
    if (!row) {
      console.error(`Row ${index} failed to parse — page structure may have changed:\n${rowHtml.slice(0, 300)}`);
      process.exit(1);
    }
    parsed.push(row);
  }

  // The page is already filtered to CAF nations and sorted by world rank —
  // African rank is simply the 1-based row position.
  const rows = parsed.map((row, index) => ({ africanRank: index + 1, ...row }));

  console.log(`Parsed ${rows.length} African nations from the FIFA World Ranking (${rankingDate}).`);
  console.log(`#1: ${rows[0].country} (world rank ${rows[0].worldRank}, ${rows[0].points} pts)`);

  const outDir = path.join(ROOT, "src/lib/data/generated");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "fifa-ranking.json");
  writeFileSync(outPath, JSON.stringify({ rankingDate, rows }, null, 2));
  console.log(`Wrote ${rows.length} rows to ${path.relative(ROOT, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
