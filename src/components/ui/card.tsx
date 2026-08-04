import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover/press feedback for cards that act as tap targets (e.g. wrapped in a link/button). */
  interactive?: boolean;
  /** "glass" trades the flat surface fill for the translucent blurred chrome used by nav/overlays — reserve for featured/hero cards, not dense lists (perf + readability). */
  tone?: "solid" | "glass";
}

export function Card({ className, interactive = false, tone = "solid", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        tone === "solid" && "border border-border bg-surface shadow-sm",
        tone === "glass" && "glass-panel",
        interactive && [
          "transition-[transform,border-color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
          "active:scale-[0.98]",
          tone === "solid" && "hover:border-accent/40 hover:bg-surface-2",
          tone === "glass" && "hover:bg-white/[0.04]",
        ],
        className
      )}
      {...props}
    />
  );
}
