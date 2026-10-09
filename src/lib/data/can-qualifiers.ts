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

// Which two matchdays to show is resolved dynamically by
// group-stage-helpers.ts's currentRoundWindow (earliest round not yet
// fully finished, + the one after it) — no longer hardcoded here. Used to
// be pinned to the first two September 2026 matchdays ("Group Stage - 1"/
// "Group Stage - 2"), which meant this section kept showing both long
// after they'd actually been played.
export function getCanQualifiersFixtures(): Promise<CanQualifiersFixturesResult> {
  return getGroupStageFixtures(CAN_2027_QUALIFIERS_LEAGUE_ID);
}

export function getCanQualifiersStandings(): Promise<CanQualifiersStandingsResult> {
  return getGroupStageStandings(CAN_2027_QUALIFIERS_LEAGUE_ID);
}
