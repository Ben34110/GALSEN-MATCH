"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export interface AuthIdentity {
  email: string | null;
  // Supabase's app_metadata.provider — "email" for a password account,
  // "google" for Google OAuth.
  provider: string | null;
}

// null: signed out (guest) or Supabase isn't configured. Distinct from
// `undefined`/not-yet-loaded, which callers don't need to special-case here
// since getUser() always resolves (to null on no session) rather than hanging.
export function useAuthIdentity(): AuthIdentity | null {
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    function applyUser(user: User | null | undefined) {
      setIdentity(user ? { email: user.email ?? null, provider: user.app_metadata?.provider ?? null } : null);
    }

    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => applyUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => applyUser(session?.user));
    return () => subscription.unsubscribe();
  }, []);

  return identity;
}
