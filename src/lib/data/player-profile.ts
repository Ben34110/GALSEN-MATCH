import { getAfricanPlayers } from "@/lib/data/african-players";
import { getTeamDirectory } from "@/lib/data/team-directory";
import { getRecentMatchesForTeam, getUpcomingMatchesForTeam } from "@/lib/data/live";
import { AFRICAN_NATIONS } from "@/lib/data/african-nations";
import {
  getFixturePlayerStats,
  getLeagueCurrentSeason,
  getPlayerProfile,
  getPlayerTransfers,
  type ApiPlayerStatEntry,
} from "@/lib/api-football";
import type { Match, PlayerDetail, PlayerMatchEvent, PlayerSeasonStats, PlayerTransferRecord } from "@/types";

// Same "is this a real club, not a national-team or youth-team stat line"
// filter as scripts/sync-african-players.mjs's isClubStatEntry/bestClubEntry
// — /players?id=&season= mixes a player's club AND national-team
// appearances into one flat `statistics` array, keyed only by team name, so
// a naive "most appearances" pick can land on "Senegal" instead of the
// player's actual club. Built from AFRICAN_NATIONS instead of a second
// copy of the sync script's literal list, so the two can't drift apart.
const NATION_NAME_SET = new Set(AFRICAN_NATIONS.map((n) => n.nationality.toLowerCase()));
const YOUTH_TEAM_RE = /\bU1[5-9]\b|\bU2[0-3]\b/i;

function isClubStatEntry(teamName: string | null | undefined): boolean {
  if (!teamName) return false;
  if (NATION_NAME_SET.has(teamName.toLowerCase())) return false;
  if (YOUTH_TEAM_RE.test(teamName)) return false;
  return true;
}

function bestClubEntry(entries: ApiPlayerStatEntry[]): ApiPlayerStatEntry | undefined {
  return [...entries]
    .filter((entry) => isClubStatEntry(entry.team?.name))
    .sort((a, b) => (b.games.appearences ?? 0) - (a.games.appearences ?? 0))[0];
}

function displaySeasonLabel(season: number): string {
  return `${season}-${season + 1}`;
}

// This player's own goals/assists in one already-finished fixture — the
// "3 derniers matchs" list's per-row ⚽/👟 icons need the PLAYER's stat
// line, not just the team scoreline the row already shows. Searches both
// teams' rosters (rather than assuming the player's own team's array,
// which /fixtures/players doesn't order predictably) for the matching
// player id; returns null on any miss (rotated out entirely, API error,
// or a "did not play" 0-minute entry the caller treats the same as "no
// events" either way).
async function fetchMatchEvents(playerId: number, fixtureId: number): Promise<PlayerMatchEvent | null> {
  const result = await getFixturePlayerStats(fixtureId);
  if (result.error) return null;
  for (const teamEntry of result.data) {
    const playerEntry = teamEntry.players.find((p) => p.player.id === playerId);
    if (playerEntry) {
      const stats = playerEntry.statistics[0];
      return { goals: stats?.goals.total ?? 0, assists: stats?.goals.assists ?? 0 };
    }
  }
  return null;
}

// Only the 3 matches actually shown get their own fetch (one per fixture,
// no batch endpoint exists) — capped by the caller already slicing to 3
// before this runs, not here.
async function fetchRecentMatchEvents(playerId: number, matches: Match[]): Promise<Record<string, PlayerMatchEvent>> {
  const entries = await Promise.all(
    matches.map(async (match): Promise<[string, PlayerMatchEvent] | null> => {
      if (!match.apiFixtureId) return null;
      const events = await fetchMatchEvents(playerId, match.apiFixtureId);
      return events ? [match.id, events] : null;
    })
  );
  return Object.fromEntries(entries.filter((entry): entry is [string, PlayerMatchEvent] => entry !== null));
}

// Every other endpoint this app calls with a `season` needs the exact
// number API-Football itself considers current for that competition (see
// getLeagueCurrentSeason's own comment) — resolved via the player's club's
// league when known (now that lib/data/generated/teams.json covers the 5
// big European leagues too, see scripts/sync-teams.mjs), current calendar
// year and the year before as a last-resort guess otherwise (covers a
// player at a club outside the 14 tracked leagues).
async function resolveSeasonCandidates(teamId: number | null): Promise<number[]> {
  const currentYear = new Date().getFullYear();
  if (teamId) {
    const team = getTeamDirectory().find((t) => t.id === teamId);
    if (team && team.leagueId !== 0) {
      const season = await getLeagueCurrentSeason(team.leagueId);
      if (season) return [season.querySeason, season.querySeason - 1];
    }
  }
  return [currentYear, currentYear - 1];
}

// Combines the static bio already known from african-players.json (id,
// name, photo, nationality, position, current club — no request needed)
// with live API-Football lookups for the parts that genuinely need
// per-player calls: current-season stats, transfer history, and the
// player's club's last/next 3 matches (approximated as the player's own —
// same simplification PitchView's "prochain match" tooltip already makes,
// API-Football has no per-player "did they actually play" filter on
// upcoming fixtures). Returns null only when the id isn't in the tracked
// pool at all (not a transient fetch failure — each section below degrades
// independently instead of blanking the whole page).
export async function getPlayerDetail(playerId: number): Promise<PlayerDetail | null> {
  const base = getAfricanPlayers().find((p) => p.id === playerId);
  if (!base) return null;

  const seasonCandidates = await resolveSeasonCandidates(base.teamId);

  let currentSeason: PlayerSeasonStats | null = null;
  for (const season of seasonCandidates) {
    const result = await getPlayerProfile(playerId, season);
    if (result.error || result.data.length === 0) continue;
    const best = bestClubEntry(result.data[0].statistics);
    if (!best) continue;
    currentSeason = {
      displaySeason: displaySeasonLabel(season),
      leagueName: best.league.name,
      teamName: best.team.name,
      teamLogo: best.team.logo,
      appearances: best.games.appearences ?? 0,
      goals: best.goals.total ?? 0,
      assists: best.goals.assists ?? 0,
      rating: best.games.rating ? Number(best.games.rating) : null,
      yellowCards: best.cards.yellow ?? 0,
      redCards: best.cards.red ?? 0,
    };
    break;
  }

  const [transfersResult, recentMatches, upcomingMatches] = await Promise.all([
    getPlayerTransfers(playerId),
    base.teamId ? getRecentMatchesForTeam(base.teamId, 5) : Promise.resolve([]),
    base.teamId ? getUpcomingMatchesForTeam(base.teamId, 5).catch(() => []) : Promise.resolve([]),
  ]);

  const transfers: PlayerTransferRecord[] = transfersResult.error
    ? []
    : (transfersResult.data[0]?.transfers ?? [])
        .filter((t) => t.teams.in.id != null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 15)
        .map((t) => ({
          date: t.date,
          type: t.type,
          clubFrom: t.teams.out?.id != null ? { id: t.teams.out.id, name: t.teams.out.name, logo: t.teams.out.logo } : null,
          clubTo: { id: t.teams.in.id as number, name: t.teams.in.name, logo: t.teams.in.logo },
        }));

  const recentMatchesTop3 = recentMatches.slice(0, 3);
  const recentMatchEvents = await fetchRecentMatchEvents(playerId, recentMatchesTop3);

  return {
    id: base.id,
    name: base.name,
    firstname: base.firstname,
    lastname: base.lastname,
    age: base.age,
    nationality: base.nationality,
    photo: base.photo,
    position: base.position,
    teamId: base.teamId,
    teamName: base.teamName,
    teamLogo: base.teamLogo,
    currentSeason,
    recentMatches: recentMatchesTop3,
    recentMatchEvents,
    upcomingMatches: upcomingMatches.slice(0, 3),
    transfers,
  };
}
