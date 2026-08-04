import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "live";
}

const TONE_CLASSES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent/15 text-accent ring-1 ring-inset ring-accent/25",
  live: "bg-accent-3/15 text-accent-3 ring-1 ring-inset ring-accent-3/30 shadow-[0_0_16px_-4px_rgba(217,79,79,0.6)]",
};

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    >
      {tone === "live" && (
        <span className="relative flex size-1.5 shrink-0" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-3 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-accent-3" />
        </span>
      )}
      {children}
    </span>
  );
}
