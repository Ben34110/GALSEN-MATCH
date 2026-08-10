import { JerseyAvatar } from "@/components/ui/jersey-avatar";
import { getAccentTheme, OTHER_COUNTRY_ID } from "@/lib/mock/accent-themes";
import { COUNTRY_LOGOS } from "@/lib/onboarding";

const NEUTRAL_PRIMARY = "#9ca3af";
const NEUTRAL_SECONDARY = "#d1d5db";

// The app-wide profile avatar: a JerseyAvatar (components/ui/jersey-avatar)
// colored from the user's chosen country (lib/mock/accent-themes.ts),
// headed with that country's own national team crest — replaces the old
// CustomAvatar/CountryAvatar/AvatarEditorSheet face-builder system. There's
// nothing left to *edit* here on its own: the avatar is fully derived from
// the country already chosen in Profil's "Pays favori" section, so
// changing country there is what changes the avatar.
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
    return <JerseyAvatar primaryColor={NEUTRAL_PRIMARY} secondaryColor={NEUTRAL_SECONDARY} size={size} className={className} />;
  }

  const theme = getAccentTheme(countryId);
  const crestUrl = COUNTRY_LOGOS[countryId];

  return (
    <JerseyAvatar
      primaryColor={theme.accent}
      secondaryColor={theme.accent2}
      badgeColor={theme.accent3}
      flagUrl={crestUrl}
      countryCode={crestUrl ? undefined : countryId === OTHER_COUNTRY_ID ? "🌍" : undefined}
      size={size}
      className={className}
    />
  );
}
