import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Plain `.toLowerCase().includes()` search is accent-sensitive — a search
// haystack containing "Díaz" or "Côte d'Ivoire" doesn't match a query typed
// as "diaz" or "cote d'ivoire", which is how most people actually type
// (no accent keys, or just typing fast). Every text search in the app
// (players, teams, countries) should normalize both sides through this
// before comparing, e.g. `normalizeForSearch(haystack).includes(normalizeForSearch(query))`.
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;

  const diffDay = Math.round(diffH / 24);
  return `il y a ${diffDay} j`;
}

// Day-granularity relative date, spelled out ("il y a 3 jours") rather than
// abbreviated — for sources that only carry a date, not a time of day (e.g.
// a transfer's announcement date), where formatRelativeTime's minutes/hours
// steps would be meaningless.
export function formatDaysAgo(iso: string): string {
  const diffDays = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000)));
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "il y a 1 jour";
  return `il y a ${diffDays} jours`;
}

export function formatKickoff(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
