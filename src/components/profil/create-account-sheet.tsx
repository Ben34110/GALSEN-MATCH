"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

// Same sign-up/sign-in mechanics as app/onboarding/page.tsx's "account"
// step (Google + email/password, signUp vs signInWithPassword), offered
// again here for a guest who skipped it during onboarding and wants to
// create an account later from Profil. Doesn't need to call
// app/actions/link-device-data.ts itself — components/onboarding/
// onboarding-gate.tsx already listens for every auth state change (mounted
// on every tab) and re-keys this device's existing rows (Fantasy squad,
// favorites, chat messages, ...) onto the new account automatically the
// moment a session appears, so "guest progress carries over" just falls
// out of that existing mechanism.
export function CreateAccountSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations("profil.createAccount");
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "check-email">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(t("accountsUnavailable"));
      return;
    }
    setStatus("pending");
    setError(null);

    const { data, error: authError } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/profil` },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setStatus("idle");
      setError(authError.message);
      return;
    }
    if (!data.session || !data.user) {
      // signUp requires an email confirmation click before a session
      // exists — nothing to link yet. onboarding-gate.tsx's listener picks
      // it up automatically once they confirm and return.
      setStatus("check-email");
      return;
    }
    onClose();
  }

  async function continueWithGoogle() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(t("accountsUnavailable"));
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/profil` },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-foreground/40" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="rounded-t-3xl bg-background p-6 pb-[calc(1.5rem+var(--safe-bottom))] shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-foreground">{t("title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:text-foreground"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        {status === "check-email" ? (
          <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-3.5">
            <Mail size={18} className="shrink-0 text-accent" aria-hidden />
            <p className="text-sm leading-snug text-foreground">{t("checkEmail")}</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm leading-relaxed text-muted">{t("intro")}</p>

            <button
              type="button"
              onClick={continueWithGoogle}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-[0.98]"
            >
              {t("continueWithGoogle")}
            </button>

            <div className="my-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
              <span className="h-px flex-1 bg-border" aria-hidden />
              {t("or")}
              <span className="h-px flex-1 bg-border" aria-hidden />
            </div>

            <div className="mb-3 flex gap-1.5 rounded-full border border-border bg-surface p-1">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cn(
                  "min-h-9 flex-1 rounded-full text-xs font-bold transition-colors",
                  mode === "signup" ? "bg-accent text-accent-ink" : "text-muted"
                )}
              >
                {t("signup")}
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={cn(
                  "min-h-9 flex-1 rounded-full text-xs font-bold transition-colors",
                  mode === "signin" ? "bg-accent text-accent-ink" : "text-muted"
                )}
              >
                {t("signin")}
              </button>
            </div>

            <label htmlFor="create-account-email" className="sr-only">
              {t("emailLabel")}
            </label>
            <input
              id="create-account-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("emailPlaceholder")}
              autoComplete="email"
              className="mb-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <label htmlFor="create-account-password" className="sr-only">
              {t("passwordLabel")}
            </label>
            <input
              id="create-account-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("passwordPlaceholder")}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />

            {error && <p className="mt-2 text-xs leading-relaxed text-accent-3">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={status === "pending" || !email.trim() || password.length < 6}
              className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl bg-foreground text-base font-semibold text-background transition-transform duration-[var(--duration-fast)] active:scale-[0.98] disabled:opacity-40"
            >
              {status === "pending" ? "…" : mode === "signup" ? t("submitSignup") : t("submitSignin")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
