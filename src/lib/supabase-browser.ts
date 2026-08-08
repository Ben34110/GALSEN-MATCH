"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser-only auth client — the sign-up/sign-in/Google/sign-out buttons are
// the only things in this app that call Supabase directly from the client
// (see supabase-server.ts's comment: everything else still goes through a
// Server Action using the service-role key). Uses the anon key, which is
// safe to expose — Supabase Auth's own endpoints are what enforce identity,
// not RLS policies on this app's tables (none exist, on purpose).
//
// Returns null when NEXT_PUBLIC_SUPABASE_ANON_KEY isn't set yet (accounts
// not configured) — every caller must treat that as "no session, guest
// mode," never throw. Guest mode must keep working with zero account setup
// at all, same "unconfigured means off" convention as getSupabaseAdmin().
let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  cached = createBrowserClient(url, anonKey);
  return cached;
}
