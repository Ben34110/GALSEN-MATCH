"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Bell, ChevronDown, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTeamDirectory, searchTeams } from "@/lib/data/team-directory";
import { useFavoriteTeamIds, toggleFavoriteTeam } from "@/hooks/use-favorite-teams";
import { fetchTeamUpcomingMatches } from "@/app/(app)/live/actions";
import { MatchCard } from "@/components/live/match-card";
import { NotificationPrefsPanel, type NotificationOption } from "@/components/notifications/notification-prefs-panel";
import { ensurePushSubscription } from "@/hooks/use-push-subscription";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { deleteClubNotificationPrefs, getClubNotificationPrefs, saveClubNotificationPrefs } from "@/app/actions/notifications";
import { DEFAULT_CLUB_PREFS, type ClubNotificationPrefs } from "@/lib/notification-prefs";
import type { Match } from "@/types";

// A team id absent from this map means "not fetched yet" — rendered as
// loading. Present-but-"error" or an array are the two settled states.
type MatchesState = Record<number, Match[] | "error">;

// Only the next 3 matches per club by default — a favorited club with a busy
// fixture list (cup + league + friendlies) shouldn't push every other
// section off screen; "Voir plus" reveals the rest on demand.
const DEFAULT_VISIBLE_MATCHES = 3;

const CLUB_NOTIFICATION_OPTIONS: NotificationOption<ClubNotificationPrefs>[] = [
  { key: "notifyLineup", label: "Compo annoncée" },
  { key: "notifyGoals", label: "Chaque but" },
  { key: "notifyKickoff", label: "Coup d'envoi" },
  { key: "notifyFulltime", label: "Fin du match" },
];

export function FavoritesPanel() {
  const teams = useMemo(() => getTeamDirectory(), []);
  const favoriteIds = useFavoriteTeamIds();
  const [search, setSearch] = useState("");
  const [matchesByTeam, setMatchesByTeam] = useState<MatchesState>({});
  const [expandedTeamIds, setExpandedTeamIds] = useState<number[]>([]);
  // The team currently showing the "choose your notifications" panel — set
  // when adding a new favorite (confirming = favorites it) or editing an
  // existing one's prefs (confirming just updates them).
  const [prefsPanel, setPrefsPanel] = useState<{ teamId: number; mode: "add" | "edit"; initial: ClubNotificationPrefs } | null>(
    null
  );

  const results = useMemo(() => (search.trim() ? searchTeams(teams, search).slice(0, 30) : []), [teams, search]);
  const favoriteTeams = useMemo(
    () => favoriteIds.map((id) => teams.find((team) => team.id === id)).filter((team) => team !== undefined),
    [teams, favoriteIds]
  );

  useEffect(() => {
    for (const id of favoriteIds) {
      if (matchesByTeam[id] !== undefined) continue;
      fetchTeamUpcomingMatches(id)
        .then((matches) => setMatchesByTeam((current) => ({ ...current, [id]: matches })))
        .catch(() => setMatchesByTeam((current) => ({ ...current, [id]: "error" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the favorite id set itself changes
  }, [favoriteIds.join(",")]);

  function openAddPrefs(teamId: number) {
    setPrefsPanel({ teamId, mode: "add", initial: DEFAULT_CLUB_PREFS });
  }

  function openEditPrefs(teamId: number) {
    setPrefsPanel({ teamId, mode: "edit", initial: DEFAULT_CLUB_PREFS });
    getClubNotificationPrefs(getOrCreateDeviceId(), teamId).then((prefs) => {
      setPrefsPanel((current) => (current?.teamId === teamId ? { ...current, initial: prefs } : current));
    });
  }

  function confirmPrefs(prefs: ClubNotificationPrefs) {
    if (!prefsPanel) return;
    const { teamId, mode } = prefsPanel;
    if (mode === "add") toggleFavoriteTeam(teamId, favoriteIds);
    // Close immediately — the favorite itself is already saved (localStorage,
    // synchronous). Push subscription + the Supabase write are best-effort
    // background work; waiting on them here used to mean that if
    // ensurePushSubscription() ever hung (e.g. the service worker still
    // installing on a first visit), the panel would sit open forever,
    // looking exactly like "nothing got saved" even though it had.
    setPrefsPanel(null);
    ensurePushSubscription().then(() => saveClubNotificationPrefs(getOrCreateDeviceId(), teamId, prefs));
  }

  function removeFavorite(teamId: number) {
    toggleFavoriteTeam(teamId, favoriteIds);
    deleteClubNotificationPrefs(getOrCreateDeviceId(), teamId);
    if (prefsPanel?.teamId === teamId) setPrefsPanel(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Chercher un club (Real Madrid, Bayern…)"
            className={cn(
              "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground",
              "placeholder:text-muted focus:border-accent focus:outline-none"
            )}
          />
        </div>

        {search.trim() && (
          <div className="mt-2 flex flex-col gap-1.5">
            {results.map((team) => {
              const isFavorite = favoriteIds.includes(team.id);
              return (
                <div key={team.id} className="flex flex-col gap-2">
                  <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-2">
                    <Image src={team.logo} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" unoptimized />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{team.name}</span>
                      <span className="block text-[11px] text-muted">{team.leagueName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => (isFavorite ? removeFavorite(team.id) : openAddPrefs(team.id))}
                      aria-pressed={isFavorite}
                      aria-label={isFavorite ? `Retirer ${team.name} des favoris` : `Ajouter ${team.name} aux favoris`}
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-[var(--duration-fast)] active:scale-90",
                        isFavorite ? "bg-accent-2 text-foreground" : "bg-surface-2 text-muted hover:text-foreground"
                      )}
                    >
                      <Star size={16} fill={isFavorite ? "currentColor" : "none"} aria-hidden />
                    </button>
                  </div>
                  {prefsPanel?.teamId === team.id && prefsPanel.mode === "add" && (
                    <NotificationPrefsPanel
                      title={`Notifications — ${team.name}`}
                      options={CLUB_NOTIFICATION_OPTIONS}
                      initialPrefs={prefsPanel.initial}
                      onConfirm={confirmPrefs}
                      onCancel={() => setPrefsPanel(null)}
                    />
                  )}
                </div>
              );
            })}
            {results.length === 0 && <p className="py-4 text-center text-sm text-muted">Aucun club trouvé.</p>}
          </div>
        )}
      </div>

      {favoriteTeams.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          Cherche un club ci-dessus et ajoute-le en favori pour suivre tous ses prochains matchs.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {favoriteTeams.map((team) => {
            const state = matchesByTeam[team.id];
            return (
              <section key={team.id}>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
                    <Image src={team.logo} alt="" width={18} height={18} className="size-[18px] object-contain" unoptimized />
                    {team.name}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditPrefs(team.id)}
                      aria-label={`Gérer les notifications pour ${team.name}`}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-foreground"
                    >
                      <Bell size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFavorite(team.id)}
                      aria-label={`Retirer ${team.name} des favoris`}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-accent-2 transition-transform active:scale-90"
                    >
                      <Star size={16} fill="currentColor" aria-hidden />
                    </button>
                  </div>
                </div>

                {prefsPanel?.teamId === team.id && prefsPanel.mode === "edit" && (
                  <div className="mb-2.5">
                    <NotificationPrefsPanel
                      title={`Notifications — ${team.name}`}
                      options={CLUB_NOTIFICATION_OPTIONS}
                      initialPrefs={prefsPanel.initial}
                      onConfirm={confirmPrefs}
                      onCancel={() => setPrefsPanel(null)}
                      confirmLabel="Enregistrer"
                    />
                  </div>
                )}

                {state === undefined && <p className="py-4 text-center text-sm text-muted">Chargement…</p>}
                {state === "error" && (
                  <p className="py-4 text-center text-sm text-muted">Matchs indisponibles pour l&apos;instant.</p>
                )}
                {Array.isArray(state) &&
                  (state.length > 0 ? (
                    (() => {
                      const isExpanded = expandedTeamIds.includes(team.id);
                      const visible = isExpanded ? state : state.slice(0, DEFAULT_VISIBLE_MATCHES);
                      const hiddenCount = state.length - visible.length;
                      return (
                        <>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {visible.map((match) => (
                              <MatchCard key={match.id} match={match} />
                            ))}
                          </div>
                          {state.length > DEFAULT_VISIBLE_MATCHES && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTeamIds((current) =>
                                  isExpanded ? current.filter((id) => id !== team.id) : [...current, team.id]
                                )
                              }
                              className="mt-2.5 flex min-h-9 w-full items-center justify-center gap-1 rounded-xl border border-border bg-surface text-xs font-semibold text-muted transition-colors hover:text-foreground"
                            >
                              {isExpanded ? "Voir moins" : `Voir ${hiddenCount} match${hiddenCount > 1 ? "s" : ""} de plus`}
                              <ChevronDown size={14} className={cn("transition-transform", isExpanded && "rotate-180")} aria-hidden />
                            </button>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <p className="py-4 text-center text-sm text-muted">Aucun match à venir programmé.</p>
                  ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
