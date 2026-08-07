import data from "@/lib/data/generated/african-players.json";
import { normalizeForSearch } from "@/lib/utils";
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
// as "P. Gueye". Match against firstname/lastname/name/nationality/team,
// combined into one haystack and tokenized so a two-word query like "habib
// diarra" matches even though "habib" only appears in firstname and
// "diarra" only in lastname — neither field alone contains the full phrase.
// normalizeForSearch also strips accents from both sides, so typing "diaz"
// (no accent key, or just typing fast) still finds "Brahim Díaz" — plain
// .toLowerCase() alone left him unfindable by his own name.
export function searchAfricanPlayers(players: AfricanPlayer[], query: string): AfricanPlayer[] {
  const tokens = normalizeForSearch(query.trim()).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return players;

  return players.filter((player) => {
    const haystack = normalizeForSearch(
      [player.name, player.firstname, player.lastname, player.nationality, player.teamName].filter(Boolean).join(" ")
    );
    return tokens.every((token) => haystack.includes(token));
  });
}
