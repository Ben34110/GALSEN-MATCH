// Types partagés — reflètent le schéma Supabase de la doc d'architecture.
// Quand l'app sera branchée sur Supabase, ces types pourront être générés
// automatiquement (supabase gen types) et remplaceront ce fichier.

export type PlayerPosition = "G" | "D" | "M" | "A";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoInitials: string;
  country: string;
}

export interface Player {
  id: string;
  fullName: string;
  position: PlayerPosition;
  teamId: string;
  nationality: string;
  photoInitials: string;
}

export interface Article {
  id: string;
  title: string;
  summaryAi: string;
  sourceName: string;
  sourceUrl: string;
  category: string;
  publishedAt: string; // ISO date
}

export type MatchStatus = "scheduled" | "live" | "finished";

// Team info embedded directly on a Match/StandingRow when it comes from
// API-Football — its fixtures/standings already carry name+logo, so no
// separate lookup against lib/mock/teams.ts is needed for real data.
export interface TeamRef {
  id: string;
  name: string;
  logo?: string;
}

export interface Match {
  id: string;
  competition: string;
  matchday: number;
  roundLabel?: string; // e.g. "J12" — derived from API-Football's free-text round when present
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: TeamRef;
  awayTeam?: TeamRef;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null; // renseigné si status === "live"
  liveLabel?: string; // e.g. "Mi-temps" instead of a raw minute count
  halftimeScore?: { home: number | null; away: number | null };
  kickoffAt: string; // ISO date
  source?: "api" | "mock";
  apiFixtureId?: number; // set when source === "api" — links to /live/match/[id]
}

export interface StandingRow {
  teamId: string;
  team?: TeamRef;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
}

export interface PlayerMatchStat {
  playerId: string;
  matchId: string;
  rating: number | null;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
}

export interface LineupSlot {
  playerId: string;
  position: PlayerPosition;
}

export interface ChatRoom {
  id: string;
  type: "country" | "general";
  countryCode?: string;
  name: string;
  flag: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  authorName: string;
  content: string;
  createdAt: string; // ISO date
}

export interface AccentTheme {
  id: string;
  label: string;
  accent: string;
  accentInk: string;
  accent2: string;
}
