"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { ONBOARDING_STORAGE_KEY, parseOnboardingProfile } from "@/lib/onboarding";
import { AppLoadingScreen } from "@/components/ui/app-loading-screen";

// Guards every tab (/actu, /live, /fantasy, /chat, /profil): a visitor who
// hasn't completed onboarding (country + 3 players + username) is bounced to
// /onboarding before seeing the app. Returning users pass straight through.
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const profile = useOnboardingProfile();
  const router = useRouter();
  const [confirmedMissing, setConfirmedMissing] = useState(false);

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
