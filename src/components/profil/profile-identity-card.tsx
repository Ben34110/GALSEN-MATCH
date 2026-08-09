"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, Pencil, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountryAvatar } from "@/components/ui/country-avatar";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { AvatarEditorSheet } from "@/components/profil/avatar-editor-sheet";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { COUNTRY_LOGOS, initialsFromUsername, updateOnboardingProfile } from "@/lib/onboarding";
import { getAccentTheme } from "@/lib/mock/accent-themes";
import type { AvatarConfig } from "@/lib/avatar-options";

// So a returning user can tell at a glance which account (if any) this
// device is tied to, without having to log out to find out — "je veux voir
// avec quelle manière je suis connecté pour que je puisse me rappeler."
function ConnectionStatus() {
  const identity = useAuthIdentity();

  if (!identity) {
    return (
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
        <UserRound size={12} className="shrink-0" aria-hidden />
        Mode invité — aucun compte lié sur cet appareil
      </p>
    );
  }

  const label = identity.provider === "google" ? `Google · ${identity.email}` : identity.email;

  return (
    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted">
      <Mail size={12} className="shrink-0" aria-hidden />
      Connecté avec {label}
    </p>
  );
}

export function ProfileIdentityCard() {
  const profile = useOnboardingProfile();
  const [editingAvatar, setEditingAvatar] = useState(false);
  const username = profile?.username ?? "Amina Diop";
  const countryLabel = profile ? getAccentTheme(profile.countryId).label : "Sénégal";
  const logo = profile ? COUNTRY_LOGOS[profile.countryId] : COUNTRY_LOGOS.senegal;
  const handle = profile ? `@${profile.username.toLowerCase().replace(/\s+/g, "")}` : "@aminad";

  function saveAvatar(config: AvatarConfig) {
    if (!profile) return;
    updateOnboardingProfile(profile, { avatar: config });
    setEditingAvatar(false);
  }

  return (
    <Card className="mb-6 flex items-center gap-3.5">
      <button
        type="button"
        onClick={() => profile && setEditingAvatar(true)}
        disabled={!profile}
        aria-label="Personnaliser l'avatar"
        className="relative shrink-0"
      >
        {profile?.avatar ? (
          <CustomAvatar config={profile.avatar} size={14} />
        ) : (
          <CountryAvatar initials={profile ? initialsFromUsername(profile.username) : "AD"} size={14} />
        )}
        {profile && (
          <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full border-2 border-surface bg-accent text-accent-ink shadow-sm">
            <Pencil size={11} aria-hidden />
          </span>
        )}
      </button>
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-foreground">{username}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          {logo && <Image src={logo} alt="" width={16} height={16} className="size-4 shrink-0 object-contain" unoptimized />}
          {countryLabel} · {handle}
        </p>
        <ConnectionStatus />
      </div>

      {editingAvatar && (
        <AvatarEditorSheet initial={profile?.avatar ?? null} onSave={saveAvatar} onClose={() => setEditingAvatar(false)} />
      )}
    </Card>
  );
}
