"use client";

import { useEffect } from "react";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { recordDeviceActivity } from "@/app/actions/device-activity";

// Mounted once app-wide (see app/layout.tsx), same pattern as
// service-worker-register.tsx/native-bridge.tsx — records "this device
// opened the app" once per session for the re-engagement push (see
// api/cron/poll/route.ts). No loading UI, no retry: a missed heartbeat
// just means this particular session doesn't reset the inactivity clock,
// not a broken experience.
export function ActivityHeartbeat() {
  useEffect(() => {
    recordDeviceActivity(getOrCreateDeviceId()).catch(() => {});
  }, []);

  return null;
}
