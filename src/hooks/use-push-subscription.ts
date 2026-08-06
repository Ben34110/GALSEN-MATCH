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
export async function ensurePushSubscription(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return false;

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

  const deviceId = getOrCreateDeviceId();
  const result = await saveDeviceSubscription(deviceId, {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
  return result.ok;
}
