"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell, Check, ChevronLeft, ChevronRight, Mail, Search, UserRound } from "lucide-react";
import { cn, normalizeForSearch } from "@/lib/utils";
import { accentThemes } from "@/lib/mock/accent-themes";
import { getAfricanPlayers, searchAfricanPlayers } from "@/lib/data/african-players";
import { applyAccentTheme } from "@/components/theme/accent-theme-provider";
import { writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { NATIONALITY_BY_THEME_ID, ONBOARDING_STORAGE_KEY, normalizeTiktokHandle } from "@/lib/onboarding";
import { OTHER_COUNTRY_ID } from "@/lib/mock/accent-themes";
import { CountryCrest } from "@/components/ui/country-crest";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { ensurePushSubscription, PUSH_FAILURE_MESSAGES } from "@/hooks/use-push-subscription";
import { saveNewsNotificationPref } from "@/app/actions/notifications";
import { TiktokIcon } from "@/components/icons/tiktok-icon";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getProfileByUserId, syncUserProfile } from "@/app/actions/profile-sync";

const COUNTRIES = accentThemes.filter((theme) => theme.id !== "default");

const STEPS = ["account", "country", "players", "username", "tiktok"] as const;

const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: "Gardien",
  Defender: "Défenseur",
  Midfielder: "Milieu",
  Attacker: "Attaquant",
};

// First-run wizard: sign-in/restore (optional) -> country -> 3 favorite
// players -> username -> TikTok (optional). Lives outside the (app) route
// group (full-bleed, no tab bar), same as the splash screen. OnboardingGate
// (components/onboarding/onboarding-gate.tsx) redirects here from any tab
// until this profile exists in localStorage — and already handles restoring
// an existing account's profile before that redirect ever happens, so
// landing here signed-in with no local profile means this account has none
// saved either; the account step is skipped straight to "country" in that
// case (see the mount effect below) since re-authenticating would be
// redundant.
export default function OnboardingPage() {
  const router = useRouter();
  const profile = useOnboardingProfile();
  const players = useMemo(() => getAfricanPlayers(), []);

  const [stepIndex, setStepIndex] = useState(0);
  const [countryId, setCountryId] = useState<string | null>(null);
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [newsNotifStatus, setNewsNotifStatus] = useState<"idle" | "pending" | "enabled">("idle");
  const [newsNotifCountryId, setNewsNotifCountryId] = useState<string | null>(null);
  const [newsNotifFailReason, setNewsNotifFailReason] = useState<keyof typeof PUSH_FAILURE_MESSAGES | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Defaults to "signin" so opening this screen actually tests an existing
  // login by default — defaulting to "signup" made typing throwaway
  // credentials silently create a brand-new (unconfirmed, sessionless)
  // account instead of failing like a real login attempt would.
  const [accountMode, setAccountMode] = useState<"signup" | "signin">("signin");
  const [accountStatus, setAccountStatus] = useState<"idle" | "pending" | "check-email">("idle");
  const [accountError, setAccountError] = useState<string | null>(null);

  const visibleCountries = useMemo(() => {
    const query = normalizeForSearch(countrySearch.trim());
    if (!query) return COUNTRIES;
    return COUNTRIES.filter((country) => normalizeForSearch(country.label).includes(query));
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

  // Landing here already signed in (OnboardingGate redirects here when a
  // session exists but restoring found no saved profile for it — see the
  // comment above) means there's nothing to authenticate: skip the account
  // step straight to "country" so the wizard just builds this account's
  // first profile instead of asking them to sign in again.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) setStepIndex((i) => (i === 0 ? 1 : i));
    });
  }, []);

  if (profile) return null;

  const step = STEPS[stepIndex];
  const canAdvance =
    (step === "country" && countryId !== null) ||
    (step === "players" && playerIds.length === 3) ||
    (step === "username" && username.trim().length >= 2) ||
    // Both optional — creating an account is one of three choices on this
    // step (the other two, email/password and Google, have their own
    // buttons below); the bottom "Terminer" button is always the guest path.
    step === "tiktok" ||
    step === "account";

  // Opt-in, not automatic — tapping "Continuer" without touching this is
  // the normal path, same as skipping a favorite club's notification
  // toggles. Independent of the ONBOARDING_STORAGE_KEY profile write in
  // finish(): the device id / push subscription / news_notification_prefs
  // row aren't part of that local profile, so this can be saved the moment
  // the user asks for it, before "Terminer" is even tapped.
  async function enableNewsNotifications(selectedCountryId: string) {
    setNewsNotifStatus("pending");
    setNewsNotifFailReason(null);
    const result = await ensurePushSubscription();
    if (!result.ok) {
      setNewsNotifStatus("idle");
      setNewsNotifFailReason(result.reason);
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

  async function next() {
    if (!canAdvance) return;
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    await finish();
  }

  // The one write path for the collected wizard state — every ending
  // (guest, email/password, Google) goes through this first. Separated
  // from navigation because the Google path needs the profile saved
  // *before* the OAuth redirect navigates the browser away entirely (see
  // continueWithGoogle below); it can't wait for a router.push that will
  // never get to run.
  function saveLocalProfile() {
    if (!countryId) return;
    writeLocalStorageValue(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({
        countryId,
        playerIds,
        username: username.trim(),
        favoriteClubId: null,
        tiktokHandle: normalizeTiktokHandle(tiktokHandle),
        avatar: null,
      })
    );
    applyAccentTheme(countryId);
  }

  // "Continuer en invité" — the guest path, unchanged from before accounts
  // existed. Bound to the bottom "Terminer" button on every step. Syncs to
  // Supabase directly here, awaited, before navigating — OnboardingGate
  // also does this reactively once `profile` changes on the next page, but
  // that effect is fire-and-forget: a user who's actually signed in,
  // finishes onboarding, then immediately logs out could race past it and
  // leave their user_profiles row keyed only by device_id, never by the
  // account's user_id — logout wipes device_id, so that row becomes
  // unreachable, and re-signing in finds nothing to restore. Awaiting the
  // sync before the router.push closes that window.
  async function finish() {
    saveLocalProfile();
    if (countryId) {
      await syncUserProfile(
        getOrCreateDeviceId(),
        username.trim(),
        countryId,
        playerIds,
        null,
        normalizeTiktokHandle(tiktokHandle),
        null
      );
    }
    router.push("/actu");
  }

  // Called right after a successful sign-up/sign-in, at the "account" step
  // — before any of country/players/username has been collected yet, so
  // there's nothing local to merge: either this account already has a
  // saved profile (a returning user restoring on a new device) and we
  // hydrate + skip straight to the app, or it doesn't (brand new account)
  // and the wizard continues normally from "country" to build one, which
  // will sync to this account automatically once finish() runs (see
  // lib/auth.ts's resolveActor).
  async function proceedAfterSignIn(userId: string) {
    const restored = await getProfileByUserId(userId);
    if (restored) {
      writeLocalStorageValue(ONBOARDING_STORAGE_KEY, JSON.stringify(restored));
      applyAccentTheme(restored.countryId);
      router.push("/actu");
      return;
    }
    setAccountStatus("idle");
    setStepIndex(1);
  }

  async function submitAccountForm() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAccountError("Comptes indisponibles pour l'instant — continue en invité.");
      return;
    }
    setAccountStatus("pending");
    setAccountError(null);

    const { data, error } =
      accountMode === "signup"
        ? // emailRedirectTo mirrors continueWithGoogle's redirectTo below — without
          // it, the confirmation link falls back to Supabase's project-level Site
          // URL instead of this app's /auth/callback, which is what actually
          // exchanges the confirmation for a real session cookie. Without this,
          // clicking "confirm" could land the user on the app looking signed in
          // (Supabase itself considers the email confirmed) while no session was
          // ever established here — same silent-failure shape as the user_id
          // index bug, just one layer up.
          await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/actu` },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAccountStatus("idle");
      setAccountError(error.message);
      return;
    }
    if (!data.session || !data.user) {
      // Supabase's default: signUp needs an email confirmation click before
      // a session exists — nothing to restore/link yet. Let them keep going
      // as a guest in the meantime; OnboardingGate links this device's data
      // to the account automatically once they do confirm and come back.
      setAccountStatus("check-email");
      return;
    }
    await proceedAfterSignIn(data.user.id);
  }

  async function continueWithGoogle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAccountError("Comptes indisponibles pour l'instant — continue en invité.");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/actu` },
    });
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden px-6 pt-[calc(1.5rem+var(--safe-top))]">
      <div className="flex shrink-0 items-center gap-2">
        <Image src="/logo-mark.png" alt="" width={36} height={36} className="size-9 object-contain" />
        <span className="font-serif text-lg font-bold tracking-tight text-foreground">AfroLive</span>
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
        {step === "account" && (
          <>
            <span className="grid size-11 place-items-center rounded-full bg-accent/10 text-accent">
              <UserRound size={20} aria-hidden />
            </span>
            <h1 className="mt-3 font-serif text-2xl font-bold text-foreground">Connecte-toi</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Facultatif — si tu as déjà un compte, on retrouve direct ton profil. Sinon, crée-en un pour le
              sauvegarder au fil des prochaines étapes, ou continue sans compte : tout reste alors sur cet appareil,
              comme avant.
            </p>

            {accountStatus === "check-email" ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-3.5">
                <Mail size={18} className="shrink-0 text-accent" aria-hidden />
                <p className="text-sm leading-snug text-foreground">
                  Vérifie ta boîte mail pour confirmer ton compte. Continue en attendant — tes données te suivront
                  automatiquement dès que tu reviendras connecté.
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={continueWithGoogle}
                  className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-[0.98]"
                >
                  Continuer avec Google
                </button>

                <div className="my-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  <span className="h-px flex-1 bg-border" aria-hidden />
                  ou
                  <span className="h-px flex-1 bg-border" aria-hidden />
                </div>

                <div className="flex gap-1.5 rounded-full border border-border bg-surface p-1">
                  <button
                    type="button"
                    onClick={() => setAccountMode("signup")}
                    className={cn(
                      "min-h-9 flex-1 rounded-full text-xs font-bold transition-colors",
                      accountMode === "signup" ? "bg-accent text-accent-ink" : "text-muted"
                    )}
                  >
                    Créer un compte
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountMode("signin")}
                    className={cn(
                      "min-h-9 flex-1 rounded-full text-xs font-bold transition-colors",
                      accountMode === "signin" ? "bg-accent text-accent-ink" : "text-muted"
                    )}
                  >
                    Se connecter
                  </button>
                </div>

                <label htmlFor="onboarding-email" className="sr-only">
                  Email
                </label>
                <input
                  id="onboarding-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ton@email.com"
                  autoComplete="email"
                  className={cn(
                    "mt-3 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground",
                    "placeholder:text-muted focus:border-accent focus:outline-none"
                  )}
                />
                <label htmlFor="onboarding-password" className="sr-only">
                  Mot de passe
                </label>
                <input
                  id="onboarding-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mot de passe"
                  autoComplete={accountMode === "signup" ? "new-password" : "current-password"}
                  className={cn(
                    "mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground",
                    "placeholder:text-muted focus:border-accent focus:outline-none"
                  )}
                />

                {accountError && <p className="mt-2 text-xs leading-relaxed text-accent-3">{accountError}</p>}

                <button
                  type="button"
                  onClick={submitAccountForm}
                  disabled={accountStatus === "pending" || !email.trim() || password.length < 6}
                  className={cn(
                    "mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl bg-foreground text-base font-semibold text-background",
                    "transition-transform duration-[var(--duration-fast)] active:scale-[0.98] disabled:opacity-40"
                  )}
                >
                  {accountStatus === "pending" ? "…" : accountMode === "signup" ? "Créer mon compte" : "Se connecter"}
                </button>
              </>
            )}
          </>
        )}

        {step === "country" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-foreground">Ton pays</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              On mettra en avant l&apos;actu, le chat et les couleurs de ta nation — les 54 pays de la CAF sont
              disponibles, plus une option « Autre » si tu n&apos;es pas Africain.
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
                    <CountryCrest countryId={country.id} size={40} className="size-10 object-contain" />
                    <span className="text-sm font-semibold text-foreground">{country.label}</span>
                    {active && <Check size={16} className="text-accent" aria-hidden />}
                  </button>
                );
              })}
              {visibleCountries.length === 0 && (
                <p className="col-span-2 py-6 text-center text-sm text-muted">Aucun pays trouvé.</p>
              )}
            </div>

            {countryId && countryId !== OTHER_COUNTRY_ID && (
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
            {newsNotifFailReason && (
              <p className="mt-2 text-xs leading-relaxed text-accent-3">{PUSH_FAILURE_MESSAGES[newsNotifFailReason]}</p>
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
                  {countryId && <CountryCrest countryId={countryId} size={14} className="size-3.5 object-contain" />}
                  {countryId === OTHER_COUNTRY_ID ? "Tous les joueurs" : "Joueurs de ta nation d'abord"}
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

        {step === "tiktok" && (
          <>
            <span className="grid size-11 place-items-center rounded-full bg-accent/10 text-foreground">
              <TiktokIcon size={20} />
            </span>
            <h1 className="mt-3 font-serif text-2xl font-bold text-foreground">Ton compte TikTok</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Facultatif — affiché sur ton profil dans le chat, les autres pourront y accéder en un clic. Tu peux
              passer cette étape ou le renseigner plus tard depuis Profil.
            </p>
            <label htmlFor="onboarding-tiktok" className="sr-only">
              Compte TikTok
            </label>
            <input
              id="onboarding-tiktok"
              value={tiktokHandle}
              onChange={(event) => setTiktokHandle(event.target.value)}
              placeholder="@tonpseudo"
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
          disabled={!canAdvance || (step === "account" && accountStatus === "pending")}
          className={cn(
            "flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold",
            "transition-transform duration-[var(--duration-fast)] active:scale-[0.98]",
            !canAdvance
              ? "cursor-not-allowed bg-surface-2 text-muted"
              : // On the account step, the real action is the in-form Créer/Se
                // connecter button above (bg-foreground, same as this button used
                // to be) — styling this one identically made it read as "the same
                // next action," and it's always enabled regardless of what's typed
                // above, so it kept getting tapped instead of actually submitting
                // the form. Outlined/secondary here makes the two unmistakably
                // different weights.
                step === "account"
                ? "border border-border bg-surface text-muted hover:text-foreground"
                : "bg-foreground text-background"
          )}
        >
          {stepIndex === STEPS.length - 1 ? "Terminer" : step === "account" ? "Continuer sans compte" : "Continuer"}
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
