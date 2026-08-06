// Journée (gameweek) N is a calendar week starting Monday 00:00 — matches
// for N are played *during* that week, so the squad for N must be locked in
// *before* it starts, not at the end of it (the earlier model locked at the
// end of N's own week, which meant you could still edit a journée's team
// after that week's matches had already happened — backwards). 2026-08-17
// is the Monday the big European leagues resume on average, so that's
// Journée 1's start.
const EPOCH_MONDAY_UTC = Date.UTC(2026, 7, 17); // 2026-08-17 is a Monday
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface GameweekInfo {
  // The journée currently being played this week — locked (its deadline,
  // its own start, has already passed). Before Journée 1 even begins, this
  // equals 1 and activeStarted is false (nothing is locked yet).
  activeJournee: number;
  activeStarted: boolean;
  // The journée the player can still build/edit right now — the same as
  // activeJournee before Journée 1 starts, otherwise the next one.
  editableJournee: number;
  editableDeadline: Date;
}

export function getGameweekInfo(now: Date = new Date()): GameweekInfo {
  const boundaryIndex = Math.floor((now.getTime() - EPOCH_MONDAY_UTC) / WEEK_MS);

  if (boundaryIndex < 0) {
    return {
      activeJournee: 1,
      activeStarted: false,
      editableJournee: 1,
      editableDeadline: new Date(EPOCH_MONDAY_UTC),
    };
  }

  const activeJournee = boundaryIndex + 1;
  return {
    activeJournee,
    activeStarted: true,
    editableJournee: activeJournee + 1,
    editableDeadline: new Date(EPOCH_MONDAY_UTC + (boundaryIndex + 1) * WEEK_MS),
  };
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
