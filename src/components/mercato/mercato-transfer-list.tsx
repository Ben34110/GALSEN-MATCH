import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MercatoTransfer } from "@/types";

const PRICE_RE = /[€$£]|(?:\d\s*[MK])\b/i;

function FeeBadge({ type }: { type: string | null }) {
  if (!type || /n\/a|free|libre/i.test(type)) return <Badge>Libre</Badge>;
  if (/loan|prêt/i.test(type)) return <Badge tone="accent">Prêt</Badge>;
  if (PRICE_RE.test(type)) return <Badge tone="accent">{type}</Badge>;
  // API-Football records a move happened but leaves the fee undisclosed for
  // most non-headline transfers (its generic "Transfer" type) — say so
  // plainly rather than surfacing that internal label as if it meant something.
  return <Badge>Prix non communiqué</Badge>;
}

function ClubCrest({ club }: { club: { name: string; logo: string } | null }) {
  return (
    <span className="flex flex-col items-center gap-1 text-center">
      {club ? (
        <Image src={club.logo} alt="" width={28} height={28} className="size-7 object-contain" unoptimized />
      ) : (
        <span className="grid size-7 place-items-center rounded-full bg-surface-2 text-[9px] font-bold text-muted">FA</span>
      )}
      <span className="max-w-[76px] truncate text-[11px] text-muted">{club?.name ?? "Agent libre"}</span>
    </span>
  );
}

export function MercatoTransferList({ transfers }: { transfers: MercatoTransfer[] }) {
  if (transfers.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
        Aucun transfert récent enregistré pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {transfers.map((transfer) => (
        <Card key={`${transfer.playerId}-${transfer.date}`} className="flex items-center gap-3">
          <Image
            src={transfer.playerPhoto}
            alt=""
            width={44}
            height={44}
            className="size-11 shrink-0 rounded-full object-cover"
            unoptimized
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{transfer.playerName}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <ClubCrest club={transfer.clubFrom} />
              <ArrowRight size={14} className="shrink-0 text-muted" aria-hidden />
              <ClubCrest club={transfer.clubTo} />
            </div>
          </div>
          <div className="shrink-0">
            <FeeBadge type={transfer.type} />
          </div>
        </Card>
      ))}
    </div>
  );
}
