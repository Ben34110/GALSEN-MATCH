"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { ONBOARDING_STORAGE_KEY, parseOnboardingProfile } from "@/lib/onboarding";
import { AppLoadingScreen } from "@/components/ui/app-loading-screen";
import { FantasyRatingsPrefetch } from "@/components/fantasy/fantasy-ratings-prefetch";
import { MyStandingPrefetch } from "@/components/fantasy/my-standing-prefetch";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { syncUserProfile, getProfileByUserId } from "@/app/actions/profile-sync";
import { getFantasySquadsByUserId } from "@/app/actions/fantasy-sync";
import { linkDeviceData } from "@/app/actions/link-device-data";
import { FANTASY_LINEUP_STORAGE_KEY } from "@/lib/fantasy-lineup";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { writeLocalStorageValue } from "@/hooks/use-local-storage-value";

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
  const linkedRef = useRef(false);

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

  // Once a session exists (sign-up, sign-in, or already-logged-in on
  // return), re-key this device's existing guest rows onto the account —
  // see app/actions/link-device-data.ts. Runs at most once per mount; the
  // action's own is("user_id", null) guard makes repeat calls (e.g. an
  // onAuthStateChange firing again) no-ops anyway.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const link = (userId: string | null) => {
      if (!userId || linkedRef.current) return;
      linkedRef.current = true;
      linkDeviceData(getOrCreateDeviceId());
    };
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => link(data.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => link(session?.user.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (profile) return;
    // On a hard navigation, useSyncExternalStore's server snapshot (null)
    // can still be live for a frame while it settles to the real localStorage
    // value post-hydration. Re-check directly before trusting a `null` read
    // and bouncing an already-onboarded user out of the app.
    const id = requestAnimationFrame(() => {
      const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (parseOnboardingProfile(raw)) return;

      // No local profile on this device — before assuming this is a brand
      // new visitor, check for a signed-in session: someone signing into an
      // existing account on a second device has a profile saved server-side
      // (see app/actions/profile-sync.ts's getProfileByUserId) that should
      // be restored instead of re-running the wizard from zero.
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setConfirmedMissing(true);
        router.replace("/onboarding");
        return;
      }
      supabase.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
        const userId = data.user?.id ?? null;
        if (userId) {
          const restored = await getProfileByUserId(userId);
          if (restored) {
            writeLocalStorageValue(ONBOARDING_STORAGE_KEY, JSON.stringify(restored));
            // Fantasy squads have no other restore path (see
            // app/actions/fantasy-sync.ts's getFantasySquadsByUserId) — without
            // this, an account signing in on a device with no local profile
            // (including this same device right after LogoutButton wipes it)
            // would see an empty pitch view despite Supabase still having
            // every journée's squad for this account.
            const fantasySquads = await getFantasySquadsByUserId(userId);
            if (Object.keys(fantasySquads).length > 0) {
              writeLocalStorageValue(FANTASY_LINEUP_STORAGE_KEY, JSON.stringify(fantasySquads));
            }
            return;
          }
        }
        setConfirmedMissing(true);
        router.replace("/onboarding");
      });
    });
    return () => cancelAnimationFrame(id);
  }, [profile, router]);

  if (confirmedMissing) return null;
  // profile is null on the server render and for a frame after hydration
  // (see the rAF check above) — show a loading screen instead of letting
  // real content (or a blank flash) show before we actually know whether
  // this visitor is onboarded.
  if (!profile) return <AppLoadingScreen />;
  return (
    <>
      <FantasyRatingsPrefetch />
      <MyStandingPrefetch />
      {children}
    </>
  );
}
