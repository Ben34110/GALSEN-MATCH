"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { removeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";
import { FAVORITE_TEAMS_STORAGE_KEY } from "@/lib/favorites";
import { FANTASY_LINEUP_STORAGE_KEY } from "@/lib/fantasy-lineup";
import { DEVICE_ID_KEY } from "@/lib/device-id";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

// "Logging out" means clearing this device's local identity so it bounces
// back to onboarding, ready for a fresh profile. Removing
// ONBOARDING_STORAGE_KEY alone is what OnboardingGate actually keys off of;
// favorites and the Fantasy lineup are cleared too since they're personal to
// whoever just set them up, not something a next person on this device
// should inherit. If a real account is signed in, its Supabase Auth session
// is also cleared — otherwise OnboardingGate's cross-device restore would
// immediately re-hydrate the wiped profile from the still-active session.
export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const confirmed = window.confirm(
      "Se déconnecter ? Ton profil, tes favoris et ton équipe Fantasy seront effacés de cet appareil."
    );
    if (!confirmed) return;

    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();

    removeLocalStorageValue(ONBOARDING_STORAGE_KEY);
    removeLocalStorageValue(FAVORITE_TEAMS_STORAGE_KEY);
    removeLocalStorageValue(FANTASY_LINEUP_STORAGE_KEY);
    removeLocalStorageValue(DEVICE_ID_KEY);
    router.push("/onboarding");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-muted transition-colors hover:border-accent-3/40 hover:text-accent-3"
    >
      <LogOut size={16} aria-hidden />
      Déconnexion
    </button>
  );
}
