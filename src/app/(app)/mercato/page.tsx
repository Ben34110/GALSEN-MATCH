import { SectionHeader } from "@/components/ui/section-header";
import { MercatoTransferList } from "@/components/mercato/mercato-transfer-list";
import { getMercatoTransfers } from "@/lib/data/mercato";

export default function MercatoPage() {
  const transfers = getMercatoTransfers();

  return (
    <div>
      <SectionHeader
        eyebrow="Mercato"
        title="Derniers transferts"
        subtitle="Les mouvements les plus récents des joueurs africains, club de départ et club d'arrivée."
      />
      <MercatoTransferList transfers={transfers} />
    </div>
  );
}
