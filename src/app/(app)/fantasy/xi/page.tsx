import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FantasyView } from "@/components/fantasy/fantasy-view";
import { getAfricanPlayers } from "@/lib/data/african-players";

export default function FantasyXiPage() {
  const pool = getAfricanPlayers();

  return (
    <div>
      <Link
        href="/fantasy"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        Retour
      </Link>

      <FantasyView pool={pool} />
    </div>
  );
}
