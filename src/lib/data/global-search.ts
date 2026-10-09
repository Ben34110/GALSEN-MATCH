import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeForSearch } from "@/lib/utils";
import type { AfricanPlayer, LeagueTeam } from "@/types";

// Global search — queries the `players`/`teams` Supabase tables (see
// supabase/schema.sql, seeded by scripts/sync-search-tables.mjs) instead of
// filtering the full lib/data/generated/*.json arrays in memory. Two things
// this fixes: a "use client" search sheet no longer needs the ~1.3MB
// african-players.json in its bundle just to let someone type a query, and
// every search endpoint stays at 0 API-Football requests (this never has,
// and never will, call api-football.ts — only Supabase). Server-only: never
// import this from a "use client" component (see app/actions/search.ts,
// which is the client-callable boundary).
export type GlobalSearchResult = { kind: "player"; player: AfricanPlayer } | { kind: "team"; team: LeagueTeam };

const MAX_RESULTS = 24;

interface PlayerRow {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  nationality: string;
  photo: string;
  position: string | null;
  team_id: number | null;
  team_name: string | null;
  team_logo: string | null;
  league_name: string;
  appearances: number;
  goals: number;
  assists: number;
}

function mapPlayerRow(row: PlayerRow): AfricanPlayer {
  return {
    id: row.id,
    name: row.name,
    firstname: row.firstname,
    lastname: row.lastname,
    age: row.age,
    nationality: row.nationality,
    photo: row.photo,
    position: row.position,
    teamId: row.team_id,
    teamName: row.team_name,
    teamLogo: row.team_logo,
    leagueName: row.league_name,
    appearances: row.appearances,
    goals: row.goals,
    assists: row.assists,
  };
}

interface TeamRow {
  id: number;
  name: string;
  logo: string;
  country: string;
  league_id: number;
  league_name: string;
  type: "club" | "national";
}

function mapTeamRow(row: TeamRow): LeagueTeam {
  return { id: row.id, name: row.name, logo: row.logo, country: row.country, leagueId: row.league_id, leagueName: row.league_name, type: row.type };
}

// Same rule as the array-filter version this replaces: a query like "habib
// diarra" needs BOTH tokens present in search_text, which chained .ilike()
// calls on the same column already AND together — not OR.
async function searchPlayers(tokens: string[]): Promise<AfricanPlayer[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase || tokens.length === 0) return [];

  let query = supabase.from("players").select("*").order("id").limit(MAX_RESULTS);
  for (const token of tokens) query = query.ilike("search_text", `%${token}%`);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as PlayerRow[]).map(mapPlayerRow);
}

// 0 = exact name match ("senegal" -> the Senegal national team), 1 = name
// starts with the query, 2 = query appears elsewhere in the name, 3 = only
// league/country matches — same ranking as the array-filter version this
// replaces (see git history), re-applied client-side here since it's a
// small already-limited result set.
function nameMatchRank(name: string, q: string): number {
  const normalized = normalizeForSearch(name);
  if (normalized === q) return 0;
  if (normalized.startsWith(q)) return 1;
  if (normalized.includes(q)) return 2;
  return 3;
}

async function searchTeams(q: string): Promise<LeagueTeam[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !q) return [];

  const { data, error } = await supabase.from("teams").select("*").ilike("search_text", `%${q}%`).limit(MAX_RESULTS);
  if (error || !data) return [];

  return (data as TeamRow[]).map(mapTeamRow).sort((a, b) => nameMatchRank(a.name, q) - nameMatchRank(b.name, q));
}

export async function searchGlobal(query: string): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const normalized = normalizeForSearch(trimmed);
  const tokens = normalized.split(/\s+/).filter(Boolean);

  const [players, teams] = await Promise.all([searchPlayers(tokens), searchTeams(normalized)]);

  // Interleaved rather than "all players then all teams" — a query like
  // "senegal" should surface the Senegal national team right alongside its
  // players instead of after all ~30 of them.
  const results: GlobalSearchResult[] = [];
  const max = Math.max(players.length, teams.length);
  for (let i = 0; i < max; i++) {
    if (players[i]) results.push({ kind: "player", player: players[i] });
    if (teams[i]) results.push({ kind: "team", team: teams[i] });
  }
  return results.slice(0, MAX_RESULTS);
}
