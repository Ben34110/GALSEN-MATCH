"use server";

import { getDomesticLeagueMatches, getDomesticClubRoster, type DomesticLeagueMatches, type DomesticClubRosterPlayer } from "@/lib/data/domestic-leagues";

// Bridge for african-leagues-section.tsx (client, accordion per country) —
// a country or club only gets fetched once its row is actually expanded,
// so the ~28-country / ~472-club static-tier dataset never loads for
// everyone up front (see domestic-leagues.ts's own comments for why).
export async function fetchDomesticLeagueMatches(leagueId: number): Promise<DomesticLeagueMatches> {
  return getDomesticLeagueMatches(leagueId);
}

export async function fetchDomesticClubRoster(clubId: number): Promise<DomesticClubRosterPlayer[]> {
  return getDomesticClubRoster(clubId);
}
