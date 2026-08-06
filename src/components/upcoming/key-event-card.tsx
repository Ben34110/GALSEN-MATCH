"use client";

import { Card } from "@/components/ui/card";
import { useCountdown } from "@/hooks/use-countdown";
import { formatCountdown } from "@/lib/countdown-format";
import type { KeyEvent } from "@/lib/data/key-events";

export function KeyEventCard({ event }: { event: KeyEvent }) {
  const countdown = useCountdown(event.date);
  const dateLabel = event.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent/10 text-xl" aria-hidden>
          {event.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">{event.title}</p>
          <p className="truncate text-xs text-muted">{event.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2.5">
        <span className="text-lg font-extrabold tabular-nums text-accent">
          {countdown.expired ? "En cours" : formatCountdown(countdown)}
        </span>
        <span className="text-right text-[11px] text-muted">
          {dateLabel}
          {event.estimated && (
            <>
              <br />
              date estimée
            </>
          )}
        </span>
      </div>
    </Card>
  );
}
