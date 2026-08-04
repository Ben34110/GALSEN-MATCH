interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ eyebrow, title, subtitle }: SectionHeaderProps) {
  return (
    <header className="mb-6 lg:mb-8">
      <span className="text-[11px] font-bold uppercase tracking-widest text-accent">{eyebrow}</span>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">{subtitle}</p>}
    </header>
  );
}
