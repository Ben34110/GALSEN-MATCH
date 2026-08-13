import { getAfricanNation } from "@/lib/data/african-nations";
import { OTHER_COUNTRY_ID } from "@/lib/mock/accent-themes";

// Renders a nation's flag emoji, or 🌍 for the non-African "Autre" option
// (see accent-themes.ts's OTHER_COUNTRY_ID) — every "show this country"
// call site uses this. Used to render the federation crest (COUNTRY_LOGOS)
// instead, renamed from CountryCrest when that was swapped for a flag: a
// federation's crest doesn't reliably read as "this country's flag" —
// some genuinely are the flag inside a badge (Sénégal, Algérie), most
// aren't (Sudan's crest is an ornate emblem with no flag resemblance at
// all), which made the same UI element look inconsistent country to
// country. The jersey-avatar generator (components/ui/profile-avatar.tsx,
// lib/share/generate-squad-image.ts) still uses the real crest on purpose
// — there it's a deliberate badge-on-a-jersey graphic, not a "this is the
// flag" indicator, so it wasn't part of this swap.
export function CountryFlag({ countryId, size, className }: { countryId: string; size: number; className?: string }) {
  const flag = countryId === OTHER_COUNTRY_ID ? "🌍" : getAfricanNation(countryId)?.flag;
  if (!flag) return null;
  return (
    <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1 }} aria-hidden>
      {flag}
    </span>
  );
}
