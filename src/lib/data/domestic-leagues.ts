import leaguesData from "@/lib/data/generated/african-domestic-leagues.json";
import clubsData from "@/lib/data/generated/african-domestic-clubs.json";
import { getLeagueCurrentSeason, getFixturesForLeague, type ApiFixture } from "@/lib/api-football";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { DomesticClub } from "@/types";

// Static-tier African domestic leagues (~28 usable out of 54 countries —
// see scripts/discover-african-leagues.mjs's own header comment for which
// 16 have no current-season data at all, a real API-Football coverage gap,
// not a bug here). Thin wrapper over the committed JSON + live
// API-Football calls, same role as lib/data/can-qualifiers.ts over
// group-stage-helpers.ts. Server-only: never import from a "use client"
// component — see african-leagues-section.tsx's Server Action for the
// client boundary.

interface DiscoveredLeague {
  country: string;
  status: "OK" | "NO_CURRENT_LEAGUE" | "LEAGUE_FOUND_NO_TEAMS" | "ERROR";
  leagueId?: number;
  leagueName?: string;
}

const USABLE_LEAGUES = (leaguesData as DiscoveredLeague[]).filter(
  (l): l is Required<DiscoveredLeague> => l.status === "OK" && l.leagueId !== undefined && l.leagueName !== undefined
);

export interface DomesticLeagueSummary {
  country: string;
  leagueId: number;
  leagueName: string;
}

// The country accordion's own list — just names/ids, no API call, cheap to
// pass straight into a client component.
export function getDomesticLeagueList(): DomesticLeagueSummary[] {
  return USABLE_LEAGUES.map((l) => ({ country: l.country, leagueId: l.leagueId, leagueName: l.leagueName }));
}

export function getDomesticClubsForCountry(country: string): DomesticClub[] {
  return (clubsData as DomesticClub[]).filter((c) => c.country === country);
}

export interface DomesticFixture {
  id: number;
  homeTeam: { id: number; name: string; logo: string };
  awayTeam: { id: number; name: string; logo: string };
  kickoffAt: string;
  status: "scheduled" | "live" | "finished";
}

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "P", "LIVE", "BT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

function mapFixture(fixture: ApiFixture): DomesticFixture {
  const short = fixture.fixture.status.short;
  const status = LIVE_STATUSES.has(short) ? "live" : FINISHED_STATUSES.has(short) ? "finished" : "scheduled";
  return {
    id: fixture.fixture.id,
    homeTeam: { id: fixture.teams.home.id, name: fixture.teams.home.name, logo: fixture.teams.home.logo },
    awayTeam: { id: fixture.teams.away.id, name: fixture.teams.away.name, logo: fixture.teams.away.logo },
    kickoffAt: fixture.fixture.date,
    status,
  };
}

export interface DomesticLeagueMatches {
  fixtures: DomesticFixture[];
  error: string | null;
}

// Called on demand (one country's accordion expand — see
// african-leagues-section.tsx's Server Action), not pre-fetched for all
// ~28 countries at once. Recent + upcoming combined (5 each) so a quiet
// league between matchdays still shows something. Links from the fixture
// list go straight to the existing /live/match/[id] page (getFixtureById
// isn't league-restricted), so no new match-detail work was needed for
// this to be clickable.
export async function getDomesticLeagueMatches(leagueId: number): Promise<DomesticLeagueMatches> {
  const season = await getLeagueCurrentSeason(leagueId);
  if (!season) return { fixtures: [], error: "Saison introuvable" };

  const [recentResult, upcomingResult] = await Promise.all([
    getFixturesForLeague(leagueId, season.querySeason, "last", 5),
    getFixturesForLeague(leagueId, season.querySeason, "next", 5),
  ]);

  if (recentResult.error && upcomingResult.error) return { fixtures: [], error: recentResult.error };

  const fixtures = [...recentResult.data, ...upcomingResult.data]
    .map(mapFixture)
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

  return { fixtures, error: null };
}

interface DomesticClubRosterRow {
  id: number;
  name: string;
  photo: string;
  position: string | null;
  nationality: string;
}

export interface DomesticClubRosterPlayer {
  id: number;
  name: string;
  photo: string;
  position: string | null;
  nationality: string;
}

// Roster lookup is per-club, on demand (that club's own accordion expand)
// — queries Supabase's `players` table by team_id rather than reading
// anything bundled, same "never load all ~472 clubs' rosters at once"
// reasoning as the matches lookup above. source='domestic' only: an
// international who happens to play at one of these clubs is already
// reachable through their own, richer profile — not duplicated here.
export async function getDomesticClubRoster(clubId: number): Promise<DomesticClubRosterPlayer[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data } = await supabase
    .from("players")
    .select("id, name, photo, position, nationality")
    .eq("team_id", clubId)
    .eq("source", "domestic")
    .order("name");

  return (data as DomesticClubRosterRow[] | null) ?? [];
}
