import { CAN_2027_QUALIFIERS_LEAGUE_ID } from "@/lib/api-football";
import {
  getGroupStageFixtures,
  getGroupStageStandings,
  type GroupStageFixture,
  type GroupStageGroup,
  type GroupStageStandingRow,
  type GroupStageFixturesResult,
  type GroupStageStandingsResult,
} from "@/lib/data/group-stage-helpers";

// Thin wrapper over the shared group-stage logic (lib/data/group-stage-
// helpers.ts, also used by lib/data/u17-world-cup.ts) — this file's own
// exported names/types are kept exactly as they were before that
// extraction so nothing downstream (can-qualifiers-section.tsx and
// friends) needed to change.
export type CanQualifierFixture = GroupStageFixture;
export type CanQualifierStandingRow = GroupStageStandingRow;
export type CanQualifierGroup = GroupStageGroup;
export type CanQualifiersFixturesResult = GroupStageFixturesResult;
export type CanQualifiersStandingsResult = GroupStageStandingsResult;

// The first two September 2026 matchdays (confirmed live via API-Football:
// 2026-09-23 and 2026-09-27, 24 fixtures each).
const FIRST_TWO_MATCHDAYS: [string, string] = ["Group Stage - 1", "Group Stage - 2"];

export function getCanQualifiersFixtures(): Promise<CanQualifiersFixturesResult> {
  return getGroupStageFixtures(CAN_2027_QUALIFIERS_LEAGUE_ID, FIRST_TWO_MATCHDAYS);
}

export function getCanQualifiersStandings(): Promise<CanQualifiersStandingsResult> {
  return getGroupStageStandings(CAN_2027_QUALIFIERS_LEAGUE_ID, FIRST_TWO_MATCHDAYS);
}
