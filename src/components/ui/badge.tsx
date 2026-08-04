import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "live";
}

const TONE_CLASSES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent/15 text-accent",
  live: "bg-accent-3/15 text-accent-3",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
