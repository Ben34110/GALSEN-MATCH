// Journée (gameweek) N is a calendar week: opens Monday 00:00, locks the
// following Monday 00:00 ("jusqu'au dimanche minuit" — Sunday night into
// Monday). Journée 1's week starts at EPOCH_MONDAY; every completed week
// since then advances the gameweek by one, entirely computed from the
// clock — no cron/scheduled job needed to "roll over" a new gameweek.
const EPOCH_MONDAY_UTC = Date.UTC(2026, 0, 5); // 2026-01-05 is a Monday
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface Gameweek {
  journee: number;
  deadline: Date; // next Monday 00:00 UTC — composition locks at this instant
}

export function getCurrentGameweek(now: Date = new Date()): Gameweek {
  const elapsed = now.getTime() - EPOCH_MONDAY_UTC;
  const weekIndex = Math.max(0, Math.floor(elapsed / WEEK_MS));
  const journee = weekIndex + 1;
  const deadline = new Date(EPOCH_MONDAY_UTC + (weekIndex + 1) * WEEK_MS);
  return { journee, deadline };
}

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export function getCountdownParts(deadline: Date, now: Date = new Date()): CountdownParts {
  const totalMs = Math.max(0, deadline.getTime() - now.getTime());
  const seconds = Math.floor(totalMs / 1000) % 60;
  const minutes = Math.floor(totalMs / (60 * 1000)) % 60;
  const hours = Math.floor(totalMs / (60 * 60 * 1000)) % 24;
  const days = Math.floor(totalMs / (24 * 60 * 60 * 1000));
  return { totalMs, days, hours, minutes, seconds, expired: totalMs <= 0 };
}
