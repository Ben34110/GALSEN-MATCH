"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Bell, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentThemes } from "@/lib/mock/accent-themes";
import { applyAccentTheme } from "@/components/theme/accent-theme-provider";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { useFavoriteTeamIds, addFavoriteTeam, removeFavoriteTeam } from "@/hooks/use-favorite-teams";
import { ensurePushSubscription } from "@/hooks/use-push-subscription";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { COUNTRY_LOGOS, updateOnboardingProfile } from "@/lib/onboarding";
import { getAfricanPlayers, searchAfricanPlayers } from "@/lib/data/african-players";
import { getTeamDirectory, searchTeams } from "@/lib/data/team-directory";
import { NotificationPrefsPanel, type NotificationOption } from "@/components/notifications/notification-prefs-panel";
import {
  deleteClubNotificationPrefs,
  deletePlayerNotificationPrefs,
  getClubNotificationPrefs,
  getPlayerNotificationPrefs,
  saveClubNotificationPrefs,
  savePlayerNotificationPrefs,
} from "@/app/actions/notifications";
import {
  DEFAULT_CLUB_PREFS,
  DEFAULT_PLAYER_PREFS,
  type ClubNotificationPrefs,
  type PlayerNotificationPrefs,
} from "@/lib/notification-prefs";

const COUNTRIES = accentThemes.filter((theme) => theme.id !== "default");

const CLUB_NOTIFICATION_OPTIONS: NotificationOption<ClubNotificationPrefs>[] = [
  { key: "notifyLineup", label: "Compo annoncée" },
  { key: "notifyGoals", label: "Chaque but" },
  { key: "notifyKickoff", label: "Coup d'envoi" },
  { key: "notifyFulltime", label: "Fin du match" },
];

const PLAYER_NOTIFICATION_OPTIONS: NotificationOption<PlayerNotificationPrefs>[] = [
  { key: "notifyLineup", label: "Titulaire au coup d'envoi" },
  { key: "notifyGoal", label: "But marqué" },
  { key: "notifyAssist", label: "Passe décisive" },
  { key: "notifyCard", label: "Carton" },
  { key: "notifyRating", label: "Note de fin de match" },
];

type ClubPrefsPanelState = { teamId: number; mode: "add" | "edit"; initial: ClubNotificationPrefs };
type PlayerPrefsPanelState = { playerId: string; mode: "add" | "edit"; initial: PlayerNotificationPrefs };

export function PreferencesEditor() {
  const profile = useOnboardingProfile();
  const favoriteTeamIds = useFavoriteTeamIds();
  const allPlayers = useMemo(() => getAfricanPlayers(), []);
  const allTeams = useMemo(() => getTeamDirectory(), []);

  const [playerSearch, setPlayerSearch] = useState("");
  const [clubSearch, setClubSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [clubPrefsPanel, setClubPrefsPanel] = useState<ClubPrefsPanelState | null>(null);
  const [playerPrefsPanel, setPlayerPrefsPanel] = useState<PlayerPrefsPanelState | null>(null);

  if (!profile) return null;

  const visibleCountries = countrySearch.trim()
    ? COUNTRIES.filter((country) => country.label.toLowerCase().includes(countrySearch.trim().toLowerCase()))
    : COUNTRIES;

  const selectedPlayers = profile.playerIds
    .map((id) => allPlayers.find((player) => String(player.id) === id))
    .filter((player): player is NonNullable<typeof player> => Boolean(player));

  const favoriteClub = profile.favoriteClubId ? allTeams.find((team) => team.id === profile.favoriteClubId) : undefined;

  const playerResults = playerSearch.trim() ? searchAfricanPlayers(allPlayers, playerSearch).slice(0, 20) : [];
  const clubResults = clubSearch.trim() ? searchTeams(allTeams, clubSearch).slice(0, 20) : [];

  function setCountry(countryId: string) {
    if (!profile) return;
    updateOnboardingProfile(profile, { countryId });
    applyAccentTheme(countryId);
  }

  function removePlayer(playerId: string) {
    if (!profile) return;
    updateOnboardingProfile(profile, { playerIds: profile.playerIds.filter((id) => id !== playerId) });
    deletePlayerNotificationPrefs(getOrCreateDeviceId(), Number(playerId));
    if (playerPrefsPanel?.playerId === playerId) setPlayerPrefsPanel(null);
  }

  function openAddPlayerPrefs(playerId: string) {
    setPlayerPrefsPanel({ playerId, mode: "add", initial: DEFAULT_PLAYER_PREFS });
  }

  function openEditPlayerPrefs(playerId: string) {
    setPlayerPrefsPanel({ playerId, mode: "edit", initial: DEFAULT_PLAYER_PREFS });
    getPlayerNotificationPrefs(getOrCreateDeviceId(), Number(playerId)).then((prefs) => {
      setPlayerPrefsPanel((current) => (current?.playerId === playerId ? { ...current, initial: prefs } : current));
    });
  }

  function confirmPlayerPrefs(prefs: PlayerNotificationPrefs) {
    if (!profile || !playerPrefsPanel) return;
    const { playerId, mode } = playerPrefsPanel;
    if (mode === "add") {
      if (!profile.playerIds.includes(playerId) && profile.playerIds.length < 3) {
        updateOnboardingProfile(profile, { playerIds: [...profile.playerIds, playerId] });
      }
      setPlayerSearch("");
    }
    // Close immediately — the favorite itself is already saved (localStorage,
    // synchronous) at this point. Push subscription + the Supabase write are
    // best-effort background work; waiting on them here used to mean that if
    // ensurePushSubscription() ever hung (e.g. the service worker still
    // installing on a first visit), the panel would just sit open forever,
    // looking exactly like "nothing got saved" even though it had.
    setPlayerPrefsPanel(null);
    ensurePushSubscription().then(() => savePlayerNotificationPrefs(getOrCreateDeviceId(), Number(playerId), prefs));
  }

  function openAddClubPrefs(teamId: number) {
    setClubPrefsPanel({ teamId, mode: "add", initial: DEFAULT_CLUB_PREFS });
  }

  function openEditClubPrefs(teamId: number) {
    setClubPrefsPanel({ teamId, mode: "edit", initial: DEFAULT_CLUB_PREFS });
    getClubNotificationPrefs(getOrCreateDeviceId(), teamId).then((prefs) => {
      setClubPrefsPanel((current) => (current?.teamId === teamId ? { ...current, initial: prefs } : current));
    });
  }

  function confirmClubPrefs(prefs: ClubNotificationPrefs) {
    if (!profile || !clubPrefsPanel) return;
    const { teamId, mode } = clubPrefsPanel;
    if (mode === "add") {
      // If a different club was previously set as "préféré", it stays in the
      // Matchs favorites list (the user favorited it there, not just here) —
      // only the newly-picked club gets added.
      updateOnboardingProfile(profile, { favoriteClubId: teamId });
      addFavoriteTeam(teamId, favoriteTeamIds);
      setClubSearch("");
    }
    // Close immediately — see confirmPlayerPrefs above for why this doesn't
    // wait on push subscription / the Supabase write.
    setClubPrefsPanel(null);
    ensurePushSubscription().then(() => saveClubNotificationPrefs(getOrCreateDeviceId(), teamId, prefs));
  }

  function clearClub() {
    if (!profile) return;
    if (profile.favoriteClubId) {
      removeFavoriteTeam(profile.favoriteClubId, favoriteTeamIds);
      deleteClubNotificationPrefs(getOrCreateDeviceId(), profile.favoriteClubId);
    }
    updateOnboardingProfile(profile, { favoriteClubId: null });
    setClubPrefsPanel(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Pays favori</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted">
          Adapte les couleurs de l&apos;app et l&apos;ordre du chat à ta nation — les 54 pays de la CAF sont
          disponibles.
        </p>

        {(() => {
          const current = COUNTRIES.find((country) => country.id === profile.countryId);
          if (!current) return null;
          return (
            <div className="mb-2.5 flex min-h-11 items-center gap-2.5 rounded-xl border border-accent bg-accent/10 px-2.5 py-2">
              <Image src={COUNTRY_LOGOS[current.id]} alt="" width={24} height={24} className="size-6 shrink-0 object-contain" unoptimized />
              <span className="flex-1 text-sm font-semibold text-foreground">{current.label}</span>
              <Check size={16} className="shrink-0 text-accent" aria-hidden />
            </div>
          );
        })()}

        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={countrySearch}
            onChange={(event) => setCountrySearch(event.target.value)}
            placeholder="Changer de pays…"
            className={cn(
              "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground",
              "placeholder:text-muted focus:border-accent focus:outline-none"
            )}
          />
        </div>

        {countrySearch.trim() && (
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {visibleCountries.map((country) => {
              const active = profile.countryId === country.id;
              return (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => {
                    setCountry(country.id);
                    setCountrySearch("");
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-11 flex-col items-center gap-1.5 rounded-xl border p-2.5",
                    "transition-[transform,border-color,background-color] duration-[var(--duration-fast)] active:scale-95",
                    active ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/30"
                  )}
                >
                  <Image src={COUNTRY_LOGOS[country.id]} alt="" width={24} height={24} className="size-6 object-contain" unoptimized />
                  <span className="text-[11px] font-semibold text-foreground">{country.label}</span>
                </button>
              );
            })}
            {visibleCountries.length === 0 && (
              <p className="col-span-3 py-2 text-center text-xs text-muted">Aucun pays trouvé.</p>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Joueurs préférés</h2>
          <span className="text-xs font-semibold tabular-nums text-accent">{selectedPlayers.length}/3</span>
        </div>

        <div className="mb-3 flex flex-col gap-1.5">
          {selectedPlayers.map((player) => {
            const playerId = String(player.id);
            return (
              <div key={player.id} className="flex flex-col gap-2">
                <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-accent bg-accent/10 px-2.5 py-2">
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
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => openEditPlayerPrefs(playerId)}
                    aria-label={`Gérer les notifications pour ${player.name}`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  >
                    <Bell size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePlayer(playerId)}
                    aria-label={`Retirer ${player.name}`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  >
                    <X size={15} aria-hidden />
                  </button>
                </div>
                {playerPrefsPanel?.playerId === playerId && playerPrefsPanel.mode === "edit" && (
                  <NotificationPrefsPanel
                    title={`Notifications — ${player.name}`}
                    options={PLAYER_NOTIFICATION_OPTIONS}
                    initialPrefs={playerPrefsPanel.initial}
                    onConfirm={confirmPlayerPrefs}
                    onCancel={() => setPlayerPrefsPanel(null)}
                    confirmLabel="Enregistrer"
                  />
                )}
              </div>
            );
          })}
          {selectedPlayers.length === 0 && <p className="text-sm text-muted">Aucun joueur sélectionné.</p>}
        </div>

        {selectedPlayers.length < 3 && (
          <div>
            {/* The icon is positioned relative to THIS wrapper, not the one
                also holding search results below — otherwise as results (and
                a notification-prefs panel) render and grow the block taller,
                top-1/2 recenters into the middle of the whole thing instead
                of staying pinned to the input row. */}
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
                placeholder="Ajouter un joueur…"
                className={cn(
                  "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground",
                  "placeholder:text-muted focus:border-accent focus:outline-none"
                )}
              />
            </div>
            {playerSearch.trim() && (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {playerResults.map((player) => {
                  const playerId = String(player.id);
                  return (
                    <div key={player.id} className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => openAddPlayerPrefs(playerId)}
                        className="flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-2 text-left transition-colors hover:border-accent/40"
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
                          </span>
                        </span>
                      </button>
                      {playerPrefsPanel?.playerId === playerId && playerPrefsPanel.mode === "add" && (
                        <NotificationPrefsPanel
                          title={`Notifications — ${player.name}`}
                          options={PLAYER_NOTIFICATION_OPTIONS}
                          initialPrefs={playerPrefsPanel.initial}
                          onConfirm={confirmPlayerPrefs}
                          onCancel={() => setPlayerPrefsPanel(null)}
                        />
                      )}
                    </div>
                  );
                })}
                {playerResults.length === 0 && <p className="py-2 text-center text-xs text-muted">Aucun joueur trouvé.</p>}
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Club préféré</h2>

        {favoriteClub ? (
          <div className="flex flex-col gap-2">
            <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-accent bg-accent/10 px-2.5 py-2">
              <Image src={favoriteClub.logo} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" unoptimized />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{favoriteClub.name}</span>
                <span className="block text-[11px] text-muted">{favoriteClub.leagueName}</span>
              </span>
              <button
                type="button"
                onClick={() => openEditClubPrefs(favoriteClub.id)}
                aria-label={`Gérer les notifications pour ${favoriteClub.name}`}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <Bell size={15} aria-hidden />
              </button>
              <button
                type="button"
                onClick={clearClub}
                aria-label={`Retirer ${favoriteClub.name}`}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <X size={15} aria-hidden />
              </button>
            </div>
            {clubPrefsPanel?.teamId === favoriteClub.id && clubPrefsPanel.mode === "edit" && (
              <NotificationPrefsPanel
                title={`Notifications — ${favoriteClub.name}`}
                options={CLUB_NOTIFICATION_OPTIONS}
                initialPrefs={clubPrefsPanel.initial}
                onConfirm={confirmClubPrefs}
                onCancel={() => setClubPrefsPanel(null)}
                confirmLabel="Enregistrer"
              />
            )}
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input
                value={clubSearch}
                onChange={(event) => setClubSearch(event.target.value)}
                placeholder="Chercher un club (Real Madrid, Bayern…)"
                className={cn(
                  "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground",
                  "placeholder:text-muted focus:border-accent focus:outline-none"
                )}
              />
            </div>
            {clubSearch.trim() && (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {clubResults.map((team) => (
                  <div key={team.id} className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => openAddClubPrefs(team.id)}
                      className="flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-2 text-left transition-colors hover:border-accent/40"
                    >
                      <Image src={team.logo} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" unoptimized />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{team.name}</span>
                        <span className="block text-[11px] text-muted">{team.leagueName}</span>
                      </span>
                    </button>
                    {clubPrefsPanel?.teamId === team.id && clubPrefsPanel.mode === "add" && (
                      <NotificationPrefsPanel
                        title={`Notifications — ${team.name}`}
                        options={CLUB_NOTIFICATION_OPTIONS}
                        initialPrefs={clubPrefsPanel.initial}
                        onConfirm={confirmClubPrefs}
                        onCancel={() => setClubPrefsPanel(null)}
                      />
                    )}
                  </div>
                ))}
                {clubResults.length === 0 && <p className="py-2 text-center text-xs text-muted">Aucun club trouvé.</p>}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
