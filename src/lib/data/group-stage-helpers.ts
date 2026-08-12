import {
  getFixturesForRound,
  getLeagueCurrentSeason,
  getStandingsForSeason,
  type ApiFixture,
  type ApiFixtureTeam,
  type ApiStandingRow,
} from "@/lib/api-football";

// Shared by lib/data/can-qualifiers.ts and lib/data/u17-world-cup.ts — both
// are the same shape of competition (a 48-team, 12-group-of-4 group stage,
// standings unpublished by API-Football until some matches have actually
// been played), just different league ids/round names. Extracted here
// instead of duplicated so the trickier part (deriveGroups' union-find,
// and the "standings not published yet" fallback) has one implementation.

export interface GroupStageFixture {
  id: number;
  homeTeam: { id: number; name: string; logo: string };
  awayTeam: { id: number; name: string; logo: string };
  kickoffAt: string;
  round: string;
}

export interface GroupStageStandingRow {
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

export interface GroupStageGroup {
  groupLabel: string;
  rows: GroupStageStandingRow[];
}

export interface GroupStageFixturesResult {
  fixtures: GroupStageFixture[];
  error: string | null;
}

interface DerivedGroup {
  groupLabel: string;
  teams: ApiFixtureTeam[];
}

// API-Football doesn't tag pre-season fixtures with a group — so groups are
// reconstructed from two fetched matchdays: any two teams that face each
// other belong to the same group of 4, and union-find over every kickoff in
// both rounds reliably clusters all the teams into their groups. Labels are
// plain "Groupe N" — there's no official A-L lettering to borrow pre-season;
// getGroupStageStandings drops this entirely in favor of the real groups
// the moment API-Football publishes them.
function deriveGroups(rawFixtures: ApiFixture[]): DerivedGroup[] {
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

interface GroupStageRoundsResult {
  fixtures: GroupStageFixture[];
  groups: DerivedGroup[];
  error: string | null;
}

// Fetches the first two named matchdays for a competition — empty on any
// failure (unconfigured/network/season not resolvable), never throws.
// Shared by getGroupStageFixtures and getGroupStageStandings's pre-season
// fallback so both call sites derive groups from the exact same fetch
// (Next.js dedupes the identical underlying `fetch` calls within a request).
export async function getGroupStageRounds(leagueId: number, matchdayRounds: [string, string]): Promise<GroupStageRoundsResult> {
  const season = await getLeagueCurrentSeason(leagueId);
  if (!season) return { fixtures: [], groups: [], error: "Saison introuvable via API-Football." };

  const rounds = await Promise.all(matchdayRounds.map((round) => getFixturesForRound(leagueId, season.querySeason, round)));

  const rawFixtures = rounds.flatMap((result) => (result.error ? [] : result.data));

  const fixtures = rawFixtures
    .map(
      (fixture): GroupStageFixture => ({
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

export async function getGroupStageFixtures(leagueId: number, matchdayRounds: [string, string]): Promise<GroupStageFixturesResult> {
  const { fixtures, error } = await getGroupStageRounds(leagueId, matchdayRounds);
  return { fixtures, error };
}

function toStandingRow(row: ApiStandingRow): GroupStageStandingRow {
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

export interface GroupStageStandingsResult {
  // null means the season couldn't be resolved or the API call failed,
  // distinct from a successfully-fetched (but possibly all-zero) result —
  // the view decides "not started yet" vs "genuinely unavailable".
  groups: GroupStageGroup[] | null;
  error: string | null;
  // True when `groups` was built from deriveGroups() (0-point placeholder
  // rows, "Groupe N" labels) rather than API-Football's own /standings.
  isProvisional: boolean;
}

function zeroStandingRow(team: ApiFixtureTeam): GroupStageStandingRow {
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

export async function getGroupStageStandings(leagueId: number, matchdayRounds: [string, string]): Promise<GroupStageStandingsResult> {
  const season = await getLeagueCurrentSeason(leagueId);
  if (!season) return { groups: null, error: "Saison introuvable via API-Football.", isProvisional: false };

  const result = await getStandingsForSeason(leagueId, season.querySeason);
  if (result.error) return { groups: null, error: result.error, isProvisional: false };

  const apiGroups = result.data[0]?.league.standings ?? [];
  if (apiGroups.length > 0) {
    return {
      groups: apiGroups
        .filter((group) => group.length > 0)
        .map((group): GroupStageGroup => ({ groupLabel: group[0].group, rows: group.map(toStandingRow) }))
        .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel)),
      error: null,
      isProvisional: false,
    };
  }

  // API-Football hasn't published standings for this season yet: build the
  // initial 0-point table ourselves from the fixture pairings so the groups
  // and teams are visible immediately instead of a placeholder message.
  // This becomes dead weight the moment API-Football populates real
  // standings — the branch above takes over automatically.
  const { groups: derivedGroups, error: fixturesError } = await getGroupStageRounds(leagueId, matchdayRounds);
  if (derivedGroups.length === 0) return { groups: null, error: fixturesError, isProvisional: false };

  return {
    groups: derivedGroups.map((group) => ({ groupLabel: group.groupLabel, rows: group.teams.map(zeroStandingRow) })),
    error: null,
    isProvisional: true,
  };
}
