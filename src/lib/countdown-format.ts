import type { CountdownParts } from "@/lib/countdown";

// Always renders down to the second, ticking live — used by both Fantasy's
// deadline countdown and the "À venir" events tab's countdowns. The
// previous Fantasy formatter dropped seconds entirely (finest granularity
// was "X min"), which doesn't read as "dynamique à la seconde".
export function formatCountdown(parts: CountdownParts): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (parts.days > 0) return `${parts.days}j ${pad(parts.hours)}h ${pad(parts.minutes)}min ${pad(parts.seconds)}s`;
  return `${pad(parts.hours)}h ${pad(parts.minutes)}min ${pad(parts.seconds)}s`;
}
