import { hslToHex, pickInkColor } from "@/lib/color-utils";
import { getNationalityFlag } from "@/lib/data/nationality-flags";

// Single source of truth for all 54 CAF member nations — every other
// per-country list in the app (onboarding/theme picker, chat rooms,
// COUNTRY_LOGOS/COUNTRY_CODE_BY_THEME_ID/NATIONALITY_BY_THEME_ID in
// lib/onboarding.ts, chat rooms in lib/mock/chat.ts, accent themes in
// lib/mock/accent-themes.ts) is derived from this list instead of
// maintaining 54 entries in five different places.
export interface AfricanNation {
  // Theme/onboarding id. The 5 nations that existed before this list was
  // 54-wide keep their original word ids (already saved in onboarded
  // users' localStorage profiles as `countryId` — renaming them would
  // silently break existing profiles' theme/room selection). Every other
  // nation uses its lowercase ISO 3166-1 alpha-2 code, which conveniently
  // needs no separate lookup table for chat's countryCode either.
  id: string;
  // Matches AfricanPlayer.nationality (see scripts/sync-african-players.mjs
  // NATIONAL_TEAMS) — lets onboarding's "players from your nation" default
  // sort and Fantasy's flag lookup both key off the same string.
  nationality: string;
  label: string;
  countryCode: string;
  flag: string;
  // National team crest (media.api-sports.io — see NATIONAL_TEAMS ids in
  // scripts/sync-african-players.mjs, the same source this was copied from).
  // Used everywhere a nation is represented in the app UI; `flag` is kept
  // only for the fantasy squad/lineup views (player-picker-sheet,
  // pitch-view), which show flags by design.
  logo: string;
  // Real flag-color hue anchors (0-360°), used to generate a themed
  // accent/accent2/accent3 palette (see lib/mock/accent-themes.ts) with a
  // consistent saturation/lightness formula instead of 49 hand-picked hex
  // triples. The 5 legacy nations keep their original hand-picked hex
  // values untouched, not hue-generated (see accent-themes.ts).
  hues: [number, number, number];
}

export const AFRICAN_NATIONS: AfricanNation[] = [
  { id: "senegal", nationality: "Senegal", label: "Sénégal", countryCode: "SN", flag: "🇸🇳", logo: "https://media.api-sports.io/football/teams/13.png", hues: [152, 42, 0] },
  { id: "cotedivoire", nationality: "Ivory Coast", label: "Côte d'Ivoire", countryCode: "CI", flag: "🇨🇮", logo: "https://media.api-sports.io/football/teams/1501.png", hues: [25, 142, 45] },
  { id: "cameroun", nationality: "Cameroon", label: "Cameroun", countryCode: "CM", flag: "🇨🇲", logo: "https://media.api-sports.io/football/teams/1530.png", hues: [142, 0, 45] },
  { id: "mali", nationality: "Mali", label: "Mali", countryCode: "ML", flag: "🇲🇱", logo: "https://media.api-sports.io/football/teams/1500.png", hues: [142, 45, 0] },
  { id: "maroc", nationality: "Morocco", label: "Maroc", countryCode: "MA", flag: "🇲🇦", logo: "https://media.api-sports.io/football/teams/31.png", hues: [0, 142, 45] },

  { id: "dz", nationality: "Algeria", label: "Algérie", countryCode: "DZ", flag: "🇩🇿", logo: "https://media.api-sports.io/football/teams/1532.png", hues: [142, 0, 45] },
  { id: "ao", nationality: "Angola", label: "Angola", countryCode: "AO", flag: "🇦🇴", logo: "https://media.api-sports.io/football/teams/1529.png", hues: [0, 45, 20] },
  { id: "bj", nationality: "Benin", label: "Bénin", countryCode: "BJ", flag: "🇧🇯", logo: "https://media.api-sports.io/football/teams/1516.png", hues: [142, 48, 0] },
  { id: "bw", nationality: "Botswana", label: "Botswana", countryCode: "BW", flag: "🇧🇼", logo: "https://media.api-sports.io/football/teams/1520.png", hues: [200, 45, 210] },
  { id: "bf", nationality: "Burkina Faso", label: "Burkina Faso", countryCode: "BF", flag: "🇧🇫", logo: "https://media.api-sports.io/football/teams/1502.png", hues: [0, 142, 48] },
  { id: "bi", nationality: "Burundi", label: "Burundi", countryCode: "BI", flag: "🇧🇮", logo: "https://media.api-sports.io/football/teams/1528.png", hues: [0, 142, 45] },
  { id: "cv", nationality: "Cape Verde", label: "Cap-Vert", countryCode: "CV", flag: "🇨🇻", logo: "https://media.api-sports.io/football/teams/1533.png", hues: [210, 48, 0] },
  { id: "cf", nationality: "Central African Republic", label: "République centrafricaine", countryCode: "CF", flag: "🇨🇫", logo: "https://media.api-sports.io/football/teams/1527.png", hues: [210, 142, 48] },
  { id: "td", nationality: "Chad", label: "Tchad", countryCode: "TD", flag: "🇹🇩", logo: "https://media.api-sports.io/football/teams/1523.png", hues: [210, 48, 0] },
  { id: "km", nationality: "Comoros", label: "Comores", countryCode: "KM", flag: "🇰🇲", logo: "https://media.api-sports.io/football/teams/1524.png", hues: [142, 48, 0] },
  { id: "cd", nationality: "DR Congo", label: "RD Congo", countryCode: "CD", flag: "🇨🇩", logo: "https://media.api-sports.io/football/teams/1508.png", hues: [210, 48, 0] },
  { id: "cg", nationality: "Congo", label: "Congo", countryCode: "CG", flag: "🇨🇬", logo: "https://media.api-sports.io/football/teams/1517.png", hues: [142, 48, 0] },
  { id: "dj", nationality: "Djibouti", label: "Djibouti", countryCode: "DJ", flag: "🇩🇯", logo: "https://media.api-sports.io/football/teams/1535.png", hues: [195, 142, 0] },
  { id: "eg", nationality: "Egypt", label: "Égypte", countryCode: "EG", flag: "🇪🇬", logo: "https://media.api-sports.io/football/teams/32.png", hues: [0, 45, 15] },
  { id: "gq", nationality: "Equatorial Guinea", label: "Guinée équatoriale", countryCode: "GQ", flag: "🇬🇶", logo: "https://media.api-sports.io/football/teams/1521.png", hues: [142, 0, 210] },
  { id: "er", nationality: "Eritrea", label: "Érythrée", countryCode: "ER", flag: "🇪🇷", logo: "https://media.api-sports.io/football/teams/1498.png", hues: [0, 142, 210] },
  { id: "sz", nationality: "Eswatini", label: "Eswatini", countryCode: "SZ", flag: "🇸🇿", logo: "https://media.api-sports.io/football/teams/2995.png", hues: [210, 48, 0] },
  { id: "et", nationality: "Ethiopia", label: "Éthiopie", countryCode: "ET", flag: "🇪🇹", logo: "https://media.api-sports.io/football/teams/1506.png", hues: [142, 48, 0] },
  { id: "ga", nationality: "Gabon", label: "Gabon", countryCode: "GA", flag: "🇬🇦", logo: "https://media.api-sports.io/football/teams/1503.png", hues: [142, 48, 210] },
  { id: "gm", nationality: "Gambia", label: "Gambie", countryCode: "GM", flag: "🇬🇲", logo: "https://media.api-sports.io/football/teams/1492.png", hues: [0, 210, 142] },
  { id: "gh", nationality: "Ghana", label: "Ghana", countryCode: "GH", flag: "🇬🇭", logo: "https://media.api-sports.io/football/teams/1504.png", hues: [0, 45, 142] },
  { id: "gn", nationality: "Guinea", label: "Guinée", countryCode: "GN", flag: "🇬🇳", logo: "https://media.api-sports.io/football/teams/1509.png", hues: [0, 48, 142] },
  { id: "gw", nationality: "Guinea-Bissau", label: "Guinée-Bissau", countryCode: "GW", flag: "🇬🇼", logo: "https://media.api-sports.io/football/teams/1513.png", hues: [0, 48, 142] },
  { id: "ke", nationality: "Kenya", label: "Kenya", countryCode: "KE", flag: "🇰🇪", logo: "https://media.api-sports.io/football/teams/1511.png", hues: [0, 142, 25] },
  { id: "ls", nationality: "Lesotho", label: "Lesotho", countryCode: "LS", flag: "🇱🇸", logo: "https://media.api-sports.io/football/teams/1518.png", hues: [210, 142, 25] },
  { id: "lr", nationality: "Liberia", label: "Liberia", countryCode: "LR", flag: "🇱🇷", logo: "https://media.api-sports.io/football/teams/1525.png", hues: [0, 210, 48] },
  { id: "ly", nationality: "Libya", label: "Libye", countryCode: "LY", flag: "🇱🇾", logo: "https://media.api-sports.io/football/teams/1526.png", hues: [0, 142, 45] },
  { id: "mg", nationality: "Madagascar", label: "Madagascar", countryCode: "MG", flag: "🇲🇬", logo: "https://media.api-sports.io/football/teams/1490.png", hues: [0, 142, 40] },
  { id: "mw", nationality: "Malawi", label: "Malawi", countryCode: "MW", flag: "🇲🇼", logo: "https://media.api-sports.io/football/teams/1495.png", hues: [25, 0, 142] },
  { id: "mr", nationality: "Mauritania", label: "Mauritanie", countryCode: "MR", flag: "🇲🇷", logo: "https://media.api-sports.io/football/teams/1491.png", hues: [142, 48, 25] },
  { id: "mu", nationality: "Mauritius", label: "Maurice", countryCode: "MU", flag: "🇲🇺", logo: "https://media.api-sports.io/football/teams/1497.png", hues: [0, 210, 48] },
  { id: "mz", nationality: "Mozambique", label: "Mozambique", countryCode: "MZ", flag: "🇲🇿", logo: "https://media.api-sports.io/football/teams/1512.png", hues: [142, 25, 48] },
  { id: "na", nationality: "Namibia", label: "Namibie", countryCode: "NA", flag: "🇳🇦", logo: "https://media.api-sports.io/football/teams/1493.png", hues: [210, 0, 142] },
  { id: "ne", nationality: "Niger", label: "Niger", countryCode: "NE", flag: "🇳🇪", logo: "https://media.api-sports.io/football/teams/1505.png", hues: [25, 142, 45] },
  { id: "ng", nationality: "Nigeria", label: "Nigeria", countryCode: "NG", flag: "🇳🇬", logo: "https://media.api-sports.io/football/teams/19.png", hues: [142, 45, 160] },
  { id: "rw", nationality: "Rwanda", label: "Rwanda", countryCode: "RW", flag: "🇷🇼", logo: "https://media.api-sports.io/football/teams/1514.png", hues: [210, 48, 142] },
  { id: "sc", nationality: "Seychelles", label: "Seychelles", countryCode: "SC", flag: "🇸🇨", logo: "https://media.api-sports.io/football/teams/1515.png", hues: [210, 142, 48] },
  { id: "sl", nationality: "Sierra Leone", label: "Sierra Leone", countryCode: "SL", flag: "🇸🇱", logo: "https://media.api-sports.io/football/teams/1499.png", hues: [142, 210, 45] },
  { id: "so", nationality: "Somalia", label: "Somalie", countryCode: "SO", flag: "🇸🇴", logo: "https://media.api-sports.io/football/teams/8050.png", hues: [195, 205, 45] },
  { id: "za", nationality: "South Africa", label: "Afrique du Sud", countryCode: "ZA", flag: "🇿🇦", logo: "https://media.api-sports.io/football/teams/1531.png", hues: [142, 0, 215] },
  { id: "ss", nationality: "South Sudan", label: "Soudan du Sud", countryCode: "SS", flag: "🇸🇸", logo: "https://media.api-sports.io/football/teams/1496.png", hues: [0, 142, 210] },
  { id: "sd", nationality: "Sudan", label: "Soudan", countryCode: "SD", flag: "🇸🇩", logo: "https://media.api-sports.io/football/teams/1510.png", hues: [0, 142, 45] },
  { id: "tz", nationality: "Tanzania", label: "Tanzanie", countryCode: "TZ", flag: "🇹🇿", logo: "https://media.api-sports.io/football/teams/1489.png", hues: [142, 48, 210] },
  { id: "tg", nationality: "Togo", label: "Togo", countryCode: "TG", flag: "🇹🇬", logo: "https://media.api-sports.io/football/teams/1534.png", hues: [142, 48, 0] },
  { id: "tn", nationality: "Tunisia", label: "Tunisie", countryCode: "TN", flag: "🇹🇳", logo: "https://media.api-sports.io/football/teams/28.png", hues: [0, 350, 45] },
  { id: "ug", nationality: "Uganda", label: "Ouganda", countryCode: "UG", flag: "🇺🇬", logo: "https://media.api-sports.io/football/teams/1519.png", hues: [25, 48, 0] },
  { id: "zm", nationality: "Zambia", label: "Zambie", countryCode: "ZM", flag: "🇿🇲", logo: "https://media.api-sports.io/football/teams/1507.png", hues: [142, 0, 25] },
  { id: "zw", nationality: "Zimbabwe", label: "Zimbabwe", countryCode: "ZW", flag: "🇿🇼", logo: "https://media.api-sports.io/football/teams/1522.png", hues: [142, 48, 0] },
];

// Sanity fallback: derive the flag from the nationality→ISO table (already
// covers all 54) rather than trust a hand-typed emoji column above going
// stale — used by consumers that only have the nationality string on hand.
export function nationFlag(nationality: string): string {
  return getNationalityFlag(nationality);
}

export function getAfricanNation(id: string): AfricanNation | undefined {
  return AFRICAN_NATIONS.find((nation) => nation.id === id);
}

// The real API-Football team id, parsed out of `logo` (media.api-sports.io/
// football/teams/{id}.png) rather than duplicated as its own field — lets
// UI that only has a nation (e.g. onboarding's countryId) match it against
// ApiFixtureTeam.id from lib/api-football.ts without a second lookup table.
export function nationTeamId(nation: AfricanNation | undefined): number | null {
  const match = nation?.logo.match(/\/teams\/(\d+)\.png$/);
  return match ? Number(match[1]) : null;
}

// For consumers that only have the English nationality string on hand
// (e.g. fifa-ranking-table.tsx's scraped FifaRankingRow.country, already
// normalized to match this exact field by the sync script) rather than a
// theme/onboarding id.
export function getAfricanNationByNationality(nationality: string): AfricanNation | undefined {
  return AFRICAN_NATIONS.find((nation) => nation.nationality === nationality);
}

// Deterministic accent/accent2/accent3 hex triple from a nation's hue
// anchors — accent stays fairly dark/saturated (readable with white ink),
// accent2/accent3 lighter, echoing the hand-picked originals' pattern.
export function generateHueTheme(hues: [number, number, number]): { accent: string; accent2: string; accent3: string } {
  const accent = hslToHex(hues[0], 62, 40);
  const accent2 = hslToHex(hues[1], 68, 56);
  const accent3 = hslToHex(hues[2], 60, 56);
  return { accent, accent2, accent3 };
}

// A vivid, flag-accurate color from a nation's primary hue anchor — used
// for the jersey avatar (components/ui/profile-avatar.tsx), which needs to
// actually look like the flag's real color (e.g. Morocco's vivid flag red)
// rather than generateHueTheme's deliberately muted UI accent (tuned for
// buttons/backgrounds, not for matching a flag by eye). Bypasses the 5
// legacy hand-picked accent overrides in lib/mock/accent-themes.ts too —
// those were picked for UI contrast, not flag fidelity.
export function jerseyColorFromHue(hue: number): string {
  return hslToHex(hue, 80, 42);
}

export { pickInkColor };
