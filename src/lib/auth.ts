import { getSupabaseServerClient } from "@/lib/supabase-server";

// Server-only. Returns the signed-in user's id, or null for a guest (no
// session) or when Supabase Auth isn't configured yet
// (NEXT_PUBLIC_SUPABASE_ANON_KEY missing). Called from every Server Action
// that writes device-scoped data (see app/actions/*.ts) — when a session
// exists it takes priority over the client-supplied deviceId parameter,
// which remains the only identity guests have.
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Which identity a device-scoped Server Action should read/write by, this
// call. Signed-in wins when present — the account's data should converge
// onto one row across every device that account signs into, not fork per
// browser the way pure device_id rows do. Every write still includes
// device_id regardless (columns are `not null`, and it's a useful "last
// seen from" breadcrumb even once user_id is the real identity) — only the
// *matching*/conflict-resolution column changes.
export interface Actor {
  userId: string | null;
  matchColumn: "user_id" | "device_id";
  matchValue: string;
}

export async function resolveActor(deviceId: string): Promise<Actor> {
  const userId = await getAuthenticatedUserId();
  return userId ? { userId, matchColumn: "user_id", matchValue: userId } : { userId: null, matchColumn: "device_id", matchValue: deviceId };
}
