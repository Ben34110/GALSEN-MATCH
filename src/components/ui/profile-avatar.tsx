import { JerseyAvatar } from "@/components/ui/jersey-avatar";
import { getAccentTheme, OTHER_COUNTRY_ID } from "@/lib/mock/accent-themes";
import { getAfricanNation, jerseyColorFromHue } from "@/lib/data/african-nations";
import { COUNTRY_LOGOS } from "@/lib/onboarding";

const NEUTRAL_PRIMARY = "#9ca3af";

// The app-wide profile avatar: a JerseyAvatar (components/ui/jersey-avatar)
// headed with the user's country's own national team crest, jersey colored
// from that same nation's real flag hue (jerseyColorFromHue) rather than
// the muted UI accent theme — a flag's actual color (e.g. Morocco's vivid
// red) reads noticeably stronger than accent-themes.ts's toned-down accent,
// picked for buttons/backgrounds, not for looking like the flag. Falls
// back to the accent theme for "Autre" (no nation/hue to draw from).
// Replaces the old CustomAvatar/CountryAvatar/AvatarEditorSheet face-
// builder system — there's nothing left to *edit* here on its own, the
// avatar is fully derived from the country already chosen in Profil's
// "Pays favori" section.
export function ProfileAvatar({
  countryId,
  size,
  className,
}: {
  countryId: string | null;
  size: 10 | 14 | 20 | 28;
  className?: string;
}) {
  if (!countryId) {
    return <JerseyAvatar primaryColor={NEUTRAL_PRIMARY} size={size} className={className} />;
  }

  const nation = getAfricanNation(countryId);
  const primaryColor = nation ? jerseyColorFromHue(nation.hues[0]) : getAccentTheme(countryId).accent;
  const crestUrl = COUNTRY_LOGOS[countryId];

  return (
    <JerseyAvatar
      primaryColor={primaryColor}
      flagUrl={crestUrl}
      countryCode={crestUrl ? undefined : countryId === OTHER_COUNTRY_ID ? "🌍" : undefined}
      size={size}
      className={className}
    />
  );
}
