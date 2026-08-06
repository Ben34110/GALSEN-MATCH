// Types partagés — reflètent le schéma Supabase de la doc d'architecture.
// Quand l'app sera branchée sur Supabase, ces types pourront être générés
// automatiquement (supabase gen types) et remplaceront ce fichier.

export type PlayerPosition = "G" | "D" | "M" | "A";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoInitials: string;
  logo: string;
  country: string;
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
  // Raw "description" from API-Football's standings row, e.g. "Promotion -
  // Champions League (League phase)" or "Relegation" — null when the row
  // isn't in any zone (mid-table) or the league hasn't published one yet.
  zone: string | null;
}

// A real club's current squad entry, from API-Football's /players/squads
// (see lib/data/live.ts getSquad).
export interface SquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
}

// A real African player from the top 5 European leagues (+ Ligue 1
// Sénégal), pre-crawled via scripts/sync-african-players.mjs into
// lib/data/generated/african-players.json. Used by the onboarding player
// picker and the Fantasy Starting 6 pool (see services/real-player-scoring.ts).
export interface AfricanPlayer {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  nationality: string;
  photo: string;
  position: string | null;
  teamId: number | null; // real API-Football club id — powers "prochain match" lookups
  teamName: string | null;
  teamLogo: string | null;
  leagueName: string;
  appearances: number;
  goals: number;
  assists: number;
}

// A real club from the 5 big European leagues, pre-crawled via
// scripts/sync-teams.mjs into lib/data/generated/teams.json — powers the
// team search + favorite feature (see components/live/favorites-panel.tsx).
export interface LeagueTeam {
  id: number;
  name: string;
  logo: string;
  country: string;
  leagueId: number;
  leagueName: string;
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
  accent3: string;
}
