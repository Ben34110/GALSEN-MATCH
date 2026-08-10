import { MercatoTransferList } from "@/components/mercato/mercato-transfer-list";
import { getMercatoTransfers } from "@/lib/data/mercato";

// Always read the mercato_transfers table fresh — same reasoning as
// actu/page.tsx: an ISR window would freeze the page at whatever existed
// at build/deploy time, confusing right after this table starts getting
// populated by the daily sync (see scripts/sync-mercato.mjs). A live
// Supabase read per request is a non-issue at this app's traffic.
export const dynamic = "force-dynamic";

// Header text lives inside MercatoTransferList (a Client Component) since
// the locale is a client-only localStorage value this Server Component
// can't read — see AGENTS.md's i18n notes.
export default async function MercatoPage() {
  const transfers = await getMercatoTransfers();

  return <MercatoTransferList transfers={transfers} />;
}
