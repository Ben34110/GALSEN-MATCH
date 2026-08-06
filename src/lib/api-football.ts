// Server-only client for API-Football (v3.football.api-sports.io).
// NEVER import this from a "use client" component — API_FOOTBALL_KEY would
// end up in the browser bundle. Only lib/data/live.ts (a server-side data
// layer) should call these functions.
const BASE_URL = "https://v3.football.api-sports.io";

// Ligue 1 Sénégal. Found via GET /leagues?country=Senegal.
export const LIGUE1_SENEGAL_ID = 403;

// Ids confirmed via GET /leagues?id=X (Europe) and GET /leagues?country=X
// (Africa) against the real account. Senegal stays the app's default/home
// competition; the rest populate the league picker on /live, grouped by
// region there. Each African league runs on its own season-numbering
// convention (see getLeagueCurrentSeason below — some start well before
// August, or are still "current" between seasons), so season is always
// resolved dynamically rather than guessed from today's date.
export const COMPETITIONS = [
  { id: LIGUE1_SENEGAL_ID, name: "Ligue 1 Sénégal", region: "africa" },
  { id: 399, name: "NPFL (Nigeria)", region: "africa" },
  { id: 233, name: "Premier League (Égypte)", region: "africa" },
  { id: 200, name: "Botola Pro (Maroc)", region: "africa" },
  { id: 186, name: "Ligue 1 (Algérie)", region: "africa" },
  { id: 202, name: "Ligue 1 (Tunisie)", region: "africa" },
  { id: 386, name: "Ligue 1 (Côte d'Ivoire)", region: "africa" },
  { id: 570, name: "Premier League (Ghana)", region: "africa" },
  { id: 288, name: "Premier Soccer League (Afrique du Sud)", region: "africa" },
  { id: 39, name: "Premier League", region: "europe" },
  { id: 140, name: "La Liga", region: "europe" },
  { id: 135, name: "Serie A", region: "europe" },
  { id: 78, name: "Bundesliga", region: "europe" },
  { id: 61, name: "Ligue 1", region: "europe" },
] as const;

export type CompetitionId = (typeof COMPETITIONS)[number]["id"];

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
  // Read directly off each fixture (not looked up from our own COMPETITIONS
  // list) so a favorited team's fixtures in a cup/continental competition we
  // don't otherwise track still get a correct, real competition name.
  league: { id: number; name: string; round: string };
  teams: { home: ApiFixtureTeam; away: ApiFixtureTeam };
  goals: { home: number | null; away: number | null };
  score: { halftime: { home: number | null; away: number | null } };
}

export interface ApiStandingRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  all: { played: number; win: number; draw: number; lose: number };
  description: string | null;
}

interface ApiStandingsResponse {
  league: { standings: ApiStandingRow[][] };
}

export interface ApiSquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
}

interface ApiSquadResponse {
  team: { id: number; name: string; logo: string };
  players: ApiSquadPlayer[];
}

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
  // The calendar year the season actually started in, for display ("Saison
  // {displayYear}/{displayYear + 1}"). Usually equal to querySeason, but not
  // always — NPFL (Nigeria) labels its season by the year it *ends* in
  // (querySeason 2026 for a season that started in 2025), so displaying
  // querySeason directly would show the wrong years for that league.
  displayYear: number;
}

// The season API-Football itself considers "current" for a given league
// right now — each African league runs on its own convention (start month,
// whether it's still "current" between two seasons, calendar-year vs
// Aug-June), so this is resolved per league instead of guessed from today's
// date. Cached a day; a league's current season only flips a couple of
// times a year.
export async function getLeagueCurrentSeason(leagueId: number): Promise<LeagueSeasonInfo | null> {
  const result = await apiFootballGet<ApiLeagueInfo>("/leagues", { id: leagueId, current: "true" }, 24 * 60 * 60);
  if (result.error) return null;
  const season = result.data[0]?.seasons.find((s) => s.current);
  if (!season) return null;
  return { querySeason: season.year, displayYear: Number(season.start.slice(0, 4)) };
}

// --- The 3 requested endpoints ---

// Currently live matches for one competition (defaults to Ligue 1 Sénégal).
// Cached briefly — this changes minute to minute while a match is in play.
export function getLiveFixtures(leagueId: number = LIGUE1_SENEGAL_ID) {
  return apiFootballGet<ApiFixture>("/fixtures", { live: "all", league: leagueId }, 30);
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

// Season standings. Cached for hours — a table rarely moves more than once
// or twice a day even mid-season.
export function getStandingsForSeason(season: number, leagueId: number = LIGUE1_SENEGAL_ID) {
  return apiFootballGet<ApiStandingsResponse>("/standings", { league: leagueId, season }, 6 * 60 * 60);
}

// Full detail for a single fixture (score, teams, halftime).
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

// Current squad for one team — name/photo/position/age. Deliberately NOT a
// requested endpoint from the original 3, but needed to browse real players
// per club. Unlike /players, this isn't season-restricted on the free plan.
// Fetched lazily (only when a team page is actually visited) and cached for
// a day, since squads barely change — this keeps it well within the 100
// req/day quota instead of pre-fetching every team in every league upfront.
export function getTeamSquad(teamId: number) {
  return apiFootballGet<ApiSquadResponse>("/players/squads", { team: teamId }, 24 * 60 * 60);
}

// Upcoming/finished fixtures for a whole competition. Cached for a while —
// a fixture list only changes when new matches are scheduled/played.
export function getUpcomingFixtures(leagueId: number, season: number, count = 10) {
  return apiFootballGet<ApiFixture>("/fixtures", { league: leagueId, season, next: count }, 15 * 60);
}

export function getFinishedFixtures(leagueId: number, season: number, count = 10) {
  return apiFootballGet<ApiFixture>("/fixtures", { league: leagueId, season, last: count }, 15 * 60);
}

// The round API-Football considers "current" for a competition right now —
// e.g. "Regular Season - 1". Used to fetch a whole matchday's fixtures at
// once (see getFixturesForRound) instead of a flat "next N" count, which cuts
// a round in half for any league with fewer than 10 matches per round (18-
// team leagues play 9 a round, so "next 10" always spilled one fixture into
// the following round).
export function getCurrentRound(leagueId: number, season: number) {
  return apiFootballGet<string>("/fixtures/rounds", { league: leagueId, season, current: "true" }, 60 * 60);
}

export function getFixturesForRound(leagueId: number, season: number, round: string) {
  return apiFootballGet<ApiFixture>("/fixtures", { league: leagueId, season, round }, 15 * 60);
}

// All upcoming fixtures for one team, across every competition it plays in
// (league, cup, friendlies) — no league/season needed. Powers the favorite
// team follow feature.
export function getUpcomingFixturesForTeam(teamId: number, count = 10) {
  return apiFootballGet<ApiFixture>("/fixtures", { team: teamId, next: count }, 15 * 60);
}
