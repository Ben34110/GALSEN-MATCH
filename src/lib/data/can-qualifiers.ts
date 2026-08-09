import {
  CAN_2027_QUALIFIERS_LEAGUE_ID,
  getFixturesForRound,
  getLeagueCurrentSeason,
  getStandingsForSeason,
  type ApiFixture,
  type ApiFixtureTeam,
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

export interface CanQualifiersFixturesResult {
  fixtures: CanQualifierFixture[];
  // The reason no fixtures came back, surfaced up to the UI so "indisponible"
  // is diagnosable in prod without digging through server logs — null
  // whenever there's at least one fixture, even if one round failed.
  error: string | null;
}

interface CanQualifierDerivedGroup {
  groupLabel: string;
  teams: ApiFixtureTeam[];
}

// API-Football doesn't tag fixtures with a group ("league.standings: false"
// pre-season, confirmed by hand) — so groups are reconstructed from the two
// fetched matchdays themselves: any two teams that face each other belong to
// the same group of 4, and union-find over every kickoff in both rounds
// reliably clusters all 48 teams into their 12 groups (verified against the
// live endpoint). Labels are plain "Groupe N" — there's no official A-L
// lettering to borrow pre-season; getCanQualifiersStandings drops this
// entirely in favor of the real groups the moment API-Football publishes
// them.
function deriveGroups(rawFixtures: ApiFixture[]): CanQualifierDerivedGroup[] {
  const parent = new Map<number, number>();
  const teamById = new Map<number, ApiFixtureTeam>();

  function find(id: number): number {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    while (parent.get(id) !== root) {
      const next = parent.get(id)!;
      parent.set(id, root);
      id = next;
    }
    return root;
  }

  for (const fixture of rawFixtures) {
    for (const team of [fixture.teams.home, fixture.teams.away]) {
      teamById.set(team.id, team);
      if (!parent.has(team.id)) parent.set(team.id, team.id);
    }
    const rootHome = find(fixture.teams.home.id);
    const rootAway = find(fixture.teams.away.id);
    if (rootHome !== rootAway) parent.set(rootHome, rootAway);
  }

  const clusters = new Map<number, ApiFixtureTeam[]>();
  for (const teamId of teamById.keys()) {
    const root = find(teamId);
    const cluster = clusters.get(root) ?? [];
    cluster.push(teamById.get(teamId)!);
    clusters.set(root, cluster);
  }

  return Array.from(clusters.values())
    .map((teams) => teams.sort((a, b) => a.name.localeCompare(b.name)))
    .sort((a, b) => a[0].name.localeCompare(b[0].name))
    .map((teams, index) => ({ groupLabel: `Groupe ${index + 1}`, teams }));
}

interface CanQualifiersRoundsResult {
  fixtures: CanQualifierFixture[];
  groups: CanQualifierDerivedGroup[];
  error: string | null;
}

// The first two September 2026 matchdays (confirmed live via API-Football:
// 2026-09-23 and 2026-09-27, 24 fixtures each) — empty on any failure
// (unconfigured/network/season not resolvable), never throws. Shared by
// getCanQualifiersFixtures and getCanQualifiersStandings's pre-season
// fallback so both call sites derive groups from the exact same fetch
// (Next.js dedupes the identical underlying `fetch` calls within a request,
// so calling this twice doesn't double the real network cost).
async function getCanQualifiersRounds(): Promise<CanQualifiersRoundsResult> {
  const season = await getLeagueCurrentSeason(CAN_2027_QUALIFIERS_LEAGUE_ID);
  if (!season) return { fixtures: [], groups: [], error: "Saison CAN 2027 introuvable via API-Football." };

  const rounds = await Promise.all(
    FIRST_TWO_MATCHDAYS.map((round) => getFixturesForRound(CAN_2027_QUALIFIERS_LEAGUE_ID, season.querySeason, round))
  );

  const rawFixtures = rounds.flatMap((result) => (result.error ? [] : result.data));

  const fixtures = rawFixtures
    .map(
      (fixture): CanQualifierFixture => ({
        id: fixture.fixture.id,
        homeTeam: fixture.teams.home,
        awayTeam: fixture.teams.away,
        kickoffAt: fixture.fixture.date,
        round: fixture.league.round,
      })
    )
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

  const roundError = rounds.find((result) => result.error)?.error ?? null;
  return { fixtures, groups: deriveGroups(rawFixtures), error: fixtures.length === 0 ? roundError : null };
}

export async function getCanQualifiersFixtures(): Promise<CanQualifiersFixturesResult> {
  const { fixtures, error } = await getCanQualifiersRounds();
  return { fixtures, error };
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

export interface CanQualifiersStandingsResult {
  // null means the season couldn't be resolved or the API call failed,
  // distinct from a successfully-fetched (but possibly all-zero) result. The
  // view (can-qualifiers-standings.tsx) is what decides "not started yet"
  // vs "genuinely unavailable" — every row can legitimately show 0 played
  // before matchday 1 even on a fully successful fetch, so that distinction
  // doesn't belong in this data layer.
  groups: CanQualifierGroup[] | null;
  // The reason `groups` is null, surfaced up to the UI for diagnosability.
  error: string | null;
  // True when `groups` was built from deriveGroups() (0-point placeholder
  // rows, "Groupe N" labels) rather than API-Football's own /standings —
  // the view uses this to skip the "hasStarted" 0-played heuristic, which
  // would otherwise be redundant with (and just as honest as) this flag.
  isProvisional: boolean;
}

function zeroStandingRow(team: ApiFixtureTeam): CanQualifierStandingRow {
  return {
    teamId: team.id,
    teamName: team.name,
    teamLogo: team.logo,
    points: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalsDiff: 0,
  };
}

export async function getCanQualifiersStandings(): Promise<CanQualifiersStandingsResult> {
  const season = await getLeagueCurrentSeason(CAN_2027_QUALIFIERS_LEAGUE_ID);
  if (!season) return { groups: null, error: "Saison CAN 2027 introuvable via API-Football.", isProvisional: false };

  const result = await getStandingsForSeason(CAN_2027_QUALIFIERS_LEAGUE_ID, season.querySeason);
  if (result.error) return { groups: null, error: result.error, isProvisional: false };

  const apiGroups = result.data[0]?.league.standings ?? [];
  if (apiGroups.length > 0) {
    return {
      groups: apiGroups
        .filter((group) => group.length > 0)
        .map(
          (group): CanQualifierGroup => ({
            groupLabel: group[0].group,
            rows: group.map(toStandingRow),
          })
        )
        .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel)),
      error: null,
      isProvisional: false,
    };
  }

  // API-Football hasn't published standings for this season yet (pre-season
  // — "league.standings: false" on every fixture, confirmed by hand): build
  // the initial 0-point table ourselves from the fixture pairings so the
  // groups and teams are visible immediately instead of a placeholder
  // message. This becomes dead weight the moment API-Football populates
  // real standings — the branch above takes over automatically.
  const { groups: derivedGroups, error: fixturesError } = await getCanQualifiersRounds();
  if (derivedGroups.length === 0) return { groups: null, error: fixturesError, isProvisional: false };

  return {
    groups: derivedGroups.map((group) => ({
      groupLabel: group.groupLabel,
      rows: group.teams.map(zeroStandingRow),
    })),
    error: null,
    isProvisional: true,
  };
}
