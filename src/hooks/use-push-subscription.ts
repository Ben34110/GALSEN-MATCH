"use client";

import { getOrCreateDeviceId } from "@/lib/device-id";
import { saveDeviceSubscription } from "@/app/actions/notifications";

// Web Push application server keys are base64url — the Push API wants a raw
// Uint8Array, hence this conversion (there's no built-in for it).
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export type PushSubscriptionResult =
  | { ok: true }
  // "unsupported": the Push API doesn't exist in this context at all — on
  // iOS this is the #1 real-world cause and isn't fixable from Settings:
  // Safari only exposes Web Push to a PWA that's been "Add to Home
  // Screen"-installed, never a regular browser tab, no matter what the
  // phone's notification permission says.
  | { ok: false; reason: "unsupported" }
  // The in-app permission prompt itself was denied or dismissed — distinct
  // from the OS-level "Notifications" toggle for the app, which is a
  // separate, later gate that only matters once this one has already said
  // yes once.
  | { ok: false; reason: "permission-denied" }
  | { ok: false; reason: "not-configured" }
  | { ok: false; reason: "subscribe-failed" }
  | { ok: false; reason: "save-failed" };

// One concrete, actionable line per failure reason, shared by every "enable
// notifications" UI (Profil's per-country toggle, onboarding's opt-in
// card) — a generic "check your settings" message was useless for the #1
// real case, iOS PWA users whose phone-level "Notifications" toggle is
// already on but who opened this from a regular Safari tab: Web Push is
// only reachable from the installed (Add to Home Screen) app on iOS, no
// matter what Settings says.
export const PUSH_FAILURE_MESSAGES: Record<Exclude<PushSubscriptionResult, { ok: true }>["reason"], string> = {
  unsupported:
    "Ce navigateur ne supporte pas les notifications ici. Sur iPhone : ouvre Galsen Match depuis l'icône ajoutée à l'écran d'accueil (pas depuis Safari) — les notifications web ne marchent que depuis l'app installée.",
  "permission-denied":
    "La demande d'autorisation a été refusée ou ignorée. Va dans les réglages de notifications de ton téléphone pour Galsen Match, active-les, puis réessaie.",
  "not-configured": "Les notifications ne sont pas encore configurées côté serveur — réessaie plus tard.",
  "subscribe-failed": "Un problème technique a empêché l'activation. Réessaie dans quelques secondes.",
  "save-failed": "Impossible d'enregistrer ta préférence — vérifie ta connexion et réessaie.",
};

// Requests Notification permission (if not already decided) and makes sure
// this browser has an active push subscription saved server-side. Called
// right before saving notification preferences for a newly-favorited club
// or player (see components/live/notification-prefs.tsx) — there's no
// separate "enable notifications" step, the first favorite with any
// preference turned on is what triggers the permission prompt.
//
// The service worker only registers in production (see
// components/pwa/service-worker-register.tsx, to avoid fighting Next's dev
// hot-reload), so this can only succeed on a deployed build, not `next dev`.
export async function ensurePushSubscription(): Promise<PushSubscriptionResult> {
  if (typeof window === "undefined") return { ok: false, reason: "unsupported" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return { ok: false, reason: "unsupported" };

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return { ok: false, reason: "not-configured" };

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "permission-denied" };

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return { ok: false, reason: "subscribe-failed" };

    const deviceId = getOrCreateDeviceId();
    const result = await saveDeviceSubscription(deviceId, {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
    return result.ok ? { ok: true } : { ok: false, reason: "save-failed" };
  } catch {
    return { ok: false, reason: "subscribe-failed" };
  }
}
