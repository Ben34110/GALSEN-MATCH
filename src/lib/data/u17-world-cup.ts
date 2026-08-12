import {
  getGroupStageFixtures,
  getGroupStageStandings,
  type GroupStageFixture,
  type GroupStageGroup,
  type GroupStageFixturesResult,
  type GroupStageStandingsResult,
} from "@/lib/data/group-stage-helpers";

// "World Cup - U17" — confirmed live via API-Football (checked by hand):
// starts 2026-11-19, 48 teams / 12 groups of 4 (same expanded format as the
// senior World Cup), several African nations already drawn in (Cameroon,
// Senegal, Mali, Côte d'Ivoire, Egypt, Uganda, Tanzania, Morocco,
// Mozambique confirmed in round 1 alone). Not African-only, unlike the CAN
// qualifiers — the fixtures/standings views still highlight the visitor's
// own country the same way, which for most users here means watching for
// their nation's matches within an otherwise global field.
const U17_WORLD_CUP_LEAGUE_ID = 587;
const FIRST_TWO_MATCHDAYS: [string, string] = ["Group Stage - 1", "Group Stage - 2"];

export type U17WorldCupFixture = GroupStageFixture;
export type U17WorldCupGroup = GroupStageGroup;
export type U17WorldCupFixturesResult = GroupStageFixturesResult;
export type U17WorldCupStandingsResult = GroupStageStandingsResult;

export function getU17WorldCupFixtures(): Promise<U17WorldCupFixturesResult> {
  return getGroupStageFixtures(U17_WORLD_CUP_LEAGUE_ID, FIRST_TWO_MATCHDAYS);
}

export function getU17WorldCupStandings(): Promise<U17WorldCupStandingsResult> {
  return getGroupStageStandings(U17_WORLD_CUP_LEAGUE_ID, FIRST_TWO_MATCHDAYS);
}
