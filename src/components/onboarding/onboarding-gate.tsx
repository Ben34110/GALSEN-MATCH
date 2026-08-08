"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { ONBOARDING_STORAGE_KEY, parseOnboardingProfile } from "@/lib/onboarding";
import { AppLoadingScreen } from "@/components/ui/app-loading-screen";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { syncUserProfile } from "@/app/actions/profile-sync";

// Guards every tab (/actu, /live, /fantasy, /chat, /profil): a visitor who
// hasn't completed onboarding (country + 3 players + username) is bounced to
// /onboarding before seeing the app. Returning users pass straight through.
//
// Also the one centralized place that mirrors the local onboarding profile
// to Supabase (see app/actions/profile-sync.ts) — this component is already
// mounted on every tab and already holds `profile`, so it's a single sync
// point instead of wiring a call into every one of preferences-editor.tsx's
// edit handlers individually. Powers the chat profile sheet (clicking a
// message needs to read *someone else's* device's profile — see
// app/actions/chat-profile.ts).
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const profile = useOnboardingProfile();
  const router = useRouter();
  const [confirmedMissing, setConfirmedMissing] = useState(false);
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const key = JSON.stringify(profile);
    if (key === lastSynced.current) return;
    lastSynced.current = key;
    syncUserProfile(
      getOrCreateDeviceId(),
      profile.username,
      profile.countryId,
      profile.playerIds,
      profile.favoriteClubId,
      profile.tiktokHandle
    );
  }, [profile]);

  useEffect(() => {
    if (profile) return;
    // On a hard navigation, useSyncExternalStore's server snapshot (null)
    // can still be live for a frame while it settles to the real localStorage
    // value post-hydration. Re-check directly before trusting a `null` read
    // and bouncing an already-onboarded user out of the app.
    const id = requestAnimationFrame(() => {
      const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!parseOnboardingProfile(raw)) {
        setConfirmedMissing(true);
        router.replace("/onboarding");
      }
    });
    return () => cancelAnimationFrame(id);
  }, [profile, router]);

  if (confirmedMissing) return null;
  // profile is null on the server render and for a frame after hydration
  // (see the rAF check above) — show a loading screen instead of letting
  // real content (or a blank flash) show before we actually know whether
  // this visitor is onboarded.
  if (!profile) return <AppLoadingScreen />;
  return <>{children}</>;
}
