import { getRecentFixturesForTeam, getFixturePlayerStats, getFixtureLineups } from "@/lib/api-football";

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);
const STARTED_STATUSES = new Set(["1H", "2H", "HT", "ET", "P", "LIVE", "BT"]);

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
  tacklesTotal: number | null;
  saves: number | null;
  opponentName: string;
  opponentLogo: string;
  isHome: boolean;
  teamScore: number | null;
  opponentScore: number | null;
}

export interface PlayerJourneeRating {
  // "rated" once the team's match inside the journée's week has finished
  // (win, lose, or the player never left the bench). "live" while that
  // match is currently in progress — API-Football's rating field updates
  // in near-real-time during a live match, not just once it's over, so
  // this carries a real (if still-moving) rating when one's already
  // available. "pending" beforehand, before kickoff.
  status: "pending" | "live" | "rated";
  rating: number | null; // set for "rated", and for "live" once the player has one yet
  // Absent when the player never appears in the fixture's player-stats
  // response at all (team lost the ball to a walkover, API gap, etc.) —
  // the UNPLAYED_DEFAULT_RATING case below still has a fixture to describe,
  // just no personal stats to show beyond "didn't feature".
  moments?: PlayerMatchMoments;
  // Only set once the player hasn't (yet) actually featured in the match
  // (0 minutes) — distinguishes "still might come on" from "never had a
  // chance to" so the pitch view can stop implying they're on the pitch
  // (see pitch-view.tsx's live dot) and show the right waiting message
  // instead. Undefined the moment they've played any minutes at all —
  // from then on they're just a normal rated/live player, sub or not.
  squadStatus?: "bench" | "excluded";
}

// Finds *this* journée's fixture for a team (by kickoff falling inside its
// calendar week — see fantasy-gameweek.ts's getJourneeWeekRange) among its
// recently played matches, and returns the player's rating from it once
// finished — or its live, still-updating rating while the match is still
// in progress (API-Football's "last N fixtures" endpoint already includes
// an in-progress match, not just completed ones, so no separate live-
// fixtures lookup is needed here). "last 5" is generous slack for a team
// that plays more than once in a week (cup + league) without needing the
// exact fixture id ahead of time.
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
    const status = f.fixture.status.short;
    return (
      kickoff >= weekStart.getTime() &&
      kickoff < weekEnd.getTime() &&
      (FINISHED_STATUSES.has(status) || STARTED_STATUSES.has(status)) &&
      (f.teams.home.id === teamId || f.teams.away.id === teamId)
    );
  });
  if (!fixture) return { status: "pending", rating: null };

  const isLive = STARTED_STATUSES.has(fixture.fixture.status.short);
  // Live ratings genuinely change minute to minute — the default 1h cache
  // (fine once a match is over and its stats are frozen) would otherwise
  // show a stale in-match rating for up to an hour.
  const stats = await getFixturePlayerStats(fixture.fixture.id, isLive ? 45 : 60 * 60);
  if (stats.error) return isLive ? { status: "live", rating: null } : { status: "pending", rating: null };

  const teamBlock = stats.data.find((t) => t.team.id === teamId);
  const playerEntry = teamBlock?.players.find((p) => p.player.id === playerId);
  const playerStats = playerEntry?.statistics[0];
  const ratingStr = playerStats?.games.rating;

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
    tacklesTotal: playerStats?.tackles.total ?? null,
    saves: playerStats?.goals.saves ?? null,
    opponentName: opponentTeam.name,
    opponentLogo: opponentTeam.logo,
    isHome,
    teamScore: (isHome ? fixture.goals.home : fixture.goals.away) ?? null,
    opponentScore: (isHome ? fixture.goals.away : fixture.goals.home) ?? null,
  };

  let squadStatus: PlayerJourneeRating["squadStatus"];
  if ((moments.minutes ?? 0) <= 0) {
    // Same lineup source the "not in squad" push notification uses (see
    // app/api/cron/poll/route.ts) — only fetched for this (rarer) case, so
    // the common "actually played" path never pays for a second API call.
    const lineupResult = await getFixtureLineups(fixture.fixture.id);
    const teamLineup = lineupResult.error ? null : lineupResult.data.find((t) => t.team.id === teamId);
    if (teamLineup) {
      if (teamLineup.substitutes.some((s) => s.player.id === playerId)) squadStatus = "bench";
      else if (!teamLineup.startXI.some((s) => s.player.id === playerId)) squadStatus = "excluded";
    }
  }

  if (isLive) {
    const liveRating = ratingStr ? Number.parseFloat(ratingStr) : null;
    return { status: "live", rating: liveRating !== null && Number.isFinite(liveRating) ? liveRating : null, moments, squadStatus };
  }

  const rating = ratingStr ? Number.parseFloat(ratingStr) : UNPLAYED_DEFAULT_RATING;
  return { status: "rated", rating: Number.isFinite(rating) ? rating : UNPLAYED_DEFAULT_RATING, moments, squadStatus };
}
