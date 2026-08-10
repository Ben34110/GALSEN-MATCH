"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { updateOnboardingProfile } from "@/lib/onboarding";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { isUsernameTaken } from "@/app/actions/profile-sync";

export function UsernameEditor() {
  const t = useTranslations("profil.preferences.username");
  const profile = useOnboardingProfile();
  const [value, setValue] = useState(profile?.username ?? "");
  const [status, setStatus] = useState<"idle" | "checking" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  async function commit() {
    if (!profile) return;
    const trimmed = value.trim();
    setError(null);

    if (!trimmed || trimmed === profile.username) {
      setValue(profile.username);
      return;
    }
    if (trimmed.length < 2) {
      setError(t("minLength"));
      setValue(profile.username);
      return;
    }

    setStatus("checking");
    const taken = await isUsernameTaken(trimmed, getOrCreateDeviceId());
    if (taken) {
      setStatus("idle");
      setError(t("taken"));
      setValue(profile.username);
      return;
    }

    updateOnboardingProfile(profile, { username: trimmed });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <section>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{t("title")}</h2>
      <p className="mb-3 text-sm leading-relaxed text-muted">{t("subtitle")}</p>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={commit}
          disabled={status === "checking"}
          className={cn(
            "min-h-11 w-full rounded-xl border bg-surface px-3 pr-10 text-base text-foreground",
            "placeholder:text-muted focus:border-accent focus:outline-none",
            error ? "border-accent-3" : "border-border"
          )}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {status === "checking" && <Loader2 size={16} className="animate-spin text-muted" aria-hidden />}
          {status === "saved" && <Check size={16} className="text-accent" aria-hidden />}
        </span>
      </div>
      {error && <p className="mt-1.5 text-xs text-accent-3">{error}</p>}
    </section>
  );
}
