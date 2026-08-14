"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveActor } from "@/lib/auth";
import { claimOrVerifyDeviceSecret } from "@/lib/device-secret";

// Called once per app mount by components/pwa/activity-heartbeat.tsx —
// the only signal this app has for "this device is actually using the
// app right now" (there's no session/analytics pipeline). Powers the
// re-engagement push in api/cron/poll/route.ts: last_reengagement_sent_at
// is reset to null on every check-in, so a device that comes back and
// later goes quiet again becomes eligible for another nudge instead of
// being permanently excluded after the very first one.
export async function recordDeviceActivity(deviceId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const actor = await resolveActor(deviceId);

  // Also establishes this device_id's ownership claim (see
  // lib/device-secret.ts) well before a sign-in could ever need to verify
  // it — every real device passes through here on its very first app open.
  // Result ignored here: a heartbeat has nothing actionable to do with a
  // "mismatch" (linkDeviceData is the one place that gates on it).
  await Promise.all([
    supabase.from("device_activity").upsert(
      {
        device_id: deviceId,
        ...(actor.userId ? { user_id: actor.userId } : {}),
        last_active_at: new Date().toISOString(),
        last_reengagement_sent_at: null,
      },
      { onConflict: actor.matchColumn }
    ),
    claimOrVerifyDeviceSecret(deviceId),
  ]);
}
