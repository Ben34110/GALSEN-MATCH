"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { updateOnboardingProfile } from "@/lib/onboarding";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { ensurePushSubscription } from "@/hooks/use-push-subscription";
import { NotificationPrefsPanel, type NotificationOption } from "@/components/notifications/notification-prefs-panel";
import { getPlayerNotificationPrefs, savePlayerNotificationPrefs, deletePlayerNotificationPrefs } from "@/app/actions/notifications";
import { DEFAULT_PLAYER_PREFS, type PlayerNotificationPrefs } from "@/lib/notification-prefs";

// Same "3 favorite players" list Profil's preferences editor already
// manages (profile.playerIds, synced to Supabase's user_profiles.player_ids
// and shown on the public chat-profile badge) — reused rather than a
// second, parallel favorites concept, so a player favorited from their own
// profile page shows up in "mes joueurs" on Profil too, and vice versa.
const MAX_FAVORITE_PLAYERS = 3;

export function PlayerFavoriteButton({ playerId, playerName }: { playerId: number; playerName: string }) {
  // search.player.favorite: this button's own copy. profil.notificationPanel:
  // the exact same option labels Profil's preferences editor already uses
  // for this same table (favorite_player_notifications) — reused rather
  // than duplicated, so "lineup"/"goal"/etc. only has one translation to
  // keep in sync across locales.
  const t = useTranslations("search.player.favorite");
  const tPanel = useTranslations("profil.notificationPanel");
  const profile = useOnboardingProfile();
  const [open, setOpen] = useState(false);
  const [initialPrefs, setInitialPrefs] = useState<PlayerNotificationPrefs>(DEFAULT_PLAYER_PREFS);

  // Onboarding not completed yet (no device-local profile) — nothing to
  // favorite into, same guard preferences-editor.tsx uses before reading
  // profile.playerIds.
  if (!profile) return null;

  const idStr = String(playerId);
  const isFavorite = profile.playerIds.includes(idStr);
  const atLimit = !isFavorite && profile.playerIds.length >= MAX_FAVORITE_PLAYERS;

  const options: NotificationOption<PlayerNotificationPrefs>[] = [
    { key: "notifyLineup", label: tPanel("player.lineup") },
    { key: "notifyGoal", label: tPanel("player.goal") },
    { key: "notifyAssist", label: tPanel("player.assist") },
    { key: "notifyCard", label: tPanel("player.card") },
    { key: "notifyRating", label: tPanel("player.rating") },
  ];

  function openPanel() {
    setInitialPrefs(DEFAULT_PLAYER_PREFS);
    if (isFavorite) {
      getPlayerNotificationPrefs(getOrCreateDeviceId(), playerId).then((prefs) => setInitialPrefs(prefs));
    }
    setOpen(true);
  }

  function confirm(prefs: PlayerNotificationPrefs) {
    if (!profile) return;
    if (!isFavorite) {
      updateOnboardingProfile(profile, { playerIds: [...profile.playerIds, idStr] });
    }
    // Close immediately — the favorite itself (localStorage) is already
    // saved synchronously at this point; the push subscription + Supabase
    // write are best-effort background work, same reasoning as
    // preferences-editor.tsx's confirmPlayerPrefs.
    setOpen(false);
    ensurePushSubscription().then(() => savePlayerNotificationPrefs(getOrCreateDeviceId(), playerId, prefs));
  }

  function removeFavorite() {
    if (!profile) return;
    updateOnboardingProfile(profile, { playerIds: profile.playerIds.filter((id) => id !== idStr) });
    deletePlayerNotificationPrefs(getOrCreateDeviceId(), playerId);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? t("manage", { name: playerName }) : t("add", { name: playerName })}
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-[var(--duration-fast)] active:scale-90",
          isFavorite ? "bg-accent-2 text-foreground" : "bg-surface-2 text-muted hover:text-foreground"
        )}
      >
        <Bell size={16} fill={isFavorite ? "currentColor" : "none"} aria-hidden />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          {/* stopPropagation: a tap inside the popup must not also count as
              the backdrop tap that closes it. */}
          <div className="w-full max-w-sm" onClick={(event) => event.stopPropagation()}>
            {atLimit ? (
              <div className="rounded-xl border border-border bg-surface p-4 text-center">
                <p className="text-sm text-foreground">{t("limitReached")}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-3 min-h-9 w-full rounded-lg border border-border bg-surface text-xs font-semibold text-muted transition-colors hover:text-foreground"
                >
                  {t("close")}
                </button>
              </div>
            ) : (
              <>
                <NotificationPrefsPanel
                  title={t("panelTitle", { name: playerName })}
                  options={options}
                  initialPrefs={initialPrefs}
                  onConfirm={confirm}
                  onCancel={() => setOpen(false)}
                  confirmLabel={isFavorite ? tPanel("save") : undefined}
                />
                {isFavorite && (
                  <button
                    type="button"
                    onClick={removeFavorite}
                    className="mt-2 min-h-9 w-full rounded-lg border border-border bg-surface text-xs font-semibold text-muted transition-colors hover:text-foreground"
                  >
                    {t("removeFavorite")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
