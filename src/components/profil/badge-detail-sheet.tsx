"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/badges";

// Same bottom-sheet pattern as components/fantasy/game-rules-sheet.tsx —
// tapping a badge (badges-section.tsx) explains what it is and how to
// unlock it, since the grid itself only has room for an emoji and a label.
export function BadgeDetailSheet({ badge, unlocked, onClose }: { badge: Badge; unlocked: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-foreground/40" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="rounded-t-3xl bg-background p-6 pb-[calc(1.5rem+var(--safe-bottom))] shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={cn("text-3xl", !unlocked && "grayscale")} aria-hidden>
              {badge.emoji}
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-foreground">{badge.label}</h2>
              <span className={cn("text-xs font-semibold", unlocked ? "text-accent" : "text-muted")}>
                {unlocked ? "Débloqué" : "Verrouillé"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:text-foreground"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-muted">{badge.description}</p>
      </div>
    </div>
  );
}
