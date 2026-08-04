"use client";

import { useLocalStorageValue } from "@/hooks/use-local-storage-value";
import { ONBOARDING_STORAGE_KEY, parseOnboardingProfile } from "@/lib/onboarding";

export function useOnboardingProfile() {
  const raw = useLocalStorageValue(ONBOARDING_STORAGE_KEY);
  return parseOnboardingProfile(raw);
}
