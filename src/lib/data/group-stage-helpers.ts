import {
  getAllFixturesForSeason,
  getLeagueCurrentSeason,
  getStandingsForSeason,
  type ApiFixture,
  type ApiFixtureTeam,
  type ApiStandingRow,
} from "@/lib/api-football";
import { getAfricanNationByNationality } from "@/lib/data/african-nations";

// Every entrant in these competitions is a national team, so a country flag
// reads faster than its federation crest and matches the flag-first
// treatment used everywhere else a nation is represented in this app (see
// fifa-ranking-table.tsx, player-picker-sheet.tsx). Team names from
// API-Football don't always match AFRICAN_NATIONS.nationality verbatim —
// same mismatches already catalogued in scripts/sync-fifa-ranking.mjs's own
// NATION_NAME_ALIASES — and the U17 World Cup's names also carry a trailing
// age-group suffix ("Senegal U17") on top of that.
const NATION_NAME_ALIASES: Record<string, string> = {
  "Côte d'Ivoire": "Ivory Coast",
  "Congo DR": "DR Congo",
  "Cabo Verde": "Cape Verde",
  "The Gambia": "Gambia",
};

export function normalizeNationName(teamName: string): string {
  const countryName = teamName.replace(/\s+U(17|20|23)$/, "");
  return NATION_NAME_ALIASES[countryName] ?? countryName;
}

// A handful of competing nations' full names are long enough to overflow a
// fixture row's fixed-width team-name slot even with `truncate` applied
// (confirmed: "Equatorial Guinea" and "Central African Republic" both
// compete in the CAN 2027 qualifiers) — shortened here rather than relying
// on an ellipsis mid-word, which reads worse than a clear abbreviation.
// Keyed on the raw API-Football team name (matches fixture.teams.home/
// away.name directly, before any U17 suffix stripping), not run through
// normalizeNationName, since callers display this instead of the original
// name, not as a lookup key.
const LONG_NAME_SHORTHANDS: Record<string, string> = {
  "Equatorial Guinea": "Eq. Guinea",
  "Central African Republic": "CAR",
  "Sao Tome and Principe": "Sao Tome & Principe",
  "Democratic Republic of Congo": "DR Congo",
};

export function shortenTeamName(teamName: string): string {
  const suffixMatch = teamName.match(/^(.*?)(\s+U(?:17|20|23))$/);
  const base = suffixMatch ? suffixMatch[1] : teamName;
  const suffix = suffixMatch ? suffixMatch[2] : "";
  return (LONG_NAME_SHORTHANDS[base] ?? base) + suffix;
}

// A fixture's `round` string is a raw API-Football value ("Group Stage -
// 3", "Preliminary Round", ...) — this pulls out just the matchday number
// (or signals the preliminary round) so the UI (can-qualifiers-fixtures-
// list.tsx, u17-world-cup-fixtures-list.tsx) can render a translated label
// for WHATEVER round is currently showing, instead of a fixed two-entry
// map tied to specific matchday numbers (which is what let those labels
// carry a hardcoded calendar date that went stale the moment that
// matchday was actually played — the round shown is now picked
// dynamically, see currentRoundWindow below).
export function parseGroupStageRound(round: string): { matchday: number } | { preliminary: true } | null {
  const match = round.match(/^Group Stage - (\d+)$/);
  if (match) return { matchday: Number(match[1]) };
  if (round === "Preliminary Round") return { preliminary: true };
  return null;
}

// undefined for the rare non-African/unmapped name — callers fall back to
// the raw team logo in that case.
export function getGroupStageTeamFlag(teamName: string): string | undefined {
  return getAfricanNationByNationality(normalizeNationName(teamName))?.flag;
}

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

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

// Which matchday(s) to actually show — the earliest round that isn't fully
// finished yet (its own kickoff date may already be in the past: a round
// spread across several days, or a postponed fixture, still counts as
// "current" until every one of its fixtures has a final result), plus the
// round right after it for the same two-matchday window the UI has always
// shown. Used to replace a hardcoded round name (which used to go stale
// the moment that matchday was actually played — confirmed: the CAN
// qualifiers section kept showing the 23/27 September matchdays long after
// both had finished) with whatever's genuinely next. Falls back to the
// single last round once the whole competition is over (nothing left to
// be "current"), so there's still something to show instead of blanking
// the section.
function currentRoundWindow(allFixtures: ApiFixture[]): string[] {
  const byRound = new Map<string, ApiFixture[]>();
  for (const fixture of allFixtures) {
    const list = byRound.get(fixture.league.round) ?? [];
    list.push(fixture);
    byRound.set(fixture.league.round, list);
  }

  const rounds = Array.from(byRound.entries())
    .map(([round, fixtures]) => ({
      round,
      minDate: Math.min(...fixtures.map((f) => new Date(f.fixture.date).getTime())),
      allFinished: fixtures.every((f) => FINISHED_STATUSES.has(f.fixture.status.short)),
    }))
    .sort((a, b) => a.minDate - b.minDate);

  if (rounds.length === 0) return [];

  const currentIndex = rounds.findIndex((r) => !r.allFinished);
  const startIndex = currentIndex === -1 ? rounds.length - 1 : currentIndex;
  return rounds.slice(startIndex, startIndex + 2).map((r) => r.round);
}

// Fetches the whole season's fixtures once, then narrows to whichever
// matchday(s) are current — empty on any failure (unconfigured/network/
// season not resolvable), never throws. Shared by getGroupStageFixtures
// and getGroupStageStandings's pre-season fallback so both call sites
// derive groups from the exact same fetch (Next.js dedupes the identical
// underlying `fetch` call within a request).
export async function getGroupStageRounds(leagueId: number): Promise<GroupStageRoundsResult> {
  const season = await getLeagueCurrentSeason(leagueId);
  if (!season) return { fixtures: [], groups: [], error: "Saison introuvable via API-Football." };

  const result = await getAllFixturesForSeason(leagueId, season.querySeason);
  if (result.error) return { fixtures: [], groups: [], error: result.error };

  const windowRounds = new Set(currentRoundWindow(result.data));
  const rawFixtures = result.data.filter((fixture) => windowRounds.has(fixture.league.round));

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

  return { fixtures, groups: deriveGroups(rawFixtures), error: fixtures.length === 0 ? "Aucun calendrier disponible." : null };
}

export async function getGroupStageFixtures(leagueId: number): Promise<GroupStageFixturesResult> {
  const { fixtures, error } = await getGroupStageRounds(leagueId);
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

// Points, then goal difference, then goals scored — the standard CAF/FIFA
// group-stage tiebreak order. API-Football's own /standings response is
// already rank-ordered this way in practice (confirmed by hand), but
// nothing here enforced it — relying on that implicitly meant a future
// API quirk, or the 0-point provisional fallback below (where every row
// ties on everything until real results exist), could silently show two
// same-points teams in the wrong order. Sorted explicitly instead of
// trusted.
function sortStandingRows(rows: GroupStageStandingRow[]): GroupStageStandingRow[] {
  return [...rows].sort((a, b) => b.points - a.points || b.goalsDiff - a.goalsDiff || b.goalsFor - a.goalsFor);
}

export async function getGroupStageStandings(leagueId: number): Promise<GroupStageStandingsResult> {
  const season = await getLeagueCurrentSeason(leagueId);
  if (!season) return { groups: null, error: "Saison introuvable via API-Football.", isProvisional: false };

  const result = await getStandingsForSeason(leagueId, season.querySeason);
  if (result.error) return { groups: null, error: result.error, isProvisional: false };

  const apiGroups = result.data[0]?.league.standings ?? [];
  if (apiGroups.length > 0) {
    return {
      groups: apiGroups
        .filter((group) => group.length > 0)
        .map((group): GroupStageGroup => ({ groupLabel: group[0].group, rows: sortStandingRows(group.map(toStandingRow)) }))
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
  const { groups: derivedGroups, error: fixturesError } = await getGroupStageRounds(leagueId);
  if (derivedGroups.length === 0) return { groups: null, error: fixturesError, isProvisional: false };

  return {
    groups: derivedGroups.map((group) => ({ groupLabel: group.groupLabel, rows: sortStandingRows(group.teams.map(zeroStandingRow)) })),
    error: null,
    isProvisional: true,
  };
}
