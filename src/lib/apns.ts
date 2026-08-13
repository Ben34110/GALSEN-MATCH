import { createSign } from "node:crypto";
import http2 from "node:http2";

// Apple Push Notification service — the native-app equivalent of the
// web-push pipeline already used everywhere else (see cron/poll/route.ts,
// cron/fetch-news/route.ts). Web Push (VAPID) simply doesn't reach the
// Capacitor-wrapped app: Apple only allows the Push API from an actual
// Safari-installed PWA, never a WKWebView embedded in a third-party app
// (see docs/ios-app.md) — this is the separate transport that does.
//
// Gracefully no-configured (never throws) when the 4 env vars below aren't
// set, same pattern as apiFootballGet's missing-key check and webpush's
// VAPID check — lets both cron routes call this unconditionally instead of
// every call site needing its own "is this even configured" branch.

function requiredEnv(): { keyId: string; teamId: string; topic: string; privateKey: string } | null {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const topic = process.env.APNS_TOPIC; // the app's bundle id, e.g. com.afrolive.app
  // The .p8 key file's contents, PEM-armored — stored as an env var like
  // VAPID_PRIVATE_KEY already is. Vercel's env var UI accepts multi-line
  // values directly (the literal file contents, "\n"s and all), no
  // escaping needed on that end.
  const privateKey = process.env.APNS_PRIVATE_KEY;
  if (!keyId || !teamId || !topic || !privateKey) return null;
  return { keyId, teamId, topic, privateKey };
}

function base64url(input: Buffer | string): string {
  return (typeof input === "string" ? Buffer.from(input) : input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// APNs provider tokens (JWT, ES256) are valid up to 1h and Apple asks
// providers not to mint a fresh one per request — cached at module scope
// and reused until it's within 5 minutes of expiring. Serverless functions
// don't guarantee this survives between invocations (a cold start clears
// it), but it still cuts token generation way down for the common case of
// many notifications sent within the same invocation (a busy poll run).
let cachedToken: { jwt: string; expiresAt: number } | null = null;

function getProviderToken(env: NonNullable<ReturnType<typeof requiredEnv>>): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - now > 5 * 60) return cachedToken.jwt;

  const header = base64url(JSON.stringify({ alg: "ES256", kid: env.keyId }));
  const claims = base64url(JSON.stringify({ iss: env.teamId, iat: now }));
  const signingInput = `${header}.${claims}`;

  // `dsaEncoding: "ieee-p1363"` is what makes this a valid JOSE/JWT ES256
  // signature directly — Node's default ECDSA output is ASN.1/DER-encoded,
  // which JWT does NOT use; without this option the token would verify as
  // cryptographically valid but be rejected by Apple as malformed.
  const signature = createSign("SHA256")
    .update(signingInput)
    .sign({ key: env.privateKey, dsaEncoding: "ieee-p1363" });

  const jwt = `${signingInput}.${base64url(signature)}`;
  cachedToken = { jwt, expiresAt: now + 55 * 60 };
  return jwt;
}

export interface ApnsMessage {
  title: string;
  body: string;
  url: string;
  icon?: string;
}

export type ApnsSendResult =
  | { ok: true }
  | { ok: false; notConfigured: true; stale?: never }
  // `stale`: Apple reports this exact device token as permanently invalid
  // (uninstalled, or a stale token from a previous install) — the caller
  // should stop sending to it (see cron/poll/route.ts's cleanup, mirroring
  // the existing web-push 404/410 handling).
  | { ok: false; notConfigured?: never; stale: boolean; error: string };

// One HTTP/2 POST per notification — APNs requires HTTP/2 specifically
// (no HTTP/1.1 fallback), hence node:http2 directly rather than a plain
// fetch(). A fresh connection per call is deliberately simple (not pooled):
// this only ever runs from short-lived cron invocations sending at most a
// few dozen notifications per run, not a persistent server process where
// connection reuse would matter.
export async function sendApnsNotification(deviceToken: string, message: ApnsMessage): Promise<ApnsSendResult> {
  const env = requiredEnv();
  if (!env) return { ok: false, notConfigured: true };

  const jwt = getProviderToken(env);
  // `icon` rides along in the payload but iOS won't actually display it —
  // showing a custom image on a native push needs a Notification Service
  // Extension (a second, separate app target that downloads and attaches
  // the media before the system displays the alert), not implemented here.
  // Harmless to send regardless: unrecognized payload keys are ignored.
  const payload = JSON.stringify({
    aps: { alert: { title: message.title, body: message.body }, sound: "default" },
    url: message.url,
    icon: message.icon,
  });

  return new Promise((resolve) => {
    const client = http2.connect("https://api.push.apple.com");
    client.on("error", (err) => {
      client.close();
      resolve({ ok: false, stale: false, error: err.message });
    });

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": env.topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });

    let status = 0;
    let responseBody = "";
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.on("data", (chunk) => {
      responseBody += chunk;
    });
    req.on("end", () => {
      client.close();
      if (status === 200) {
        resolve({ ok: true });
        return;
      }
      // BadDeviceToken / Unregistered are Apple's terms for "this token
      // will never work again" — the same class of failure web-push's
      // 404/410 represents for a browser subscription.
      let reason = "unknown";
      try {
        reason = (JSON.parse(responseBody) as { reason?: string }).reason ?? reason;
      } catch {
        // non-JSON body — keep "unknown"
      }
      const stale = reason === "BadDeviceToken" || reason === "Unregistered" || reason === "DeviceTokenNotForTopic";
      resolve({ ok: false, stale, error: reason });
    });
    req.on("error", (err) => {
      client.close();
      resolve({ ok: false, stale: false, error: err.message });
    });
    req.end(payload);
  });
}
