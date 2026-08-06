// Generic "time remaining until a deadline" math — used by Fantasy's
// gameweek deadline (lib/fantasy-gameweek.ts) and the "À venir" key African
// football dates tab (app/(app)/upcoming/page.tsx), via the shared
// useCountdown hook (hooks/use-countdown.ts).
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
