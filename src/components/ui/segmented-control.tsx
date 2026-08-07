"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SegmentedControlItem {
  id: string;
  label: string;
  // Present → renders a Link (route-based switching, e.g. the Fantasy game
  // switcher). Absent → renders a button and relies on onChange (pure
  // client state, e.g. CAN qualifiers' Matchs/Classement toggle).
  href?: string;
}

interface SegmentedControlProps {
  items: SegmentedControlItem[];
  activeId: string;
  onChange?: (id: string) => void;
  className?: string;
}

// Generic pill-row switcher — two independent features need the exact same
// shape in this push (Fantasy's 3-game switcher, CAN qualifiers' Matchs/
// Classement toggle), worth generalizing once rather than hand-rolling
// twice. Visual language matches the existing pill buttons already used
// for the Actu country filter and the journée-switch buttons (rounded-full,
// bg-accent/text-accent-ink active state, text-muted inactive).
export function SegmentedControl({ items, activeId, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn("inline-flex gap-1 rounded-full border border-border bg-surface p-1", className)}>
      {items.map((item) => {
        const active = item.id === activeId;
        const itemClassName = cn(
          "min-h-9 flex-1 whitespace-nowrap rounded-full px-4 text-sm font-semibold text-center",
          "transition-colors duration-[var(--duration-fast)] active:scale-95",
          active ? "bg-accent text-accent-ink" : "text-muted hover:text-foreground"
        );

        if (item.href) {
          return (
            <Link key={item.id} href={item.href} aria-pressed={active} className={itemClassName}>
              {item.label}
            </Link>
          );
        }

        return (
          <button key={item.id} type="button" onClick={() => onChange?.(item.id)} aria-pressed={active} className={itemClassName}>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
