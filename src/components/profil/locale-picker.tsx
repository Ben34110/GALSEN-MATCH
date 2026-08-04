"use client";

import { cn } from "@/lib/utils";
import { useLocalStorageValue, writeLocalStorageValue } from "@/hooks/use-local-storage-value";

const LOCALES = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "ar", label: "العربية" },
] as const;

const STORAGE_KEY = "galsen-match:locale";

// Sélection persistée localement — le rendu multilingue effectif (next-intl,
// RTL pour l'arabe) arrive en phase 5 de la roadmap ; ce contrôle prépare le
// terrain côté UI et côté préférence utilisateur.
export function LocalePicker() {
  const saved = useLocalStorageValue(STORAGE_KEY);
  const locale = saved === "en" || saved === "ar" ? saved : "fr";

  return (
    <div className="flex gap-2">
      {LOCALES.map((item) => (
        <button
          key={item.id}
          onClick={() => writeLocalStorageValue(STORAGE_KEY, item.id)}
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
