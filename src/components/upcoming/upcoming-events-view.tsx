"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { KeyEventCard } from "@/components/upcoming/key-event-card";
import { getUpcomingKeyEvents } from "@/lib/data/key-events";

export function UpcomingEventsView() {
  const t = useTranslations("upcoming.events");
  // Computed once on mount, not on every render — the individual
  // KeyEventCards each tick their own countdown independently via
  // useCountdown, so this list itself doesn't need to re-run every second.
  const events = useMemo(() => getUpcomingKeyEvents(), []);

  return (
    <div>
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <KeyEventCard key={event.id} event={event} />
        ))}
        {events.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            {t("empty")}
          </p>
        )}
      </div>
    </div>
  );
}
