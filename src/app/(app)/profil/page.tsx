import { LocalePicker } from "@/components/profil/locale-picker";
import { PreferencesEditor } from "@/components/profil/preferences-editor";
import { ProfileIdentityCard } from "@/components/profil/profile-identity-card";
import { SectionHeader } from "@/components/ui/section-header";

export default function ProfilPage() {
  return (
    <div>
      <SectionHeader eyebrow="Profil" title="Ton compte" />

      <ProfileIdentityCard />

      <div className="mb-8">
        <PreferencesEditor />
      </div>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Langue</h2>
        <LocalePicker />
      </section>
    </div>
  );
}
