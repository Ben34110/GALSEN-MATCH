"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BadgesSection } from "@/components/profil/badges-section";
import { DeleteAccountButton } from "@/components/profil/delete-account-button";
import { LocalePicker } from "@/components/profil/locale-picker";
import { LogoutButton } from "@/components/profil/logout-button";
import { NewsNotificationsSection } from "@/components/profil/news-notifications-section";
import { PreferencesEditor } from "@/components/profil/preferences-editor";
import { ProfileIdentityCard } from "@/components/profil/profile-identity-card";
import { SectionHeader } from "@/components/ui/section-header";

// Wraps the Profil page's composition in a Client Component so it can call
// useTranslations() for the eyebrow/title/"Langue" heading — the page itself
// (app/(app)/profil/page.tsx) is a Server Component and locale here is
// client-only (localStorage), so it can't resolve those strings itself.
export function ProfilPageContent() {
  const t = useTranslations("profil.page");

  return (
    <div>
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />

      <ProfileIdentityCard />

      <div className="mb-8">
        <BadgesSection />
      </div>

      <div className="mb-8">
        <PreferencesEditor />
      </div>

      <div className="mb-8">
        <NewsNotificationsSection />
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{t("language")}</h2>
        <LocalePicker />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{t("legal")}</h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/privacy"
            className="flex min-h-11 items-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-accent/40"
          >
            {t("privacyPolicy")}
          </Link>
          <Link
            href="/terms"
            className="flex min-h-11 items-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-accent/40"
          >
            {t("terms")}
          </Link>
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <LogoutButton />
        <DeleteAccountButton />
      </div>
    </div>
  );
}
