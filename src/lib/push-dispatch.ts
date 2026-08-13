import webpush from "web-push";
import { sendApnsNotification } from "@/lib/apns";

// Shared by cron/poll/route.ts and cron/fetch-news/route.ts — both queue up
// a list of {target, title, body, url, icon} messages and then need to fan
// each one out to whichever channel(s) that target actually has: a browser/
// PWA subscription (web-push), a Capacitor app install (APNs), or both if
// someone has both installed. One place for this instead of two near-
// identical send loops.

export interface WebPushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushMessage {
  title: string;
  body: string;
  url: string;
  icon?: string; // small avatar-style image (web-push/sw.js only, see its own comment)
  image?: string; // larger hero image below title/body (web-push/sw.js only, same caveat)
}

export interface DispatchResult {
  sent: boolean;
  // A target's web-push subscription and/or APNs token turned out to be
  // permanently dead (uninstalled, revoked) — the caller deletes exactly
  // the channel(s) that came back stale, not the whole target (a device
  // could still be reachable on the other channel).
  staleWebPush: boolean;
  staleApns: boolean;
}

export async function dispatchToTarget(
  webSub: WebPushSubscriptionRow | undefined,
  apnsToken: string | undefined,
  message: PushMessage
): Promise<DispatchResult> {
  let sent = false;
  let staleWebPush = false;
  let staleApns = false;

  if (webSub) {
    try {
      await webpush.sendNotification(
        { endpoint: webSub.endpoint, keys: { p256dh: webSub.p256dh, auth: webSub.auth } },
        JSON.stringify({
          title: message.title,
          body: message.body,
          url: message.url,
          icon: message.icon,
          image: message.image,
        })
      );
      sent = true;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) staleWebPush = true;
    }
  }

  if (apnsToken) {
    const result = await sendApnsNotification(apnsToken, message);
    if (result.ok) sent = true;
    else if (result.stale) staleApns = true;
  }

  return { sent, staleWebPush, staleApns };
}
