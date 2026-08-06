import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only — NEVER import this from a "use client" component.
// SUPABASE_SERVICE_ROLE_KEY bypasses row-level security entirely, which is
// intentional here (see supabase/schema.sql: no client ever talks to
// Supabase directly, every read/write goes through a Server Action or API
// route that already trusts the caller — a device id sent by the client
// itself, no login system exists in this app).
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
