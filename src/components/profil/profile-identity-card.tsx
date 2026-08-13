"use client";

import { useState } from "react";
import { Mail, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { CountryFlag } from "@/components/ui/country-flag";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { CreateAccountSheet } from "@/components/profil/create-account-sheet";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { getAccentTheme } from "@/lib/mock/accent-themes";

// So a returning user can tell at a glance which account (if any) this
// device is tied to, without having to log out to find out — "je veux voir
// avec quelle manière je suis connecté pour que je puisse me rappeler." A
// guest additionally gets a way to create one without losing what's already
// on this device — see create-account-sheet.tsx for why nothing extra is
// needed to keep it linked.
function ConnectionStatus() {
  const t = useTranslations("profil.identityCard");
  const identity = useAuthIdentity();
  const [creatingAccount, setCreatingAccount] = useState(false);

  if (!identity) {
    return (
      <>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <UserRound size={12} className="shrink-0" aria-hidden />
          {t("guestMode")}
        </p>
        <button
          type="button"
          onClick={() => setCreatingAccount(true)}
          className="mt-1.5 text-xs font-bold text-accent underline-offset-2 hover:underline"
        >
          {t("createAccount")}
        </button>
        {creatingAccount && <CreateAccountSheet onClose={() => setCreatingAccount(false)} />}
      </>
    );
  }

  const label = identity.provider === "google" ? `Google · ${identity.email}` : (identity.email ?? "");

  return (
    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted">
      <Mail size={12} className="shrink-0" aria-hidden />
      {t("connectedWith", { label })}
    </p>
  );
}

export function ProfileIdentityCard() {
  const profile = useOnboardingProfile();
  const username = profile?.username ?? "Amina Diop";
  const countryId = profile?.countryId ?? "senegal";
  const countryLabel = profile ? getAccentTheme(profile.countryId).label : "Sénégal";
  const handle = profile ? `@${profile.username.toLowerCase().replace(/\s+/g, "")}` : "@aminad";

  return (
    <Card className="mb-6 flex items-center gap-3.5">
      <ProfileAvatar countryId={countryId} size={14} className="shrink-0" />
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-foreground">{username}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <CountryFlag countryId={countryId} size={16} className="size-4 shrink-0 object-contain" />
          {countryLabel} · {handle}
        </p>
        <ConnectionStatus />
      </div>
    </Card>
  );
}
