"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import {
  DEFAULT_AVATAR,
  FACE_SHAPES,
  SKIN_TONES,
  EYE_STYLES,
  HAIR_STYLES,
  HAIR_COLORS,
  type AvatarConfig,
} from "@/lib/avatar-options";

function SwatchRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn(
            "min-h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors",
            value === option.id
              ? "border-accent bg-accent text-accent-ink"
              : "border-border bg-surface text-muted hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ColorRow({ colors, value, onChange }: { colors: string[]; value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={color}
          aria-pressed={value === color}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full border-2 transition-transform active:scale-90",
            value === color ? "border-accent" : "border-transparent"
          )}
        >
          <span className="grid size-7 place-items-center rounded-full" style={{ backgroundColor: color }}>
            {value === color && <Check size={14} className="text-white mix-blend-difference" aria-hidden />}
          </span>
        </button>
      ))}
    </div>
  );
}

export function AvatarEditorSheet({
  initial,
  onSave,
  onClose,
}: {
  initial: AvatarConfig | null;
  onSave: (config: AvatarConfig) => void;
  onClose: () => void;
}) {
  const [config, setConfig] = useState<AvatarConfig>(initial ?? DEFAULT_AVATAR);

  function set<K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-foreground/40" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[88vh] overflow-y-auto rounded-t-3xl bg-background p-6 pb-[calc(1.5rem+var(--safe-bottom))] shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-bold text-foreground">Personnalise ton avatar</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:text-foreground"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="mb-6 flex justify-center">
          <CustomAvatar config={config} size={20} />
        </div>

        <div className="flex flex-col gap-5">
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Forme du visage</h3>
            <SwatchRow options={FACE_SHAPES} value={config.faceShape} onChange={(v) => set("faceShape", v)} />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Couleur de peau</h3>
            <ColorRow colors={SKIN_TONES} value={config.skinTone} onChange={(v) => set("skinTone", v)} />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Yeux</h3>
            <SwatchRow options={EYE_STYLES} value={config.eyeStyle} onChange={(v) => set("eyeStyle", v)} />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Coiffure</h3>
            <SwatchRow options={HAIR_STYLES} value={config.hairStyle} onChange={(v) => set("hairStyle", v)} />
          </section>

          {config.hairStyle !== "bald" && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Couleur de cheveux</h3>
              <ColorRow colors={HAIR_COLORS} value={config.hairColor} onChange={(v) => set("hairColor", v)} />
            </section>
          )}

          <p className="text-xs leading-relaxed text-muted">
            Le contour reprend automatiquement les couleurs de ton pays — change-le dans « Pays favori » ci-dessous.
          </p>

          <button
            type="button"
            onClick={() => onSave(config)}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-accent text-base font-bold text-accent-ink transition-transform duration-[var(--duration-fast)] active:scale-[0.98]"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
