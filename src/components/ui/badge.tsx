import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "live";
}

// Pastel tinted backgrounds pair with dark foreground text (not colored text)
// — a colored dot carries the hue instead. This reads closer to the Soft UI
// reference and sidesteps WCAG contrast issues pastel-on-pastel text has.
const TONE_CLASSES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent/10 text-foreground ring-1 ring-inset ring-accent/20",
  live: "bg-accent-3/10 text-foreground ring-1 ring-inset ring-accent-3/25",
};

const DOT_CLASSES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-muted",
  accent: "bg-accent",
  live: "bg-accent-3",
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
      {tone === "live" ? (
        <span className="relative flex size-1.5 shrink-0" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-3 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-accent-3" />
        </span>
      ) : (
        tone !== "neutral" && <span className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASSES[tone])} aria-hidden />
      )}
      {children}
    </span>
  );
}
