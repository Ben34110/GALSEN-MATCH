import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only — NEVER import this from a "use client" component.
// SUPABASE_SERVICE_ROLE_KEY bypasses row-level security entirely, which is
// intentional here (see supabase/schema.sql: no client ever queries app
// data through Supabase directly, every read/write goes through a Server
// Action or API route). The caller's identity is either a device id the
// client sends itself (guests) or, when a session exists, the verified
// signed-in user id (see lib/auth.ts's getAuthenticatedUserId) — this
// admin client is identity-blind either way, it just executes whichever
// the caller resolved.
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
