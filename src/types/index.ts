// Types partagés — reflètent le schéma Supabase de la doc d'architecture.
// Quand l'app sera branchée sur Supabase, ces types pourront être générés
// automatiquement (supabase gen types) et remplaceront ce fichier.

export type PlayerPosition = "G" | "D" | "M" | "A";

// Aggregated from RSS feeds by GET /api/cron/fetch-news (see
// lib/news/rss-sync.ts) and stored in Supabase's `news` table.
export interface Article {
  id: string;
  title: string;
  summary: string | null;
  // The language `title`/`summary` are actually written in (the source's
  // own language) — titleTranslated/summaryTranslated hold a precomputed
  // translation into whichever of "fr"/"en" this ISN'T. See
  // lib/news/localize.ts, which picks the right pair for the reader's
  // locale, falling back to the original if a translation is missing.
  language: "fr" | "en";
  titleTranslated: string | null;
  summaryTranslated: string | null;
  contentUrl: string;
  imageUrl: string | null;
  author: string | null;
  sourceName: string;
  // Matches an id in lib/data/african-nations.ts, or "general".
  country: string;
  publishedAt: string | null; // ISO date
}

export type MatchStatus = "scheduled" | "live" | "finished";

// Team info embedded directly on a Match/MatchLineup from API-Football.
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

// A real club, pre-crawled via scripts/sync-teams.mjs into
// lib/data/generated/teams.json — powers the favorite-club search in Profil
// (see components/profil/preferences-editor.tsx).
export interface LeagueTeam {
  id: number;
  name: string;
  logo: string;
  country: string;
  leagueId: number;
  leagueName: string;
}

// A real match's announced starting XI/bench (see lib/data/live.ts
// getMatchLineups).
export interface MatchLineupPlayer {
  id: number;
  name: string;
  number: number | null;
  position: string | null; // raw API code: G/D/M/F
}

export interface MatchLineup {
  team: TeamRef;
  coachName: string | null;
  formation: string | null;
  startXI: MatchLineupPlayer[];
  substitutes: MatchLineupPlayer[];
}

export interface ChatRoom {
  id: string;
  type: "country" | "general";
  countryCode?: string;
  name: string;
  flag: string;
  // National team crest URL — undefined for the "general" room, which has
  // no single nation to represent (falls back to the flag emoji there).
  logo?: string;
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
