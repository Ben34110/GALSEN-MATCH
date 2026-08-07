import {
  CAN_2027_QUALIFIERS_LEAGUE_ID,
  getFixturesForRound,
  getLeagueCurrentSeason,
  getStandingsForSeason,
  type ApiStandingRow,
} from "@/lib/api-football";

export interface CanQualifierFixture {
  id: number;
  homeTeam: { id: number; name: string; logo: string };
  awayTeam: { id: number; name: string; logo: string };
  kickoffAt: string;
  round: string;
}

export interface CanQualifierStandingRow {
  teamId: number;
  teamName: string;
  teamLogo: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
}

export interface CanQualifierGroup {
  groupLabel: string;
  rows: CanQualifierStandingRow[];
}

const FIRST_TWO_MATCHDAYS = ["Group Stage - 1", "Group Stage - 2"];

// The first two September 2026 matchdays (confirmed live via API-Football:
// 2026-09-23 and 2026-09-27, 24 fixtures each) — [] on any failure
// (unconfigured/network/season not resolvable), never throws.
export async function getCanQualifiersFixtures(): Promise<CanQualifierFixture[]> {
  const season = await getLeagueCurrentSeason(CAN_2027_QUALIFIERS_LEAGUE_ID);
  if (!season) return [];

  const rounds = await Promise.all(
    FIRST_TWO_MATCHDAYS.map((round) => getFixturesForRound(CAN_2027_QUALIFIERS_LEAGUE_ID, season.querySeason, round))
  );

  const fixtures = rounds
    .flatMap((result) => (result.error ? [] : result.data))
    .map(
      (fixture): CanQualifierFixture => ({
        id: fixture.fixture.id,
        homeTeam: fixture.teams.home,
        awayTeam: fixture.teams.away,
        kickoffAt: fixture.fixture.date,
        round: fixture.league.round,
      })
    );

  return fixtures.sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
}

function toStandingRow(row: ApiStandingRow): CanQualifierStandingRow {
  return {
    teamId: row.team.id,
    teamName: row.team.name,
    teamLogo: row.team.logo,
    points: row.points,
    played: row.all.played,
    won: row.all.win,
    drawn: row.all.draw,
    lost: row.all.lose,
    goalsFor: row.all.goals.for,
    goalsAgainst: row.all.goals.against,
    goalsDiff: row.goalsDiff,
  };
}

// null means the season couldn't be resolved or the API call failed,
// distinct from a successfully-fetched (but possibly all-zero) result. The
// view (can-qualifiers-standings.tsx) is what decides "not started yet"
// vs "genuinely unavailable" — every row can legitimately show 0 played
// before matchday 1 even on a fully successful fetch, so that distinction
// doesn't belong in this data layer.
export async function getCanQualifiersStandings(): Promise<CanQualifierGroup[] | null> {
  const season = await getLeagueCurrentSeason(CAN_2027_QUALIFIERS_LEAGUE_ID);
  if (!season) return null;

  const result = await getStandingsForSeason(CAN_2027_QUALIFIERS_LEAGUE_ID, season.querySeason);
  if (result.error) return null;

  const groups = result.data[0]?.league.standings ?? [];
  return groups
    .filter((group) => group.length > 0)
    .map(
      (group): CanQualifierGroup => ({
        groupLabel: group[0].group,
        rows: group.map(toStandingRow),
      })
    )
    .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));
}
