// Server-only client for API-Football (v3.football.api-sports.io).
// NEVER import this from a "use client" component — API_FOOTBALL_KEY would
// end up in the browser bundle. Only lib/data/live.ts (a server-side data
// layer) and app/api/cron/poll/route.ts should call these functions.
const BASE_URL = "https://v3.football.api-sports.io";

interface ApiFootballEnvelope<T> {
  response: T[];
  errors: Record<string, string> | unknown[];
}

export interface ApiFootballResult<T> {
  data: T[];
  error: string | null;
}

async function apiFootballGet<T>(
  path: string,
  params: Record<string, string | number>,
  revalidateSeconds: number
): Promise<ApiFootballResult<T>> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return { data: [], error: "API_FOOTBALL_KEY absente de l'environnement." };

  const url = new URL(`${BASE_URL}${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, String(value));

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "x-apisports-key": key },
      next: { revalidate: revalidateSeconds },
    });
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : "Erreur réseau API-Football." };
  }

  if (!res.ok) return { data: [], error: `API-Football a répondu ${res.status}.` };

  const json = (await res.json()) as ApiFootballEnvelope<T>;
  // `errors` is `[]` when empty, or an object keyed by field name when the
  // free plan rejects a param (e.g. a season it doesn't cover) — this is how
  // we detect and surface plan restrictions to the caller.
  if (!Array.isArray(json.errors) && json.errors && Object.keys(json.errors).length > 0) {
    return { data: [], error: String(Object.values(json.errors)[0]) };
  }

  return { data: json.response, error: null };
}

// --- Response shapes (only the fields this app actually uses) ---

export interface ApiFixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { long: string; short: string; elapsed: number | null };
  };
  league: { id: number; name: string; round: string };
  teams: { home: ApiFixtureTeam; away: ApiFixtureTeam };
  goals: { home: number | null; away: number | null };
  score: { halftime: { home: number | null; away: number | null } };
}

// Full detail for a single fixture (score, teams, halftime) — powers the
// match detail page reachable from Fantasy's "prochain match" tooltip.
export function getFixtureById(fixtureId: number) {
  return apiFootballGet<ApiFixture>("/fixtures", { id: fixtureId }, 60);
}

export interface ApiLineupPlayer {
  player: { id: number; name: string; number: number | null; pos: string | null; grid: string | null };
}

export interface ApiLineup {
  team: { id: number; name: string; logo: string };
  coach: { id: number; name: string; photo: string | null } | null;
  formation: string | null;
  startXI: ApiLineupPlayer[];
  substitutes: ApiLineupPlayer[];
}

// Starting XI + bench + formation, once announced (usually ~1h before
// kickoff) — published or not, this same endpoint just returns an empty
// response array beforehand, so "no lineup yet" and "API error" both read
// as an empty result here; the caller treats both as "not out yet".
// Cached briefly: once a lineup is out it never changes, but polling for
// "has it come out yet" needs to notice within a couple of minutes (see
// app/api/cron/poll/route.ts).
export function getFixtureLineups(fixtureId: number) {
  return apiFootballGet<ApiLineup>("/fixtures/lineups", { fixture: fixtureId }, 120);
}

// All upcoming fixtures for one team, across every competition it plays in
// (league, cup, friendlies) — no league/season needed. Powers Fantasy's
// "who do they play this week" lookup and the club notification prefs.
export function getUpcomingFixturesForTeam(teamId: number, count = 10) {
  return apiFootballGet<ApiFixture>("/fixtures", { team: teamId, next: count }, 15 * 60);
}

// Recently played fixtures for one team — the counterpart to
// getUpcomingFixturesForTeam, used to find *this* journée's already-played
// match for a Fantasy player (see lib/data/fantasy-ratings.ts) once it's
// no longer "upcoming". Cached briefly: once a match is FT its own data
// won't change, but this same endpoint is how we notice it just finished.
export function getRecentFixturesForTeam(teamId: number, count = 5) {
  return apiFootballGet<ApiFixture>("/fixtures", { team: teamId, last: count }, 15 * 60);
}

// Every fixture live right now, across every league in the world — one
// request instead of one per favorited team, used by the notification
// poller (see app/api/cron/poll/route.ts) to find goals/cards for
// favorited clubs/players without needing to know which leagues they're
// even in.
export function getAllLiveFixtures() {
  return apiFootballGet<ApiFixture>("/fixtures", { live: "all" }, 30);
}

// Every fixture on a given date (YYYY-MM-DD), across every league — used by
// the poller to catch a favorited club's kickoff/lineup announcement without
// polling per-team.
export function getFixturesByDate(date: string) {
  return apiFootballGet<ApiFixture>("/fixtures", { date }, 60);
}

export interface ApiFixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string; // "Goal" | "Card" | "subst" | "Var"
  detail: string; // "Normal Goal", "Yellow Card", "Red Card", ...
}

// Goals/cards/substitutions for one fixture, in chronological order —
// polled only for fixtures currently live and involving a favorited
// club/player (see the poller).
export function getFixtureEvents(fixtureId: number) {
  return apiFootballGet<ApiFixtureEvent>("/fixtures/events", { fixture: fixtureId }, 30);
}

export interface ApiFixturePlayerStats {
  team: { id: number };
  players: { player: { id: number; name: string }; statistics: { games: { rating: string | null } }[] }[];
}

// Per-player end-of-match ratings — only meaningful once a fixture is FT;
// polled once per fixture the first time it's seen finished.
export function getFixturePlayerStats(fixtureId: number) {
  return apiFootballGet<ApiFixturePlayerStats>("/fixtures/players", { fixture: fixtureId }, 60 * 60);
}

// --- CAN 2027 qualifiers (see lib/data/can-qualifiers.ts) ---
// Restored/adapted from the pre-"À venir" version of this file (git show
// 0a10eab~1) — the old live-scores tab used the same /standings and
// /fixtures?league=&round= shapes for domestic leagues; only the extended
// ApiStandingRow fields (group, goals for/against, goalsDiff) are new,
// needed for the Pts/J/G/N/P/BP/BC/Diff column spec this feature asks for
// but the old single-table competition never needed to surface.

// "Africa Cup of Nations - Qualification" — confirmed live via API-Football
// (checked by hand): 156 fixtures across a Preliminary Round + 6 Group
// Stage rounds, 12 groups of 4, current season resolves to "2027".
export const CAN_2027_QUALIFIERS_LEAGUE_ID = 36;

interface ApiLeagueSeason {
  year: number;
  start: string;
  current: boolean;
}

interface ApiLeagueInfo {
  seasons: ApiLeagueSeason[];
}

export interface LeagueSeasonInfo {
  // The season number API-Football itself uses internally — pass this to
  // every other endpoint's `season` param.
  querySeason: number;
  // The calendar year the season actually started in, for display.
  displayYear: number;
}

// The season API-Football itself considers "current" for a given league
// right now — every competition runs on its own numbering convention (CAN
// 2027 qualifiers' current season is literally the number "2027", not a
// calendar year), so this is resolved dynamically instead of guessed.
// Cached a day; a league's current season only flips a couple of times a
// year.
export async function getLeagueCurrentSeason(leagueId: number): Promise<LeagueSeasonInfo | null> {
  const result = await apiFootballGet<ApiLeagueInfo>("/leagues", { id: leagueId, current: "true" }, 24 * 60 * 60);
  if (result.error) return null;
  const season = result.data[0]?.seasons.find((s) => s.current);
  if (!season) return null;
  return { querySeason: season.year, displayYear: Number(season.start.slice(0, 4)) };
}

// Every fixture in one named round (e.g. "Group Stage - 1") — a whole
// matchday at once, rather than a flat "next N" count that cuts a round in
// half for any competition with fewer than N fixtures per round.
export function getFixturesForRound(leagueId: number, season: number, round: string) {
  return apiFootballGet<ApiFixture>("/fixtures", { league: leagueId, season, round }, 6 * 60 * 60);
}

export interface ApiStandingRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string; // e.g. "Group A" — grouped competitions only
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  description: string | null;
}

interface ApiStandingsResponse {
  league: { standings: ApiStandingRow[][] };
}

// A grouped competition's standings come back as one array of rows per
// group already (API-Football groups them server-side) — cached half an
// hour, frequent enough to feel current during an active matchday without
// hammering quota between them.
export function getStandingsForSeason(leagueId: number, season: number) {
  return apiFootballGet<ApiStandingsResponse>("/standings", { league: leagueId, season }, 30 * 60);
}
