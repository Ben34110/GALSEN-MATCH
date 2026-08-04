"use client";

import { Card } from "@/components/ui/card";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { COUNTRY_FLAGS, initialsFromUsername } from "@/lib/onboarding";
import { getAccentTheme } from "@/lib/mock/accent-themes";

export function ProfileIdentityCard() {
  const profile = useOnboardingProfile();
  const username = profile?.username ?? "Amina Diop";
  const countryLabel = profile ? getAccentTheme(profile.countryId).label : "Sénégal";
  const flag = profile ? (COUNTRY_FLAGS[profile.countryId] ?? "🌍") : "🇸🇳";
  const handle = profile ? `@${profile.username.toLowerCase().replace(/\s+/g, "")}` : "@aminad";

  return (
    <Card className="mb-6 flex items-center gap-3.5">
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-lg font-extrabold text-accent-ink">
        {profile ? initialsFromUsername(profile.username) : "AD"}
      </span>
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-foreground">{username}</p>
        <p className="text-sm text-muted">
          <span aria-hidden>{flag}</span> {countryLabel} · {handle}
        </p>
      </div>
    </Card>
  );
}
