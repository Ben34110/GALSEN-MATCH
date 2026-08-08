import { SectionHeader } from "@/components/ui/section-header";
import { MercatoTransferList } from "@/components/mercato/mercato-transfer-list";
import { getMercatoTransfers } from "@/lib/data/mercato";

// Always read the mercato_transfers table fresh — same reasoning as
// actu/page.tsx: an ISR window would freeze the page at whatever existed
// at build/deploy time, confusing right after this table starts getting
// populated by the daily sync (see scripts/sync-mercato.mjs). A live
// Supabase read per request is a non-issue at this app's traffic.
export const dynamic = "force-dynamic";

export default async function MercatoPage() {
  const transfers = await getMercatoTransfers();

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
