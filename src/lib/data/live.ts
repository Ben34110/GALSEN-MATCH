import { matches, standings } from "@/lib/mock/matches";
import { teams } from "@/lib/mock/teams";
import { getTeamDirectory } from "@/lib/data/team-directory";
import {
  getCurrentRound,
  getFinishedFixtures,
  getFixtureById,
  getFixturesForRound,
  getLiveFixtures,
  getStandingsForSeason,
  getTeamSquad,
  getUpcomingFixtures,
  getUpcomingFixturesForTeam,
  LIGUE1_SENEGAL_ID,
  type ApiFixture,
  type ApiStandingRow,
} from "@/lib/api-football";
import type { Match, MatchStatus, SquadPlayer, StandingRow, Team, TeamRef } from "@/types";

// Safety-net season to fall back to if a standings request errors outright
// (e.g. a lapsed key/plan) — kept from when the free plan capped every
// league at 2022-2024. On the current Pro plan this path shouldn't trigger
// in practice; see the "no matches played yet" fallback below for the
// actually-common case (fresh season, all-0 table).
const LATEST_ACCESSIBLE_SEASON = 2024;

function guessCurrentSeason(): number {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  // Most European/African league seasons run roughly Aug–Jun, so Jan–Jun
  // still belongs to the season that started the previous calendar year.
  return month >= 7 ? year : year - 1;
}

function mapFixtureStatus(short: string): MatchStatus {
  if (["1H", "2H", "HT", "ET", "P", "LIVE", "BT"].includes(short)) return "live";
  if (["FT", "AET", "PEN", "AWD", "WO"].includes(short)) return "finished";
  return "scheduled";
}

function mapLiveLabel(short: string, elapsed: number | null): string | undefined {
  if (short === "HT") return "Mi-temps";
  if (short === "BT") return "Pause";
  if (elapsed !== null) return `${elapsed}'`;
  return undefined;
}

function mapRoundLabel(round: string): string {
  const trailingNumber = round.match(/(\d+)\s*$/);
  return trailingNumber ? `J${trailingNumber[1]}` : round;
}

function mapTeamRef(team: { id: number; name: string; logo: string }): TeamRef {
  return { id: String(team.id), name: team.name, logo: team.logo };
}

function mapFixtureToMatch(fixture: ApiFixture): Match {
  const status = mapFixtureStatus(fixture.fixture.status.short);
  return {
    id: `api-${fixture.fixture.id}`,
    competition: fixture.league.name,
    matchday: 0,
    roundLabel: mapRoundLabel(fixture.league.round),
    homeTeamId: String(fixture.teams.home.id),
    awayTeamId: String(fixture.teams.away.id),
    homeTeam: mapTeamRef(fixture.teams.home),
    awayTeam: mapTeamRef(fixture.teams.away),
    status,
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    minute: fixture.fixture.status.elapsed,
    liveLabel: status === "live" ? mapLiveLabel(fixture.fixture.status.short, fixture.fixture.status.elapsed) : undefined,
    halftimeScore: fixture.score.halftime,
    kickoffAt: fixture.fixture.date,
    source: "api",
    apiFixtureId: fixture.fixture.id,
  };
}

function mapStandingToRow(row: ApiStandingRow): StandingRow {
  return {
    teamId: String(row.team.id),
    team: { id: String(row.team.id), name: row.team.name, logo: row.team.logo },
    played: row.all.played,
    won: row.all.win,
    drawn: row.all.draw,
    lost: row.all.lose,
    points: row.points,
  };
}

function sortByKickoff(list: Match[]): Match[] {
  return [...list].sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
}

// Point de bascule (franchi pour les matchs) : en direct, à venir et
// derniers résultats viennent tous réellement d'API-Football, pour
// n'importe quelle compétition. Pour Ligue 1 Sénégal, le mock ne sert plus
// que de filet de sécurité si une requête échoue — les autres compétitions
// n'ont pas de mock et affichent uniquement ce que l'API renvoie.
export async function getMatches(leagueId: number = LIGUE1_SENEGAL_ID): Promise<Match[]> {
  const season = guessCurrentSeason();
  const toMatches = (result: { error: string | null; data: ApiFixture[] }) =>
    !result.error ? result.data.map(mapFixtureToMatch) : [];

  const roundResult = await getCurrentRound(leagueId, season);
  const currentRound = !roundResult.error ? roundResult.data[0] : undefined;

  let realLive: Match[];
  let realUpcoming: Match[];
  let realFinished: Match[];

  let roundFetchFailed = false;
  if (currentRound) {
    // A whole round in one request, then bucketed locally by status — this
    // is what actually gets "the next matchday" right: a flat next/last
    // count cuts a round in half for any 18-team league (9 matches/round),
    // mixing in a fixture from the following round.
    const [live, round] = await Promise.all([getLiveFixtures(leagueId), getFixturesForRound(leagueId, season, currentRound)]);
    const liveMatches = toMatches(live);
    const roundMatches = toMatches(round);
    const liveIds = new Set(liveMatches.map((m) => m.id));

    realLive = liveMatches;
    realUpcoming = [];
    realFinished = [];
    for (const match of roundMatches) {
      if (liveIds.has(match.id) || match.status === "live") continue;
      if (match.status === "finished") realFinished.push(match);
      else realUpcoming.push(match);
    }
    // A round name known but its fixtures request itself erroring (e.g. a
    // transient rate limit) shouldn't read as "this round has 0 matches" —
    // that's how a single bad response, cached by Next's fetch layer for the
    // next 15 minutes, turned into "aucun match à afficher" for a whole
    // matchday that very much exists. Retry once via the flat next/last path
    // below, which hits different cache keys.
    roundFetchFailed = Boolean(round.error) && realUpcoming.length === 0 && realFinished.length === 0;
  } else {
    realLive = [];
    realUpcoming = [];
    realFinished = [];
  }

  if (!currentRound || roundFetchFailed) {
    // No round info for this league/season (e.g. Ligue 1 Sénégal — API-
    // Football doesn't track it at all), or the round-based fetch above
    // failed outright — fall back to a flat next/last count.
    const [live, upcoming, finished] = await Promise.all([
      getLiveFixtures(leagueId),
      getUpcomingFixtures(leagueId, season),
      getFinishedFixtures(leagueId, season),
    ]);
    realLive = toMatches(live);
    realUpcoming = toMatches(upcoming);
    realFinished = toMatches(finished);
  }

  const realTotal = realLive.length + realUpcoming.length + realFinished.length;

  if (leagueId !== LIGUE1_SENEGAL_ID) {
    return sortByKickoff([...realLive, ...realUpcoming, ...realFinished]);
  }

  if (realTotal > 0) {
    return sortByKickoff([...realLive, ...realUpcoming, ...realFinished]);
  }
  return sortByKickoff(matches);
}

export interface StandingsResult {
  rows: StandingRow[];
  season: number;
  source: "api" | "mock" | "placeholder";
}

// A team's zero-played row for the synthetic fallback below — built from the
// team directory (real clubs) rather than the Senegal-only mock array, since
// it must work for any of the 5 tracked leagues.
function placeholderRow(team: { id: number; name: string; logo: string }): StandingRow {
  return {
    teamId: String(team.id),
    team: { id: String(team.id), name: team.name, logo: team.logo },
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
  };
}

// Tries the current season first — including a fresh, all-0 table right
// after a season kicks off, which is exactly what should be shown (a real
// "0 match played" view, not last season's completed standings pretending to
// be current). Only falls back to the latest season the plan covers if the
// current one errors outright (e.g. a lapsed key/plan). If nothing works:
// Senegal has a curated mock table; the 5 big leagues instead get a
// synthetic "0 match played" table built from the real team directory,
// alphabetical, so the section is never blocked/hidden — just honest about
// not having real numbers yet.
export async function getStandings(leagueId: number = LIGUE1_SENEGAL_ID): Promise<StandingsResult> {
  const currentSeason = guessCurrentSeason();
  let result = await getStandingsForSeason(currentSeason, leagueId);
  let season = currentSeason;
  let rows = result.data[0]?.league.standings[0];

  if (result.error || !rows || rows.length === 0) {
    result = await getStandingsForSeason(LATEST_ACCESSIBLE_SEASON, leagueId);
    season = LATEST_ACCESSIBLE_SEASON;
    rows = result.data[0]?.league.standings[0];
  }

  if (!result.error && rows && rows.length > 0) {
    return { rows: rows.map(mapStandingToRow), season, source: "api" };
  }

  if (leagueId === LIGUE1_SENEGAL_ID) {
    return { rows: [...standings].sort((a, b) => b.points - a.points), season: 0, source: "mock" };
  }

  const leagueTeams = getTeamDirectory()
    .filter((team) => team.leagueId === leagueId)
    .sort((a, b) => a.name.localeCompare(b.name));
  return { rows: leagueTeams.map(placeholderRow), season: currentSeason, source: "placeholder" };
}

export async function getFixtureDetail(fixtureId: number): Promise<Match | null> {
  const result = await getFixtureById(fixtureId);
  if (result.error || result.data.length === 0) return null;
  return mapFixtureToMatch(result.data[0]);
}

// All upcoming fixtures for one favorited team, across every competition it
// plays in — see components/live/favorites-panel.tsx.
export async function getUpcomingMatchesForTeam(teamId: number, count = 10): Promise<Match[]> {
  const result = await getUpcomingFixturesForTeam(teamId, count);
  if (result.error) return [];
  return sortByKickoff(result.data.map(mapFixtureToMatch));
}

export interface TeamSquad {
  teamName: string;
  teamLogo: string;
  players: SquadPlayer[];
}

// Fetched on demand (see app/(app)/live/team/[id]/page.tsx) — never
// pre-fetched for a whole league at once, to stay well inside the daily
// request quota (see getTeamSquad's comment in lib/api-football.ts).
export async function getSquad(teamId: number): Promise<TeamSquad | null> {
  const result = await getTeamSquad(teamId);
  if (result.error || result.data.length === 0) return null;

  const { team, players } = result.data[0];
  return {
    teamName: team.name,
    teamLogo: team.logo,
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      age: player.age,
      number: player.number,
      position: player.position,
      photo: player.photo,
    })),
  };
}

export function getTeams(): Team[] {
  return teams;
}
