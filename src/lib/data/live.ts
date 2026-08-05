import { matches, standings } from "@/lib/mock/matches";
import { teams } from "@/lib/mock/teams";
import {
  getFixtureById,
  getLiveFixtures,
  getStandingsForSeason,
  LIGUE1_SENEGAL_ID,
  type ApiFixture,
  type ApiStandingRow,
} from "@/lib/api-football";
import type { Match, MatchStatus, StandingRow, Team, TeamRef } from "@/types";

// Free-tier API-Football coverage for Ligue 1 Sénégal (league 403) stops at
// the 2024 season — the live current season returns a plan-restriction error
// ("Free plans do not have access to this season, try from 2022 to 2024.").
// Standings below try the current season first and fall back to this one.
const LATEST_ACCESSIBLE_SEASON = 2024;

function guessCurrentSeason(): number {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  // Most African league seasons run roughly Aug–Jun, so Jan–Jun still
  // belongs to the season that started the previous calendar year.
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
    competition: "Ligue 1 Sénégal",
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

// Point de bascule (partiellement franchi) : les matchs EN DIRECT viennent
// réellement d'API-Football. "À venir" / "Derniers résultats" restent mock
// pour l'instant — la saison en cours (2025) de Ligue 1 Sénégal n'est pas
// accessible sur le plan gratuit (voir LATEST_ACCESSIBLE_SEASON ci-dessus),
// donc il n'y a aucune donnée réelle à afficher pour ces sections tant que
// le plan n'est pas mis à niveau.
export async function getMatches(): Promise<Match[]> {
  const mockMatches = sortByKickoff(matches);

  const live = await getLiveFixtures(LIGUE1_SENEGAL_ID);
  if (!live.error && live.data.length > 0) {
    const realLive = live.data.map(mapFixtureToMatch);
    const mockNonLive = mockMatches.filter((match) => match.status !== "live");
    return sortByKickoff([...realLive, ...mockNonLive]);
  }

  return mockMatches;
}

export interface StandingsResult {
  rows: StandingRow[];
  season: number;
  source: "api" | "mock";
}

// Tries the current season first, falls back to the latest one the free
// plan actually covers, and falls back to mock data only if both fail.
export async function getStandings(): Promise<StandingsResult> {
  const currentSeason = guessCurrentSeason();
  let result = await getStandingsForSeason(currentSeason);
  let season = currentSeason;

  if (result.error) {
    result = await getStandingsForSeason(LATEST_ACCESSIBLE_SEASON);
    season = LATEST_ACCESSIBLE_SEASON;
  }

  const rows = result.data[0]?.league.standings[0];
  if (!result.error && rows && rows.length > 0) {
    return { rows: rows.map(mapStandingToRow), season, source: "api" };
  }

  return {
    rows: [...standings].sort((a, b) => b.points - a.points),
    season: 0,
    source: "mock",
  };
}

export async function getFixtureDetail(fixtureId: number): Promise<Match | null> {
  const result = await getFixtureById(fixtureId);
  if (result.error || result.data.length === 0) return null;
  return mapFixtureToMatch(result.data[0]);
}

export function getTeams(): Team[] {
  return teams;
}
