"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveActor } from "@/lib/auth";

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

  await supabase.from("device_activity").upsert(
    {
      device_id: deviceId,
      ...(actor.userId ? { user_id: actor.userId } : {}),
      last_active_at: new Date().toISOString(),
      last_reengagement_sent_at: null,
    },
    { onConflict: actor.matchColumn }
  );
}
