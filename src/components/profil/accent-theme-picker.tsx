"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentThemes } from "@/lib/mock/accent-themes";
import { ACCENT_STORAGE_KEY, applyAccentTheme } from "@/components/theme/accent-theme-provider";
import { useLocalStorageValue } from "@/hooks/use-local-storage-value";

export function AccentThemePicker() {
  const activeId = useLocalStorageValue(ACCENT_STORAGE_KEY) ?? "senegal";

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {accentThemes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => applyAccentTheme(theme.id)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-colors",
            activeId === theme.id ? "border-accent bg-accent/10" : "border-border bg-surface"
          )}
        >
          <span
            className="grid size-9 place-items-center rounded-full"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}
          >
            {activeId === theme.id && <Check size={16} className="text-white drop-shadow" />}
          </span>
          <span className="text-[11px] font-semibold text-foreground">{theme.label}</span>
        </button>
      ))}
    </div>
  );
}
