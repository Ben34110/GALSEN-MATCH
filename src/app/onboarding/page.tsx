"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentThemes } from "@/lib/mock/accent-themes";
import { getTeamById } from "@/lib/mock/teams";
import { getFantasyPool } from "@/lib/data/fantasy";
import { applyAccentTheme } from "@/components/theme/accent-theme-provider";
import { writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { COUNTRY_FLAGS, ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";

const COUNTRIES = accentThemes.filter((theme) => theme.id !== "default");

const STEPS = ["country", "players", "username"] as const;

// First-run wizard: country -> 3 favorite players -> username. Lives outside
// the (app) route group (full-bleed, no tab bar), same as the splash screen.
// OnboardingGate (components/onboarding/onboarding-gate.tsx) redirects here
// from any tab until this profile exists in localStorage.
export default function OnboardingPage() {
  const router = useRouter();
  const profile = useOnboardingProfile();
  const pool = useMemo(() => getFantasyPool(), []);

  const [stepIndex, setStepIndex] = useState(0);
  const [countryId, setCountryId] = useState<string | null>(null);
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const [username, setUsername] = useState("");

  // Already onboarded (e.g. revisiting the URL): skip straight back into the app.
  useEffect(() => {
    if (profile) router.replace("/actu");
  }, [profile, router]);

  if (profile) return null;

  const step = STEPS[stepIndex];
  const canAdvance =
    (step === "country" && countryId !== null) ||
    (step === "players" && playerIds.length === 3) ||
    (step === "username" && username.trim().length >= 2);

  function togglePlayer(id: string) {
    setPlayerIds((current) => {
      if (current.includes(id)) return current.filter((pid) => pid !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  function next() {
    if (!canAdvance) return;
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    finish();
  }

  function finish() {
    if (!countryId) return;
    writeLocalStorageValue(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ countryId, playerIds, username: username.trim() })
    );
    applyAccentTheme(countryId);
    router.push("/actu");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))]">
      <div className="flex items-center gap-2">
        <span className="gradient-accent grid size-9 place-items-center rounded-xl text-sm font-extrabold text-accent-ink">
          GM
        </span>
        <span className="font-serif text-lg font-bold tracking-tight text-foreground">Galsen Match</span>
      </div>

      <div
        className="mt-8 flex gap-1.5"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
      >
        {STEPS.map((s, index) => (
          <span
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-[var(--duration-base)]",
              index <= stepIndex ? "bg-accent" : "bg-surface-2"
            )}
          />
        ))}
      </div>

      <div className="mt-8 flex-1">
        {step === "country" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-foreground">Ton pays</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              On mettra en avant l&apos;actu, le chat et les couleurs de ta nation.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {COUNTRIES.map((country) => {
                const active = countryId === country.id;
                return (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => setCountryId(country.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border p-4",
                      "transition-[transform,border-color,background-color] duration-[var(--duration-fast)] active:scale-95",
                      active ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/30"
                    )}
                  >
                    <span className="text-3xl" aria-hidden>
                      {COUNTRY_FLAGS[country.id]}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{country.label}</span>
                    {active && <Check size={16} className="text-accent" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === "players" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-foreground">Tes 3 joueurs préférés</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Choisis-en exactement trois — ils te serviront de base pour ton Starting 6.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-accent">
              {playerIds.length}/3 sélectionnés
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {pool.map((player) => {
                const selected = playerIds.includes(player.id);
                const team = getTeamById(player.teamId);
                const disabled = !selected && playerIds.length >= 3;
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    disabled={disabled}
                    aria-pressed={selected}
                    className={cn(
                      "flex min-h-11 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left",
                      "transition-colors duration-[var(--duration-fast)]",
                      selected ? "border-accent bg-accent/10" : "border-border bg-surface",
                      disabled && "opacity-40"
                    )}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-bold text-foreground">
                      {player.photoInitials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{player.fullName}</span>
                      <span className="block text-[11px] text-muted">{team?.shortName ?? "—"}</span>
                    </span>
                    {selected && <Check size={16} className="shrink-0 text-accent" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === "username" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-foreground">Choisis ton pseudo</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              C&apos;est ce que la communauté verra dans le chat et le classement fantasy.
            </p>
            <label htmlFor="onboarding-username" className="sr-only">
              Pseudo
            </label>
            <input
              id="onboarding-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Ex. AminaD"
              maxLength={24}
              autoComplete="off"
              autoFocus
              className={cn(
                "mt-6 min-h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base text-foreground",
                "placeholder:text-muted focus:border-accent focus:outline-none"
              )}
            />
          </>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            aria-label="Étape précédente"
            className="grid size-14 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground transition-transform duration-[var(--duration-fast)] active:scale-95"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={next}
          disabled={!canAdvance}
          className={cn(
            "flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold",
            "transition-transform duration-[var(--duration-fast)] active:scale-[0.98]",
            canAdvance ? "bg-foreground text-background" : "cursor-not-allowed bg-surface-2 text-muted"
          )}
        >
          {stepIndex === STEPS.length - 1 ? "Terminer" : "Continuer"}
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
