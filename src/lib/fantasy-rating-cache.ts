import type { PlayerJourneeRating } from "@/lib/data/fantasy-ratings";

// Shared across every PitchView mount and the app-wide background
// prefetch (components/fantasy/fantasy-ratings-prefetch.tsx) — a single
// in-memory cache for the lifetime of the browser tab, not tied to any one
// component's mount/unmount, so a rating fetched anywhere shows up
// instantly everywhere else that wants it.
export const ratingCache = new Map<string, PlayerJourneeRating>();

export function ratingCacheKey(playerId: number, journee: number): string {
  return `${playerId}-${journee}`;
}
