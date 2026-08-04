import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover/press feedback for cards that act as tap targets (e.g. wrapped in a link/button). */
  interactive?: boolean;
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-sm",
        interactive && [
          "transition-[transform,border-color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
          "hover:border-accent/40 hover:bg-surface-2 active:scale-[0.98]",
        ],
        className
      )}
      {...props}
    />
  );
}
