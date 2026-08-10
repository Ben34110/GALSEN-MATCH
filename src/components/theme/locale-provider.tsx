"use client";

import { useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useLocalStorageValue } from "@/hooks/use-local-storage-value";
import { LOCALE_STORAGE_KEY, resolveLocale, type Locale } from "@/lib/locale";

import frCommon from "@/messages/fr/common.json";
import frNav from "@/messages/fr/nav.json";
import frActu from "@/messages/fr/actu.json";
import frUpcoming from "@/messages/fr/upcoming.json";
import frFantasy from "@/messages/fr/fantasy.json";
import frChat from "@/messages/fr/chat.json";
import frMercato from "@/messages/fr/mercato.json";
import frProfil from "@/messages/fr/profil.json";
import frOnboarding from "@/messages/fr/onboarding.json";

import enCommon from "@/messages/en/common.json";
import enNav from "@/messages/en/nav.json";
import enActu from "@/messages/en/actu.json";
import enUpcoming from "@/messages/en/upcoming.json";
import enFantasy from "@/messages/en/fantasy.json";
import enChat from "@/messages/en/chat.json";
import enMercato from "@/messages/en/mercato.json";
import enProfil from "@/messages/en/profil.json";
import enOnboarding from "@/messages/en/onboarding.json";

import arCommon from "@/messages/ar/common.json";
import arNav from "@/messages/ar/nav.json";
import arActu from "@/messages/ar/actu.json";
import arUpcoming from "@/messages/ar/upcoming.json";
import arFantasy from "@/messages/ar/fantasy.json";
import arChat from "@/messages/ar/chat.json";
import arMercato from "@/messages/ar/mercato.json";
import arProfil from "@/messages/ar/profil.json";
import arOnboarding from "@/messages/ar/onboarding.json";

// One JSON file per app section per locale (src/messages/{locale}/{section}.json)
// instead of one giant per-locale file — keeps each section's translations
// independently editable without every change touching the same file.
// Merged here into the single `messages` object next-intl's
// NextIntlClientProvider expects, namespaced by section (useTranslations
// ("actu") reads messages.actu, etc.).
const MESSAGES: Record<Locale, Record<string, object>> = {
  fr: {
    common: frCommon,
    nav: frNav,
    actu: frActu,
    upcoming: frUpcoming,
    fantasy: frFantasy,
    chat: frChat,
    mercato: frMercato,
    profil: frProfil,
    onboarding: frOnboarding,
  },
  en: {
    common: enCommon,
    nav: enNav,
    actu: enActu,
    upcoming: enUpcoming,
    fantasy: enFantasy,
    chat: enChat,
    mercato: enMercato,
    profil: enProfil,
    onboarding: enOnboarding,
  },
  ar: {
    common: arCommon,
    nav: arNav,
    actu: arActu,
    upcoming: arUpcoming,
    fantasy: arFantasy,
    chat: arChat,
    mercato: arMercato,
    profil: arProfil,
    onboarding: arOnboarding,
  },
};

const RTL_LOCALES = new Set<Locale>(["ar"]);

// Locale is a plain localStorage preference (see lib/locale.ts and
// components/profil/locale-picker.tsx), same as the accent theme
// (accent-theme-provider.tsx) — not a cookie/URL segment, so there's no
// server-side i18n routing here (see next.config.ts: no next-intl plugin).
// Server Components can't know the chosen locale during SSR, which is why
// every page that renders translated chrome delegates that rendering to a
// client component (same split every page already has for interactivity) —
// this provider just needs to wrap the whole app once. First paint is
// always French (useLocalStorageValue's server snapshot is null -> "fr" by
// resolveLocale) and flips to the stored locale right after hydration —
// same accepted flash as the accent theme, not new.
export function AppLocaleProvider({ children }: { children: React.ReactNode }) {
  const raw = useLocalStorageValue(LOCALE_STORAGE_KEY);
  const locale = resolveLocale(raw);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  }, [locale]);

  return (
    // Fixed timeZone: this app already does all its own date math in UTC
    // (see fantasy-gameweek.ts's EPOCH_MONDAY_UTC) — an explicit value here
    // avoids next-intl's environment-fallback warning and keeps any future
    // t.rich/date formatting consistent with that, not the visitor's OS tz.
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
