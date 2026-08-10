"use client";

import { cn } from "@/lib/utils";
import { useLocalStorageValue, writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { LOCALE_STORAGE_KEY, resolveLocale } from "@/lib/locale";

const LOCALES = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "ar", label: "العربية" },
] as const;

// Sélection persistée localement (localStorage, pas de cookie) — lue par
// components/theme/locale-provider.tsx pour piloter next-intl côté client
// (fr/en/ar) sur toute l'app. Les 3 libellés ci-dessous sont les noms des
// langues dans leur propre langue (pas du texte d'UI) : ils ne passent donc
// pas par next-intl et restent identiques quel que soit le réglage actif.
export function LocalePicker() {
  const saved = useLocalStorageValue(LOCALE_STORAGE_KEY);
  const locale = resolveLocale(saved);

  return (
    <div className="flex gap-2">
      {LOCALES.map((item) => (
        <button
          key={item.id}
          onClick={() => writeLocalStorageValue(LOCALE_STORAGE_KEY, item.id)}
          aria-pressed={locale === item.id}
          className={cn(
            "min-h-11 flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold",
            "transition-[transform,border-color,background-color] duration-[var(--duration-fast)] active:scale-95",
            locale === item.id
              ? "border-accent bg-accent/10 text-foreground"
              : "border-border bg-surface text-muted hover:border-accent/30"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
