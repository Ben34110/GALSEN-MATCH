import { getRecentFixturesForTeam, getFixturePlayerStats } from "@/lib/api-football";

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

// A player who doesn't feature in their team's journée match still counts
// for the fantasy score — see components/fantasy/game-rules-sheet.tsx's
// "note automatique de 5/10" rule — rather than leaving their score
// undefined for the whole journée.
const UNPLAYED_DEFAULT_RATING = 5;

// Key moments for the one journée match a rating covers — shown on tap once
// a player's rating is in (pitch-view.tsx's MatchMomentsTooltip), so the
// same fetch that resolves the rating also answers "what actually
// happened". API-Football's player-stats endpoint has no expected-goals
// field on this plan, so shots-on-target is the closest proxy offered
// instead of xG.
export interface PlayerMatchMoments {
  minutes: number | null;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  shotsTotal: number | null;
  shotsOnTarget: number | null;
  duelsWon: number | null;
  duelsTotal: number | null;
  opponentName: string;
  opponentLogo: string;
  isHome: boolean;
  teamScore: number | null;
  opponentScore: number | null;
}

export interface PlayerJourneeRating {
  // "rated" once the team's match inside the journée's week has finished
  // (win, lose, or the player never left the bench) — "pending" beforehand,
  // whether the match hasn't kicked off yet or is still in progress.
  status: "pending" | "rated";
  rating: number | null; // set only when status is "rated"
  // Absent when the player never appears in the fixture's player-stats
  // response at all (team lost the ball to a walkover, API gap, etc.) —
  // the UNPLAYED_DEFAULT_RATING case below still has a fixture to describe,
  // just no personal stats to show beyond "didn't feature".
  moments?: PlayerMatchMoments;
}

// Finds *this* journée's fixture for a team (by kickoff falling inside its
// calendar week — see fantasy-gameweek.ts's getJourneeWeekRange) among its
// recently played matches, and returns the player's rating from it once
// finished. "last 5" is generous slack for a team that plays more than
// once in a week (cup + league) without needing the exact fixture id ahead
// of time.
export async function getPlayerJourneeRating(
  playerId: number,
  teamId: number,
  weekStart: Date,
  weekEnd: Date
): Promise<PlayerJourneeRating> {
  const recent = await getRecentFixturesForTeam(teamId, 5);
  if (recent.error) return { status: "pending", rating: null };

  const fixture = recent.data.find((f) => {
    const kickoff = new Date(f.fixture.date).getTime();
    return (
      kickoff >= weekStart.getTime() &&
      kickoff < weekEnd.getTime() &&
      FINISHED_STATUSES.has(f.fixture.status.short) &&
      (f.teams.home.id === teamId || f.teams.away.id === teamId)
    );
  });
  if (!fixture) return { status: "pending", rating: null };

  const stats = await getFixturePlayerStats(fixture.fixture.id);
  if (stats.error) return { status: "pending", rating: null };

  const teamBlock = stats.data.find((t) => t.team.id === teamId);
  const playerEntry = teamBlock?.players.find((p) => p.player.id === playerId);
  const playerStats = playerEntry?.statistics[0];
  const ratingStr = playerStats?.games.rating;
  const rating = ratingStr ? Number.parseFloat(ratingStr) : UNPLAYED_DEFAULT_RATING;

  const isHome = fixture.teams.home.id === teamId;
  const opponentTeam = isHome ? fixture.teams.away : fixture.teams.home;
  const moments: PlayerMatchMoments = {
    minutes: playerStats?.games.minutes ?? null,
    goals: playerStats?.goals.total ?? 0,
    assists: playerStats?.goals.assists ?? 0,
    yellowCards: playerStats?.cards.yellow ?? 0,
    redCards: playerStats?.cards.red ?? 0,
    shotsTotal: playerStats?.shots.total ?? null,
    shotsOnTarget: playerStats?.shots.on ?? null,
    duelsWon: playerStats?.duels.won ?? null,
    duelsTotal: playerStats?.duels.total ?? null,
    opponentName: opponentTeam.name,
    opponentLogo: opponentTeam.logo,
    isHome,
    teamScore: (isHome ? fixture.goals.home : fixture.goals.away) ?? null,
    opponentScore: (isHome ? fixture.goals.away : fixture.goals.home) ?? null,
  };

  return { status: "rated", rating: Number.isFinite(rating) ? rating : UNPLAYED_DEFAULT_RATING, moments };
}
