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

// The 9 Quiz Foot Africain categories (see lib/data/quiz-questions.ts's
// QUIZ_THEMES for the French labels). "global" is its own independent
// question pool — general football knowledge (continent-wide and beyond),
// not a combination of the other 8 themes' questions.
export type QuizTheme =
  | "global"
  | "senegal"
  | "maroc"
  | "algerie"
  | "cameroun"
  | "cote-ivoire"
  | "egypte"
  | "coupe-du-monde"
  | "can";

// One hand-authored trivia question, from the bundled
// lib/data/quiz-questions.json — fixed content, never user-generated (see
// supabase/schema.sql's quiz_scores for the part that IS user data: each
// device's best score per theme).
export interface QuizQuestion {
  id: string;
  theme: QuizTheme;
  question: string;
  choices: [string, string, string];
  correctIndex: 0 | 1 | 2;
}

// One CAF nation's FIFA World Ranking row, pre-scraped via
// scripts/sync-fifa-ranking.mjs into
// lib/data/generated/fifa-ranking.json — no live API exposes this.
// `country` is normalized to match african-nations.ts's `nationality`
// field where a mapping exists (see the sync script's NATION_NAME_ALIASES)
// so fifa-ranking-table.tsx can look up the matching crest/French label
// directly; a couple of CAF members (currently just São Tomé and
// Príncipe) have no african-nations.ts entry at all and render with a
// generic icon instead of a missing crest.
export interface FifaRankingRow {
  africanRank: number;
  worldRank: number;
  country: string;
  points: number;
  previousPoints: number;
  delta: number;
  movement: "up" | "down" | "same";
  // How many world-rank places moved since last month (0 when movement is
  // "same") — what "progression de places par rapport au mois précédent"
  // literally asked for, distinct from `delta`'s points change.
  placesMoved: number;
}

// The full scrape: rows plus the ranking's own effective date (FIFA
// republishes roughly monthly — this is how the app tells readers which
// month's ranking they're looking at, since the data can lag by a few
// weeks between real updates).
export interface FifaRankingSnapshot {
  rankingDate: string; // ISO date, e.g. "2026-07-20"
  rows: FifaRankingRow[];
}

// A recent African player transfer, derived from API-Football's
// /transfers?player={id} data already fetched by
// scripts/sync-african-players.mjs (fetchLatestTransferRecord) — reuses
// the same per-player lookup that script already makes to correct each
// player's current club, no separate API call. Written to
// lib/data/generated/mercato.json, filtered to the last ~180 days and
// capped at ~40 entries, most recent first.
export interface MercatoTransfer {
  playerId: number;
  playerName: string;
  playerPhoto: string;
  nationality: string;
  date: string; // ISO date
  // Raw API-Football fee string — a price ("€ 60M"), "Loan", or sometimes
  // null/free-agent; render non-price values as a badge/label, never the
  // literal raw string.
  type: string | null;
  clubFrom: { id: number; name: string; logo: string } | null; // null when arriving from free agency
  clubTo: { id: number; name: string; logo: string };
}

// A real club or national team, pre-crawled via scripts/sync-teams.mjs into
// lib/data/generated/teams.json — powers the favorite-club search in Profil
// (see components/profil/preferences-editor.tsx) and the global search (see
// lib/data/global-search.ts). National-team entries have no real domestic
// league — leagueId is 0 and leagueName is a display placeholder ("Équipe
// nationale" etc.), never used to query /standings for them (see
// lib/data/team-profile.ts, which branches on `type` instead).
export interface LeagueTeam {
  id: number;
  name: string;
  logo: string;
  country: string;
  leagueId: number;
  leagueName: string;
  type: "club" | "national";
}

// One /transfers entry for a player — doubles as both "carrière" (the
// chronological club-to-club history) and "transferts" (fee/date/type) on
// the player profile page, since a single API-Football call already
// carries both (see lib/data/player-profile.ts).
export interface PlayerTransferRecord {
  date: string; // ISO date
  type: string | null; // fee ("€ 60M"), "Loan", or null (free agent)
  clubFrom: { id: number; name: string; logo: string } | null;
  clubTo: { id: number; name: string; logo: string };
}

// The player's own season-to-date line at their current club (goals/
// assists/appearances/average rating) — the "saison en cours" section of
// the player profile page.
export interface PlayerSeasonStats {
  displaySeason: string; // e.g. "2025-2026"
  leagueName: string;
  teamName: string;
  teamLogo: string;
  appearances: number;
  goals: number;
  assists: number;
  rating: number | null;
  yellowCards: number;
  redCards: number;
}

// This player's own goals/assists in one specific match — the "3 derniers
// matchs" list's per-row ⚽/👟 icons (see components/profile/match-compact-
// list.tsx), distinct from the team-level scoreline the row already shows.
export interface PlayerMatchEvent {
  goals: number;
  assists: number;
}

// Full detail for the player profile page (/joueur/[id]) — combines the
// static bio already known from lib/data/african-players.json with live
// API-Football lookups for whatever can't be pre-crawled cheaply (current
// season stats, transfer history, last/next matches). See
// lib/data/player-profile.ts.
export interface PlayerDetail {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  nationality: string;
  photo: string;
  position: string | null;
  teamId: number | null;
  teamName: string | null;
  teamLogo: string | null;
  currentSeason: PlayerSeasonStats | null;
  recentMatches: Match[];
  // Keyed by Match.id — only ever populated for entries in recentMatches
  // (a finished match has real stats to fetch; an upcoming one doesn't).
  recentMatchEvents: Record<string, PlayerMatchEvent>;
  upcomingMatches: Match[];
  transfers: PlayerTransferRecord[];
}

// A club's position in its domestic league standings — the team profile
// page's "classement dans sa ligue" section (club teams only; national
// teams show their FifaRankingRow instead, see TeamDetail).
export interface TeamStandingSummary {
  rank: number;
  leagueName: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
}

// Full detail for the team profile page (/equipe/[id]) — shared by both
// clubs and national teams (see LeagueTeam's `type`); exactly one of
// `standing`/`fifaRanking` is populated depending on which. See
// lib/data/team-profile.ts.
export interface TeamDetail {
  id: number;
  name: string;
  logo: string;
  country: string;
  type: "club" | "national";
  leagueName: string | null;
  recentMatches: Match[];
  upcomingMatches: Match[];
  standing: TeamStandingSummary | null;
  fifaRanking: FifaRankingRow | null;
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
  // The sender's device_id — always set (guests and signed-in senders
  // alike, see app/actions/chat.ts's sendChatMessage), used as the "own
  // message" / profile-lookup key for guests. Signed-in senders additionally
  // carry userId below, which takes priority for both purposes.
  deviceId: string;
  // Set only when the sender was signed in at send time. Resolves back to
  // their user_profiles row via app/actions/chat-profile.ts, and is how the
  // UI recognizes "your own message" for a signed-in viewer.
  userId: string | null;
  authorName: string;
  // Sender's countryId at send time (a lib/data/african-nations.ts id),
  // snapshotted like authorName — powers the flag shown next to every
  // message, not just "your own". null for messages sent before this
  // column existed.
  countryId: string | null;
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
