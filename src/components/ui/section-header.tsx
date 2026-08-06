import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ eyebrow, title, subtitle, action }: SectionHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-3 lg:mb-8">
      <div className="min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-widest text-accent">{eyebrow}</span>
        <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </header>
  );
}
