import { matches, standings } from "@/lib/mock/matches";
import { teams } from "@/lib/mock/teams";
import {
  getFinishedFixtures,
  getFixtureById,
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
  const [live, upcoming, finished] = await Promise.all([
    getLiveFixtures(leagueId),
    getUpcomingFixtures(leagueId, season),
    getFinishedFixtures(leagueId, season),
  ]);

  const toMatches = (result: { error: string | null; data: ApiFixture[] }) =>
    !result.error ? result.data.map(mapFixtureToMatch) : [];

  const realLive = toMatches(live);
  const realUpcoming = toMatches(upcoming);
  const realFinished = toMatches(finished);
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
  source: "api" | "mock";
}

// Tries the current season first, falls back to the previous one if the
// current season exists but no match has been played yet (a fresh table is
// all 0s right after a season kicks off — not useful), then to the latest
// season the plan covers if the current one errors outright, and finally to
// mock data (Senegal only) if nothing works.
export async function getStandings(leagueId: number = LIGUE1_SENEGAL_ID): Promise<StandingsResult> {
  const currentSeason = guessCurrentSeason();
  let result = await getStandingsForSeason(currentSeason, leagueId);
  let season = currentSeason;
  let rows = result.data[0]?.league.standings[0];

  const noMatchesPlayedYet = !result.error && rows && rows.length > 0 && rows.every((row) => row.all.played === 0);

  if (result.error || !rows || rows.length === 0 || noMatchesPlayedYet) {
    const fallbackSeason = noMatchesPlayedYet ? currentSeason - 1 : LATEST_ACCESSIBLE_SEASON;
    result = await getStandingsForSeason(fallbackSeason, leagueId);
    season = fallbackSeason;
    rows = result.data[0]?.league.standings[0];
  }

  if (!result.error && rows && rows.length > 0) {
    return { rows: rows.map(mapStandingToRow), season, source: "api" };
  }

  if (leagueId === LIGUE1_SENEGAL_ID) {
    return { rows: [...standings].sort((a, b) => b.points - a.points), season: 0, source: "mock" };
  }
  return { rows: [], season: 0, source: "mock" };
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
