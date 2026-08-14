import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

// Server-only — reads/writes an httpOnly cookie, never import this from a
// "use client" component (next/headers' cookies() only works inside a
// Server Component/Action/Route Handler anyway).
//
// device_id (lib/device-id.ts) alone isn't proof that a caller actually
// owns that device: it's broadcast to every other participant in a chat
// room a device has ever posted in (chat_messages.device_id, read back by
// app/actions/chat-profile.ts). This cookie is the missing half — a random
// value the browser never exposes to page JavaScript (httpOnly) and never
// sends to any other client, only to this app's own server on every
// request. app/actions/link-device-data.ts checks it against the
// device_secrets table (supabase/schema.sql) before letting a sign-in
// re-key a device_id's rows onto an account.
const COOKIE_NAME = "galsen-match-device-secret";
// Same "effectively permanent" lifetime as device_id itself (localStorage,
// no expiry) — this cookie exists to outlive a session, not scope one.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 5;

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

// Reads the existing cookie, or mints and sets a new one — always returns a
// value, since a first-time visitor needs one established before their
// device_id can ever be verifiably claimed. Must run inside a Server Action
// or Route Handler; cookies().set() is a no-op during a Server Component
// render (see supabase-server.ts's own comment on the same constraint).
async function getOrCreateSecretHash(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return hashSecret(existing);

  const secret = randomBytes(32).toString("hex");
  store.set(COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return hashSecret(secret);
}

// Called once per app mount (see app/actions/device-activity.ts's
// recordDeviceActivity) to establish/reconfirm a device_id's claim well
// before any sign-in could ever need to verify it, and again inline from
// linkDeviceData as a fallback. First call for a given device_id claims it
// (inserts the row); every later call just compares. "mismatch" means the
// caller's own browser cookie doesn't match whoever claimed this device_id
// first — the one case linkDeviceData actually needs to act on.
export async function claimOrVerifyDeviceSecret(deviceId: string): Promise<"ok" | "mismatch"> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return "ok"; // Supabase unconfigured — same "feature is off" fallback as every other action in this app

  const hash = await getOrCreateSecretHash();
  const { data: existing } = await supabase.from("device_secrets").select("secret_hash").eq("device_id", deviceId).maybeSingle();

  if (!existing) {
    await supabase.from("device_secrets").insert({ device_id: deviceId, secret_hash: hash });
    return "ok";
  }
  return existing.secret_hash === hash ? "ok" : "mismatch";
}
