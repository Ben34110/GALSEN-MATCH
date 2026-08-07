"use client";

import { cn } from "@/lib/utils";
import { useLocalStorageValue, writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { LOCALE_STORAGE_KEY, resolveLocale } from "@/lib/locale";

const LOCALES = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "ar", label: "العربية" },
] as const;

// Sélection persistée localement — le rendu multilingue effectif (next-intl,
// RTL pour l'arabe) arrive en phase 5 de la roadmap ; ce contrôle prépare le
// terrain côté UI et côté préférence utilisateur. Les articles Actualités
// (lib/news/localize.ts) sont la première brique à réagir à ce réglage —
// traduits fr<->en à la volée depuis leur langue source.
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
