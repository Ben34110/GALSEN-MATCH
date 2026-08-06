// Types + defaults shared between the "use server" actions file
// (app/actions/notifications.ts — which can only export async functions,
// nothing else) and the client components that need a default value to
// initialize NotificationPrefsPanel with before any saved prefs are loaded.

// The index signature is what lets these satisfy NotificationPrefsPanel's
// generic Record<string, boolean> constraint (see
// components/notifications/notification-prefs-panel.tsx) — every field is
// already a boolean, so it's a no-op for the concrete shape.
export interface ClubNotificationPrefs {
  [key: string]: boolean;
  notifyLineup: boolean;
  notifyGoals: boolean;
  notifyKickoff: boolean;
  notifyFulltime: boolean;
}

export const DEFAULT_CLUB_PREFS: ClubNotificationPrefs = {
  notifyLineup: true,
  notifyGoals: true,
  notifyKickoff: true,
  notifyFulltime: true,
};

export interface PlayerNotificationPrefs {
  [key: string]: boolean;
  notifyLineup: boolean;
  notifyGoal: boolean;
  notifyAssist: boolean;
  notifyCard: boolean;
  notifyRating: boolean;
}

export const DEFAULT_PLAYER_PREFS: PlayerNotificationPrefs = {
  notifyLineup: true,
  notifyGoal: true,
  notifyAssist: true,
  notifyCard: true,
  notifyRating: true,
};
