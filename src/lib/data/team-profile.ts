import { getTeamDirectory } from "@/lib/data/team-directory";
import { getRecentMatchesForTeam, getUpcomingMatchesForTeam } from "@/lib/data/live";
import { getFifaRanking } from "@/lib/data/fifa-ranking";
import { getLeagueCurrentSeason, getStandingsForSeason } from "@/lib/api-football";
import type { TeamDetail, TeamStandingSummary } from "@/types";

// Shared by both clubs and national teams (see LeagueTeam's `type` in
// lib/data/generated/teams.json) — clubs get a real domestic-league
// standings row, national teams get their FifaRankingRow instead (no
// /standings call needed at all: lib/data/fifa-ranking.ts is a static
// pre-scraped snapshot, matched by country name — the same English name
// used for both LeagueTeam.name and FifaRankingRow.country, since both
// ultimately trace back to the same NATIONAL_TEAMS list). Returns null
// only when the id isn't in the tracked directory at all.
export async function getTeamDetail(teamId: number): Promise<TeamDetail | null> {
  const team = getTeamDirectory().find((t) => t.id === teamId);
  if (!team) return null;

  const [recentMatches, upcomingMatches] = await Promise.all([
    getRecentMatchesForTeam(teamId, 5),
    getUpcomingMatchesForTeam(teamId, 5).catch(() => []),
  ]);

  let standing: TeamStandingSummary | null = null;
  let fifaRanking = null;

  if (team.type === "club") {
    const season = await getLeagueCurrentSeason(team.leagueId);
    if (season) {
      const result = await getStandingsForSeason(team.leagueId, season.querySeason);
      if (!result.error) {
        const row = result.data[0]?.league.standings.flat().find((r) => r.team.id === teamId);
        if (row) {
          standing = {
            rank: row.rank,
            leagueName: team.leagueName,
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
      }
    }
  } else {
    fifaRanking = getFifaRanking().rows.find((row) => row.country === team.name) ?? null;
  }

  return {
    id: team.id,
    name: team.name,
    logo: team.logo,
    country: team.country,
    type: team.type,
    leagueName: team.type === "club" ? team.leagueName : null,
    recentMatches: recentMatches.slice(0, 3),
    upcomingMatches: upcomingMatches.slice(0, 3),
    standing,
    fifaRanking,
  };
}
