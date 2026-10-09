// Seeds the Supabase `players`/`teams` tables that back global search (see
// lib/data/global-search.ts and app/actions/search.ts) from the already-
// committed src/lib/data/generated/*.json files — no API-Football calls at
// all, this only pushes data that sync-african-players.mjs/sync-teams.mjs
// already fetched. Run manually after either of those (`npm run
// sync:search-tables`), or automatically every day right after
// sync-african-players.mjs in .github/workflows/sync-players.yml.
//
// search_text duplicates lib/utils.ts's normalizeForSearch (accent-stripped,
// lowercased) rather than importing it, same as every other script in this
// directory never importing from src/ — keeps these scripts runnable with
// plain `node`, no TS build step.

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

for (const [name, value] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })) {
  if (!value) {
    console.error(`${name} missing — set it in .env.local (local run) or as a GitHub Actions secret (scheduled run).`);
    process.exit(1);
  }
}

function normalizeForSearch(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

async function upsertInBatches(supabase, table, rows, onConflict, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) {
      console.error(`Supabase upsert failed for ${table} (batch starting at ${i}):`, error.message);
      process.exit(1);
    }
    console.log(`  ...${Math.min(i + batchSize, rows.length)}/${rows.length} ${table} rows written`);
  }
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const players = JSON.parse(readFileSync(path.join(ROOT, "src/lib/data/generated/african-players.json"), "utf-8"));
  const playerRows = players.map((p) => ({
    id: p.id,
    name: p.name,
    firstname: p.firstname,
    lastname: p.lastname,
    age: p.age,
    nationality: p.nationality,
    photo: p.photo,
    position: p.position,
    team_id: p.teamId,
    team_name: p.teamName,
    team_logo: p.teamLogo,
    league_name: p.leagueName,
    appearances: p.appearances,
    goals: p.goals,
    assists: p.assists,
    source: "international",
    search_text: normalizeForSearch([p.name, p.firstname, p.lastname, p.nationality, p.teamName].filter(Boolean).join(" ")),
  }));

  console.log(`Upserting ${playerRows.length} players...`);
  await upsertInBatches(supabase, "players", playerRows, "id");

  const teams = JSON.parse(readFileSync(path.join(ROOT, "src/lib/data/generated/teams.json"), "utf-8"));
  const teamRows = teams.map((t) => ({
    id: t.id,
    name: t.name,
    logo: t.logo,
    country: t.country,
    league_id: t.leagueId,
    league_name: t.leagueName,
    type: t.type,
    search_text: normalizeForSearch([t.name, t.leagueName, t.country].filter(Boolean).join(" ")),
  }));

  console.log(`Upserting ${teamRows.length} teams...`);
  await upsertInBatches(supabase, "teams", teamRows, "id");

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
