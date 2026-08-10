"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface NotificationOption<Prefs> {
  key: keyof Prefs;
  label: string;
}

interface NotificationPrefsPanelProps<Prefs extends Record<string, boolean>> {
  title: string;
  options: NotificationOption<Prefs>[];
  initialPrefs: Prefs;
  onConfirm: (prefs: Prefs) => void;
  onCancel: () => void;
  confirmLabel?: string;
}

// Shown right when favoriting a club or player (see
// components/live/favorites-panel.tsx and profil/preferences-editor.tsx) —
// "je veux avoir la possibilité de gérer les notifications que je vais
// recevoir au préalable quand j'ajoute un club en favori." Also reusable
// to edit an existing favorite's preferences later (same component, just
// pre-filled with the saved prefs instead of the defaults).
export function NotificationPrefsPanel<Prefs extends Record<string, boolean>>({
  title,
  options,
  initialPrefs,
  onConfirm,
  onCancel,
  confirmLabel,
}: NotificationPrefsPanelProps<Prefs>) {
  const t = useTranslations("profil.notificationPanel");
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);

  return (
    <div className="rounded-xl border border-accent bg-accent/5 p-3">
      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
        <Bell size={13} aria-hidden />
        {title}
      </div>
      <div className="flex flex-col gap-1.5">
        {options.map((option) => {
          const checked = Boolean(prefs[option.key]);
          return (
            <button
              key={String(option.key)}
              type="button"
              onClick={() => setPrefs((current) => ({ ...current, [option.key]: !checked }))}
              aria-pressed={checked}
              className="flex min-h-9 items-center gap-2.5 rounded-lg px-1.5 text-left text-sm text-foreground transition-colors hover:bg-surface"
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                  checked ? "border-accent bg-accent text-accent-ink" : "border-border bg-surface"
                )}
              >
                {checked && <Check size={13} aria-hidden />}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-9 flex-1 rounded-lg border border-border bg-surface text-xs font-semibold text-muted transition-colors hover:text-foreground"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={() => onConfirm(prefs)}
          className="min-h-9 flex-1 rounded-lg bg-accent text-xs font-semibold text-accent-ink transition-transform active:scale-95"
        >
          {confirmLabel ?? t("activate")}
        </button>
      </div>
    </div>
  );
}
