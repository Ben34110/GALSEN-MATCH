"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell, Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentThemes } from "@/lib/mock/accent-themes";
import { getAfricanPlayers, searchAfricanPlayers } from "@/lib/data/african-players";
import { applyAccentTheme } from "@/components/theme/accent-theme-provider";
import { writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { COUNTRY_LOGOS, NATIONALITY_BY_THEME_ID, ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { ensurePushSubscription } from "@/hooks/use-push-subscription";
import { saveNewsNotificationPref } from "@/app/actions/notifications";

const COUNTRIES = accentThemes.filter((theme) => theme.id !== "default");

const STEPS = ["country", "players", "username"] as const;

const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: "Gardien",
  Defender: "Défenseur",
  Midfielder: "Milieu",
  Attacker: "Attaquant",
};

// First-run wizard: country -> 3 favorite players -> username. Lives outside
// the (app) route group (full-bleed, no tab bar), same as the splash screen.
// OnboardingGate (components/onboarding/onboarding-gate.tsx) redirects here
// from any tab until this profile exists in localStorage.
export default function OnboardingPage() {
  const router = useRouter();
  const profile = useOnboardingProfile();
  const players = useMemo(() => getAfricanPlayers(), []);

  const [stepIndex, setStepIndex] = useState(0);
  const [countryId, setCountryId] = useState<string | null>(null);
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [newsNotifStatus, setNewsNotifStatus] = useState<"idle" | "pending" | "enabled">("idle");
  const [newsNotifCountryId, setNewsNotifCountryId] = useState<string | null>(null);

  const visibleCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter((country) => country.label.toLowerCase().includes(query));
  }, [countrySearch]);

  const visiblePlayers = useMemo(() => {
    if (!playerSearch.trim()) {
      // Default: this player's own nation, most-capped first — the rest of
      // the continent is one search away.
      const nationality = countryId ? NATIONALITY_BY_THEME_ID[countryId] : undefined;
      const ownCountry = nationality ? players.filter((player) => player.nationality === nationality) : players;
      return [...ownCountry].sort((a, b) => b.appearances + b.goals - (a.appearances + a.goals));
    }
    return searchAfricanPlayers(players, playerSearch).slice(0, 40);
  }, [players, playerSearch, countryId]);

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

  // Opt-in, not automatic — tapping "Continuer" without touching this is
  // the normal path, same as skipping a favorite club's notification
  // toggles. Independent of the ONBOARDING_STORAGE_KEY profile write in
  // finish(): the device id / push subscription / news_notification_prefs
  // row aren't part of that local profile, so this can be saved the moment
  // the user asks for it, before "Terminer" is even tapped.
  async function enableNewsNotifications(selectedCountryId: string) {
    setNewsNotifStatus("pending");
    const granted = await ensurePushSubscription();
    if (!granted) {
      setNewsNotifStatus("idle");
      return;
    }
    await saveNewsNotificationPref(getOrCreateDeviceId(), selectedCountryId);
    setNewsNotifCountryId(selectedCountryId);
    setNewsNotifStatus("enabled");
  }

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
      JSON.stringify({ countryId, playerIds, username: username.trim(), favoriteClubId: null })
    );
    applyAccentTheme(countryId);
    router.push("/actu");
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden px-6 pt-[calc(1.5rem+var(--safe-top))]">
      <div className="flex shrink-0 items-center gap-2">
        <span className="gradient-accent grid size-9 place-items-center rounded-xl text-sm font-extrabold text-accent-ink">
          GM
        </span>
        <span className="font-serif text-lg font-bold tracking-tight text-foreground">Galsen Match</span>
      </div>

      <div
        className="mt-8 flex shrink-0 gap-1.5"
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

      <div className="mt-8 flex-1 overflow-y-auto pb-4">
        {step === "country" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-foreground">Ton pays</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              On mettra en avant l&apos;actu, le chat et les couleurs de ta nation — les 54 pays de la CAF sont
              disponibles.
            </p>

            <div className="relative mt-4">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input
                value={countrySearch}
                onChange={(event) => setCountrySearch(event.target.value)}
                placeholder="Chercher un pays…"
                className={cn(
                  "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground",
                  "placeholder:text-muted focus:border-accent focus:outline-none"
                )}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {visibleCountries.map((country) => {
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
                    <Image
                      src={COUNTRY_LOGOS[country.id]}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 object-contain"
                      unoptimized
                    />
                    <span className="text-sm font-semibold text-foreground">{country.label}</span>
                    {active && <Check size={16} className="text-accent" aria-hidden />}
                  </button>
                );
              })}
              {visibleCountries.length === 0 && (
                <p className="col-span-2 py-6 text-center text-sm text-muted">Aucun pays trouvé.</p>
              )}
            </div>

            {countryId && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                  <Bell size={18} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Reçois les actus de ton pays</p>
                  <p className="text-xs leading-snug text-muted">Une notification dès qu&apos;un nouvel article sort.</p>
                </div>
                <button
                  type="button"
                  onClick={() => enableNewsNotifications(countryId)}
                  disabled={newsNotifStatus === "pending" || (newsNotifStatus === "enabled" && newsNotifCountryId === countryId)}
                  className={cn(
                    "min-h-9 shrink-0 rounded-full px-3.5 text-xs font-bold",
                    "transition-transform duration-[var(--duration-fast)] active:scale-95 disabled:active:scale-100",
                    newsNotifStatus === "enabled" && newsNotifCountryId === countryId
                      ? "bg-accent/15 text-accent"
                      : "bg-accent text-accent-ink"
                  )}
                >
                  {newsNotifStatus === "pending"
                    ? "…"
                    : newsNotifStatus === "enabled" && newsNotifCountryId === countryId
                      ? "Activé"
                      : "Activer"}
                </button>
              </div>
            )}
          </>
        )}

        {step === "players" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-foreground">Tes 3 joueurs préférés</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Choisis-en exactement trois parmi {players.length} joueurs africains des 5 grands championnats
              européens — ils te serviront de base pour ton Starting 6.
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {playerIds.length}/3 sélectionnés
              </p>
              {!playerSearch && (
                <p className="flex items-center gap-1 text-[11px] text-muted">
                  {countryId && (
                    <Image src={COUNTRY_LOGOS[countryId]} alt="" width={14} height={14} className="size-3.5 object-contain" unoptimized />
                  )}
                  Joueurs de ta nation d&apos;abord
                </p>
              )}
            </div>

            <div className="relative mt-3">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
                placeholder="Chercher un joueur, un pays, un club…"
                className={cn(
                  "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground",
                  "placeholder:text-muted focus:border-accent focus:outline-none"
                )}
              />
            </div>

            <div className="mt-3 flex flex-col gap-1.5">
              {visiblePlayers.map((player) => {
                const idStr = String(player.id);
                const selected = playerIds.includes(idStr);
                const disabled = !selected && playerIds.length >= 3;
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(idStr)}
                    disabled={disabled}
                    aria-pressed={selected}
                    className={cn(
                      "flex min-h-11 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left",
                      "transition-colors duration-[var(--duration-fast)]",
                      selected ? "border-accent bg-accent/10" : "border-border bg-surface",
                      disabled && "opacity-40"
                    )}
                  >
                    <Image
                      src={player.photo}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 shrink-0 rounded-full bg-surface-2 object-cover"
                      unoptimized
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{player.name}</span>
                      <span className="block truncate text-[11px] text-muted">
                        {player.nationality} · {player.teamName ?? "—"}
                        {player.position && ` · ${POSITION_LABELS[player.position] ?? player.position}`}
                      </span>
                    </span>
                    {selected && <Check size={16} className="shrink-0 text-accent" aria-hidden />}
                  </button>
                );
              })}
              {visiblePlayers.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">Aucun joueur trouvé pour cette recherche.</p>
              )}
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

      <div className="mt-4 flex shrink-0 items-center gap-3 border-t border-border pb-[calc(1.25rem+var(--safe-bottom))] pt-4">
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
