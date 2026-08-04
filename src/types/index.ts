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

export interface Match {
  id: string;
  competition: string;
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null; // renseigné si status === "live"
  kickoffAt: string; // ISO date
}

export interface StandingRow {
  teamId: string;
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
