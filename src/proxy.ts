import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// First proxy in this repo — exists solely to keep a signed-in visitor's
// Supabase Auth session cookie fresh on every request (the standard
// requirement for @supabase/ssr in Next.js). Guests (no session) pass
// through untouched; nothing here reads/writes app data, only the auth
// cookie. Degrades to a no-op, not a crash, if Supabase Auth isn't
// configured yet (NEXT_PUBLIC_SUPABASE_ANON_KEY missing) — same "unconfigured
// means off, not broken" convention as getSupabaseAdmin() elsewhere.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // The actual point of this call: it refreshes the session token if
  // expired, which writes the new cookie via setAll above.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|webmanifest)$).*)"],
};
