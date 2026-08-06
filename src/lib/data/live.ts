import { getFixtureById, getFixtureLineups, getUpcomingFixturesForTeam, type ApiFixture } from "@/lib/api-football";
import type { Match, MatchLineup, MatchLineupPlayer, MatchStatus, TeamRef } from "@/types";

// The live-scores/standings browsing tab ("Matchs") was removed when the app
// narrowed to African football info + Fantasy — this module now only
// backs what's still needed: a single fixture's detail + announced lineup
// (linked to from Fantasy's "prochain match" tooltip), and a team's
// upcoming fixtures (Fantasy's opponent-this-week lookup + the club
// notification poller, see app/api/cron/poll/route.ts).

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

function sortByKickoff(list: Match[]): Match[] {
  return [...list].sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
}

export async function getFixtureDetail(fixtureId: number): Promise<Match | null> {
  const result = await getFixtureById(fixtureId);
  if (result.error || result.data.length === 0) return null;
  return mapFixtureToMatch(result.data[0]);
}

function mapLineupPlayer(entry: { player: { id: number; name: string; number: number | null; pos: string | null } }): MatchLineupPlayer {
  return { id: entry.player.id, name: entry.player.name, number: entry.player.number, position: entry.player.pos };
}

// Both teams' starting XI/bench once announced — an empty array here means
// "not published yet" (usually ~1h before kickoff), not an error; the
// caller can't tell the difference and shouldn't need to (see
// app/(app)/live/match/[id]/page.tsx).
export async function getMatchLineups(fixtureId: number): Promise<MatchLineup[]> {
  const result = await getFixtureLineups(fixtureId);
  if (result.error) return [];
  return result.data.map((lineup) => ({
    team: { id: String(lineup.team.id), name: lineup.team.name, logo: lineup.team.logo },
    coachName: lineup.coach?.name ?? null,
    formation: lineup.formation,
    startXI: lineup.startXI.map(mapLineupPlayer),
    substitutes: lineup.substitutes.map(mapLineupPlayer),
  }));
}

// All upcoming fixtures for one favorited/Fantasy-relevant team, across
// every competition it plays in. Throwing (instead of swallowing the error
// into an empty array) lets callers distinguish a rejected promise ("Prochain
// match indisponible") from a genuinely empty array ("Aucun match à venir
// programmé") — see components/fantasy/pitch-view.tsx and
// player-picker-sheet.tsx, which both already make that distinction.
export async function getUpcomingMatchesForTeam(teamId: number, count = 10): Promise<Match[]> {
  const result = await getUpcomingFixturesForTeam(teamId, count);
  if (result.error) throw new Error(result.error);
  return sortByKickoff(result.data.map(mapFixtureToMatch));
}
