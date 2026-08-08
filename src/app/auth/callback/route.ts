import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

// Google OAuth lands here after the user approves — exchanges the redirect's
// `code` for a real session (sets the auth cookie), then sends them back
// into the app. Email/password sign-in never hits this route (it resolves a
// session directly in the browser) — this is Google-only.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/actu";

  if (code) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/onboarding?authError=1`);
}
