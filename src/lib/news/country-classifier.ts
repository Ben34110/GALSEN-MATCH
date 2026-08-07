import { AFRICAN_NATIONS } from "@/lib/data/african-nations";

// Hand-curated French demonym stems (unaccented, lowercase), matched as a
// word-boundary prefix so "algerien" also catches "algerienne"/
// "algeriens"/"algeriennes". Each nation's own label (e.g. "Maroc",
// "Côte d'Ivoire") is matched too, added automatically below — this map
// only needs the adjective form, which is what most transfer/mercato
// headlines actually use ("l'international algérien...").
//
// DR Congo and Congo-Brazzaville both use "congolais" as a bare demonym —
// deliberately left out for both; only their distinguishing phrases
// ("RD Congo"/"RDC" vs "Congo-Brazzaville") are matched, so an article that
// only says "congolais" stays unclassified rather than guessing which one.
const DEMONYMS: Record<string, string[]> = {
  senegal: ["senegalais"],
  cotedivoire: ["ivoirien"],
  cameroun: ["camerounais"],
  mali: ["malien"],
  maroc: ["marocain"],
  dz: ["algerien"],
  ao: ["angolais"],
  bj: ["beninois"],
  bw: ["botswanais"],
  bf: ["burkinabe"],
  bi: ["burundais"],
  cv: ["capverdien", "cap-verdien"],
  cf: ["centrafricain"],
  td: ["tchadien"],
  km: ["comorien"],
  cd: ["rdc", "republique democratique du congo"],
  cg: ["congo-brazzaville", "republique du congo"],
  dj: ["djiboutien"],
  eg: ["egyptien"],
  gq: ["equato-guineen"],
  er: ["erythreen"],
  sz: ["eswatinien"],
  et: ["ethiopien"],
  ga: ["gabonais"],
  gm: ["gambien"],
  gh: ["ghaneen"],
  gn: ["guineen"],
  gw: ["bissau-guineen"],
  ke: ["kenyan"],
  ls: [],
  lr: ["liberien"],
  ly: ["libyen"],
  mg: ["malgache"],
  mw: ["malawite"],
  mr: ["mauritanien"],
  mu: ["mauricien"],
  mz: ["mozambicain"],
  na: ["namibien"],
  ne: ["nigerien"],
  ng: ["nigerian"],
  rw: ["rwandais"],
  sc: ["seychellois"],
  sl: ["sierra-leonais"],
  so: ["somalien"],
  za: ["sud-africain"],
  ss: ["sud-soudanais"],
  sd: ["soudanais"],
  tz: ["tanzanien"],
  tg: ["togolais"],
  tn: ["tunisien"],
  ug: ["ougandais"],
  zm: ["zambien"],
  zw: ["zimbabween"],
};

// "guineen"/"soudanais" are literal suffixes of other nations' compound
// demonyms ("bissau-guineen", "equato-guineen", "sud-soudanais") — a plain
// word-boundary match would also fire inside those (the hyphen before them
// is itself a word boundary). Excluded via negative lookbehind so a Guinea-
// Bissau or South Sudan article doesn't also count as a Guinea/Sudan hit.
const EXCLUDE_PRECEDED_BY: Partial<Record<string, string[]>> = {
  gn: ["bissau-", "equato-"],
  sd: ["sud-", "sud "],
};

// French news copy almost always uses a curly apostrophe (\u2019) in "C\u00f4te
// d\u2019Ivoire", while the label constant in african-nations.ts (and this
// file's own source) uses a plain one (') \u2014 left unnormalized, "cote
// d'ivoire" (the built keyword) never matches "c\u00f4te d\u2019ivoire" (the real
// text), and every C\u00f4te d'Ivoire headline written the normal way silently
// falls through to "general". Both the keyword and the input text get
// normalized to the same plain apostrophe before matching.
function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2018\u2019\u02bc`\u00b4]/g, "'");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const NATION_PATTERNS: { id: string; regex: RegExp }[] = AFRICAN_NATIONS.map((nation) => {
  const stems = [normalizeText(nation.label).toLowerCase(), ...(DEMONYMS[nation.id] ?? [])].filter(Boolean);
  const alternation = stems.map(escapeRegExp).join("|");
  const lookbehinds = (EXCLUDE_PRECEDED_BY[nation.id] ?? []).map((prefix) => `(?<!${escapeRegExp(prefix)})`).join("");
  return { id: nation.id, regex: new RegExp(`${lookbehinds}\\b(?:${alternation})\\w*`, "gi") };
});

// Best-effort: counts keyword hits per nation in the (diacritic-stripped)
// text and returns the single clear winner, or null if nothing matched or
// two-plus nations tie for the top spot — an ambiguous/multi-country
// article (a CAN preview mentioning several teams, say) is left
// unclassified (the caller keeps it as "general") rather than arbitrarily
// picking one.
export function classifyCountry(text: string): string | null {
  const normalized = normalizeText(text).toLowerCase();
  let best: { id: string; count: number } | null = null;
  let tie = false;

  for (const { id, regex } of NATION_PATTERNS) {
    const matches = normalized.match(regex);
    const count = matches ? matches.length : 0;
    if (count === 0) continue;
    if (!best || count > best.count) {
      best = { id, count };
      tie = false;
    } else if (count === best.count) {
      tie = true;
    }
  }

  return best && !tie ? best.id : null;
}
