"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentThemes } from "@/lib/mock/accent-themes";
import { ACCENT_STORAGE_KEY, applyAccentTheme } from "@/components/theme/accent-theme-provider";
import { useLocalStorageValue } from "@/hooks/use-local-storage-value";

export function AccentThemePicker() {
  const activeId = useLocalStorageValue(ACCENT_STORAGE_KEY) ?? "default";

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {accentThemes.map((theme) => {
        const active = activeId === theme.id;
        return (
          <button
            key={theme.id}
            onClick={() => applyAccentTheme(theme.id)}
            aria-pressed={active}
            className={cn(
              "flex min-h-11 flex-col items-center gap-1.5 rounded-xl border p-2.5",
              "transition-[transform,border-color,background-color] duration-[var(--duration-fast)] active:scale-95",
              active ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/30"
            )}
          >
            <span
              className="grid size-9 place-items-center rounded-full"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}
            >
              {active && <Check size={16} className="text-white drop-shadow" aria-hidden />}
            </span>
            <span className="text-[11px] font-semibold text-foreground">{theme.label}</span>
          </button>
        );
      })}
    </div>
  );
}
