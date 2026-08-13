"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { PushNotifications } from "@capacitor/push-notifications";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { saveApnsToken } from "@/app/actions/notifications";

// Everything here only ever runs inside the Capacitor-wrapped iOS app —
// Capacitor.isNativePlatform() is false for every browser/PWA visitor,
// including this exact same bundle (see docs/ios-app.md: one Next.js
// deployment serves both, "remote URL" mode). Mounted once app-wide (see
// app/layout.tsx), same pattern as components/pwa/service-worker-
// register.tsx for the web push-registration equivalent.
export function NativeBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    // Dismisses the native launch screen now that the real UI has mounted
    // — capacitor.config.ts sets launchAutoHide:false specifically so
    // nothing else ever hides it (see that file's comment: a fixed timer
    // can't know when a *remote* page over the network is actually ready).
    SplashScreen.hide().catch(() => {});

    let cancelled = false;
    const handles: Promise<{ remove: () => void }>[] = [];

    async function registerPush() {
      const current = await PushNotifications.checkPermissions();
      let state = current.receive;
      if (state === "prompt" || state === "prompt-with-rationale") {
        state = (await PushNotifications.requestPermissions()).receive;
      }
      if (state !== "granted" || cancelled) return;
      await PushNotifications.register();
    }
    registerPush().catch(() => {});

    handles.push(
      PushNotifications.addListener("registration", (token) => {
        saveApnsToken(getOrCreateDeviceId(), token.value).catch(() => {});
      })
    );

    // Tapping a delivered notification (app backgrounded or fully closed)
    // — deep-links into the same `url` every notification already carries
    // (see lib/push-dispatch.ts/lib/apns.ts), routed through Next's
    // client-side router instead of a full reload.
    handles.push(
      PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        const url = (action.notification.data as { url?: string } | undefined)?.url;
        if (typeof url === "string") router.push(url);
      })
    );

    return () => {
      cancelled = true;
      for (const handle of handles) handle.then((h) => h.remove()).catch(() => {});
    };
  }, [router]);

  return null;
}
