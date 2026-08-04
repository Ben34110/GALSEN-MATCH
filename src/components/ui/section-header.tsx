interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ eyebrow, title, subtitle }: SectionHeaderProps) {
  return (
    <header className="mb-5">
      <span className="text-[11px] font-bold uppercase tracking-widest text-accent">{eyebrow}</span>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
    </header>
  );
}
