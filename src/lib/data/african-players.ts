import data from "@/lib/data/generated/african-players.json";
import type { AfricanPlayer, PlayerPosition } from "@/types";

// API-Football's free-text position ("Goalkeeper", "Defender", ...) mapped
// to this app's internal 1-letter codes used by the Starting 6 composition
// rules (1G/2D/2M/1A). "Forward" is an alias some entries use for Attacker.
const POSITION_CODE: Record<string, PlayerPosition> = {
  Goalkeeper: "G",
  Defender: "D",
  Midfielder: "M",
  Attacker: "A",
  Forward: "A",
};

export function positionCode(position: string | null): PlayerPosition | null {
  return position ? (POSITION_CODE[position] ?? null) : null;
}

// Real data, pre-crawled (not mock, not live-fetched at request time) — see
// scripts/sync-african-players.mjs for how this file is generated and how
// to re-run it to refresh the dataset.
export function getAfricanPlayers(): AfricanPlayer[] {
  return data as AfricanPlayer[];
}

// API-Football's `player.name` is often abbreviated ("P. Gueye") even
// though `firstname`/`lastname` are full ("Pape Alassane" / "Gueye") — so
// searching only `name` misses a query like "pape" for a player displayed
// as "P. Gueye". Match against firstname/lastname/name/nationality/team.
export function searchAfricanPlayers(players: AfricanPlayer[], query: string): AfricanPlayer[] {
  const q = query.trim().toLowerCase();
  if (!q) return players;
  return players.filter(
    (player) =>
      player.name.toLowerCase().includes(q) ||
      player.firstname?.toLowerCase().includes(q) ||
      player.lastname?.toLowerCase().includes(q) ||
      player.nationality.toLowerCase().includes(q) ||
      player.teamName?.toLowerCase().includes(q)
  );
}
