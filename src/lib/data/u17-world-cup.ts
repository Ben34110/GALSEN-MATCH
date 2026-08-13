import {
  getGroupStageFixtures,
  getGroupStageStandings,
  type GroupStageFixture,
  type GroupStageGroup,
  type GroupStageFixturesResult,
  type GroupStageStandingsResult,
} from "@/lib/data/group-stage-helpers";
import { AFRICAN_NATIONS } from "@/lib/data/african-nations";

// "World Cup - U17" — confirmed live via API-Football (checked by hand):
// starts 2026-11-19, 48 teams / 12 groups of 4 (same expanded format as the
// senior World Cup), several African nations already drawn in (Cameroon,
// Senegal, Mali, Côte d'Ivoire, Egypt, Uganda, Tanzania, Morocco,
// Mozambique confirmed in round 1 alone).
const U17_WORLD_CUP_LEAGUE_ID = 587;
const FIRST_TWO_MATCHDAYS: [string, string] = ["Group Stage - 1", "Group Stage - 2"];

export type U17WorldCupFixture = GroupStageFixture;
export type U17WorldCupGroup = GroupStageGroup;
export type U17WorldCupFixturesResult = GroupStageFixturesResult;
export type U17WorldCupStandingsResult = GroupStageStandingsResult;

// This is a global 48-team field (unlike the CAN qualifiers, which are
// African-only by definition) — this app only cares about African teams,
// so the fixtures list (but not the standings/groups: a group's table
// still needs all 4 of its teams to make sense) is filtered down to only
// matches involving at least one.
//
// Same country-name spelling mismatch already handled in scripts/sync-
// fifa-ranking.mjs's NATION_NAME_ALIASES: API-Football's team names for
// THIS competition use "Côte d'Ivoire" while AFRICAN_NATIONS.nationality
// (the single source of truth for African country names elsewhere in this
// app) uses "Ivory Coast" — confirmed via a live /fixtures?league=587 call
// returning "Côte d'Ivoire U17" verbatim.
const NATION_NAME_ALIASES: Record<string, string> = {
  "Côte d'Ivoire": "Ivory Coast",
  "Congo DR": "DR Congo",
  "Cabo Verde": "Cape Verde",
  "The Gambia": "Gambia",
};

const AFRICAN_NATION_NAMES = new Set(AFRICAN_NATIONS.map((n) => n.nationality));

// Every U17 World Cup team name is "{Country} U17" (e.g. "Senegal U17",
// "Côte d'Ivoire U17") — confirmed across all 48 teams in a live fetch.
function isAfricanTeamName(teamName: string): boolean {
  const countryName = teamName.replace(/\s+U17$/, "");
  return AFRICAN_NATION_NAMES.has(NATION_NAME_ALIASES[countryName] ?? countryName);
}

export async function getU17WorldCupFixtures(): Promise<U17WorldCupFixturesResult> {
  const result = await getGroupStageFixtures(U17_WORLD_CUP_LEAGUE_ID, FIRST_TWO_MATCHDAYS);
  return {
    ...result,
    fixtures: result.fixtures.filter(
      (fixture) => isAfricanTeamName(fixture.homeTeam.name) || isAfricanTeamName(fixture.awayTeam.name)
    ),
  };
}

export function getU17WorldCupStandings(): Promise<U17WorldCupStandingsResult> {
  return getGroupStageStandings(U17_WORLD_CUP_LEAGUE_ID, FIRST_TWO_MATCHDAYS);
}
