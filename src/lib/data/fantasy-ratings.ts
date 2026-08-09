import { getRecentFixturesForTeam, getFixturePlayerStats } from "@/lib/api-football";

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

// A player who doesn't feature in their team's journée match still counts
// for the fantasy score — see components/fantasy/game-rules-sheet.tsx's
// "note automatique de 5/10" rule — rather than leaving their score
// undefined for the whole journée.
const UNPLAYED_DEFAULT_RATING = 5;

export interface PlayerJourneeRating {
  // "rated" once the team's match inside the journée's week has finished
  // (win, lose, or the player never left the bench) — "pending" beforehand,
  // whether the match hasn't kicked off yet or is still in progress.
  status: "pending" | "rated";
  rating: number | null; // set only when status is "rated"
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
  const ratingStr = playerEntry?.statistics[0]?.games.rating;
  const rating = ratingStr ? Number.parseFloat(ratingStr) : UNPLAYED_DEFAULT_RATING;

  return { status: "rated", rating: Number.isFinite(rating) ? rating : UNPLAYED_DEFAULT_RATING };
}
