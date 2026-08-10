import Image from "next/image";
import { COUNTRY_LOGOS } from "@/lib/onboarding";
import { OTHER_COUNTRY_ID } from "@/lib/mock/accent-themes";

// Renders a nation's crest, or a 🌍 globe for the non-African "Autre"
// option (see accent-themes.ts's OTHER_COUNTRY_ID) — COUNTRY_LOGOS has no
// entry for it since it isn't one of the 54 CAF nations in
// lib/data/african-nations.ts, so every "show a country's image" call site
// needs this instead of feeding COUNTRY_LOGOS[id] straight to <Image>.
export function CountryCrest({
  countryId,
  size,
  className,
}: {
  countryId: string;
  size: number;
  className?: string;
}) {
  if (countryId === OTHER_COUNTRY_ID) {
    return (
      <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1 }} aria-hidden>
        🌍
      </span>
    );
  }

  const logo = COUNTRY_LOGOS[countryId];
  if (!logo) return null;
  return <Image src={logo} alt="" width={size} height={size} className={className} unoptimized />;
}
