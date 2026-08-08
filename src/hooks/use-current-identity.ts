"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export interface CurrentIdentity {
  deviceId: string | null;
  userId: string | null;
}

// "Who am I, for the purpose of highlighting my own row/message in an
// already-fetched list" — never used for data access (that stays
// server-side), just this client-only comparison. userId is null for a
// guest (no session) or when accounts aren't configured; deviceId resolves
// once on mount same as everywhere else in this app.
export function useCurrentIdentity(): CurrentIdentity {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(getOrCreateDeviceId()).then(setDeviceId);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => setUserId(data.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => setUserId(session?.user.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return { deviceId, userId };
}

// Shared "is this row mine" check — userId takes priority when the row has
// one (a signed-in account's data), falling back to deviceId for guest rows.
export function isCurrentIdentity(row: { deviceId: string; userId: string | null }, current: CurrentIdentity): boolean {
  return row.userId ? row.userId === current.userId : row.deviceId === current.deviceId;
}
