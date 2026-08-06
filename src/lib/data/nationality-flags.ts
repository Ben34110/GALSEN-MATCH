// Maps every nationality string used in the African players dataset (see
// scripts/sync-african-players.mjs's NATIONAL_TEAMS list — nationality is
// set verbatim from there) to its ISO 3166-1 alpha-2 code, so a flag emoji
// can be generated on the fly (Unicode regional indicator symbols) instead
// of depending on an external flag-image API or endpoint coverage.
const NATIONALITY_ISO_CODE: Record<string, string> = {
  Algeria: "DZ",
  Angola: "AO",
  Benin: "BJ",
  Botswana: "BW",
  "Burkina Faso": "BF",
  Burundi: "BI",
  Cameroon: "CM",
  "Cape Verde": "CV",
  "Central African Republic": "CF",
  Chad: "TD",
  Comoros: "KM",
  "DR Congo": "CD",
  Congo: "CG",
  Djibouti: "DJ",
  Egypt: "EG",
  "Equatorial Guinea": "GQ",
  Eritrea: "ER",
  Eswatini: "SZ",
  Ethiopia: "ET",
  Gabon: "GA",
  Gambia: "GM",
  Ghana: "GH",
  Guinea: "GN",
  "Guinea-Bissau": "GW",
  "Ivory Coast": "CI",
  Kenya: "KE",
  Lesotho: "LS",
  Liberia: "LR",
  Libya: "LY",
  Madagascar: "MG",
  Malawi: "MW",
  Mali: "ML",
  Mauritania: "MR",
  Mauritius: "MU",
  Morocco: "MA",
  Mozambique: "MZ",
  Namibia: "NA",
  Niger: "NE",
  Nigeria: "NG",
  Rwanda: "RW",
  Senegal: "SN",
  Seychelles: "SC",
  "Sierra Leone": "SL",
  Somalia: "SO",
  "South Africa": "ZA",
  "South Sudan": "SS",
  Sudan: "SD",
  Tanzania: "TZ",
  Togo: "TG",
  Tunisia: "TN",
  Uganda: "UG",
  Zambia: "ZM",
  Zimbabwe: "ZW",
};

function isoToFlagEmoji(iso2: string): string {
  return String.fromCodePoint(...[...iso2.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));
}

export function getNationalityFlag(nationality: string): string {
  const iso = NATIONALITY_ISO_CODE[nationality];
  return iso ? isoToFlagEmoji(iso) : "🌍";
}
