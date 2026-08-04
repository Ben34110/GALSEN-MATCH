import { AccentThemePicker } from "@/components/profil/accent-theme-picker";
import { LocalePicker } from "@/components/profil/locale-picker";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export default function ProfilPage() {
  return (
    <div>
      <SectionHeader eyebrow="Profil" title="Ton compte" />

      <Card className="mb-5 flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-lg font-extrabold text-accent-ink">
          AD
        </span>
        <div>
          <p className="text-base font-bold text-foreground">Amina Diop</p>
          <p className="text-sm text-muted">🇸🇳 Sénégal · @aminad</p>
        </div>
      </Card>

      <section className="mb-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Thème d&apos;accent</h2>
        <p className="mb-3 text-sm text-muted">
          Adapte la couleur d&apos;accentuation de l&apos;app à ta nation ou ton club favori.
        </p>
        <AccentThemePicker />
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Langue</h2>
        <LocalePicker />
      </section>
    </div>
  );
}
