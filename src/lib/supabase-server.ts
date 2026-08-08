import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-only, session-aware — distinct from lib/supabase.ts's
// getSupabaseAdmin(), which is service-role and identity-blind. This one
// exists purely to answer "who's signed in right now" (see
// getAuthenticatedUserId() in lib/auth.ts) via the request's cookies; it is
// NEVER used to read/write app data — every table read/write still goes
// through the service-role client, unchanged. Needs
// NEXT_PUBLIC_SUPABASE_ANON_KEY (not provisioned before accounts existed —
// only the service-role key was needed when every write trusted a
// client-supplied device_id).
export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render (not a Server Action or
          // Route Handler) — cookies() is read-only there. Harmless: the
          // middleware (see middleware.ts) already refreshes the session
          // cookie on every request, so a render-time write is redundant,
          // not load-bearing.
        }
      },
    },
  });
}
