import type { MyLeaderboardStanding } from "@/app/(app)/live/actions";

// Shared across every MyJourneeStanding mount and the app-wide background
// prefetch (components/fantasy/my-standing-prefetch.tsx) — same pattern as
// lib/fantasy-rating-cache.ts, one in-memory cache for the tab's lifetime
// so a standing fetched anywhere shows up instantly everywhere else that
// wants it, keyed by journée.
export const standingCache = new Map<number, MyLeaderboardStanding>();
