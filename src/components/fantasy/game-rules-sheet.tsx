"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

// Explains the Starting XI scoring rules. The per-player rating badge
// (pitch-view.tsx, once a journée is locked and a player's match finishes)
// is real and live — but real-player-scoring.ts's team/leaderboard *total*
// still returns 0 for everyone (see its own comment): aggregating 11
// players' real ratings into the leaderboard is separate follow-up work,
// not wired up yet. This describes the intended full rules regardless, so
// players know what to expect.
export function GameRulesSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations("fantasy");

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-foreground/40" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background p-6 pb-[calc(1.5rem+var(--safe-bottom))] shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-bold text-foreground">{t("gameRules.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:text-foreground"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted">
          <p>{t("gameRules.p1")}</p>
          <p>{t("gameRules.p2")}</p>
          <p>{t("gameRules.p3")}</p>
          <p>{t("gameRules.p4")}</p>
          <p>{t("gameRules.p5")}</p>
          <p>{t("gameRules.p6")}</p>
        </div>
      </div>
    </div>
  );
}
