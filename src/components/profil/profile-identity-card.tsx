"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { CountryAvatar } from "@/components/ui/country-avatar";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { COUNTRY_LOGOS, initialsFromUsername } from "@/lib/onboarding";
import { getAccentTheme } from "@/lib/mock/accent-themes";

export function ProfileIdentityCard() {
  const profile = useOnboardingProfile();
  const username = profile?.username ?? "Amina Diop";
  const countryLabel = profile ? getAccentTheme(profile.countryId).label : "Sénégal";
  const logo = profile ? COUNTRY_LOGOS[profile.countryId] : COUNTRY_LOGOS.senegal;
  const handle = profile ? `@${profile.username.toLowerCase().replace(/\s+/g, "")}` : "@aminad";

  return (
    <Card className="mb-6 flex items-center gap-3.5">
      <CountryAvatar initials={profile ? initialsFromUsername(profile.username) : "AD"} size={14} />
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-foreground">{username}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          {logo && <Image src={logo} alt="" width={16} height={16} className="size-4 shrink-0 object-contain" unoptimized />}
          {countryLabel} · {handle}
        </p>
      </div>
    </Card>
  );
}
