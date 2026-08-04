import { AccentThemePicker } from "@/components/profil/accent-theme-picker";
import { LocalePicker } from "@/components/profil/locale-picker";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export default function ProfilPage() {
  return (
    <div>
      <SectionHeader eyebrow="Profil" title="Ton compte" />

      <Card className="mb-6 flex items-center gap-3.5">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-lg font-extrabold text-accent-ink">
          AD
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-foreground">Amina Diop</p>
          <p className="text-sm text-muted">
            <span aria-hidden>🇸🇳</span> Sénégal · @aminad
          </p>
        </div>
      </Card>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Thème d&apos;accent</h2>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Adapte la couleur d&apos;accentuation de l&apos;app à ta nation ou ton club favori.
          </p>
          <AccentThemePicker />
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Langue</h2>
          <LocalePicker />
        </section>
      </div>
    </div>
  );
}
