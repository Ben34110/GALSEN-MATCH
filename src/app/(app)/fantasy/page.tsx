import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LineupBuilder } from "@/components/fantasy/lineup-builder";
import { SectionHeader } from "@/components/ui/section-header";
import { getAfricanPlayers } from "@/lib/data/african-players";

export default function FantasyPage() {
  const pool = getAfricanPlayers();

  return (
    <div>
      <SectionHeader
        eyebrow="Starting 6"
        title="Journée 12"
        subtitle="1 gardien · 2 défenseurs · 2 milieux · 1 attaquant. Le capitaine double ses points."
      />

      <Card className="mb-5 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-2/15 text-accent-2">
          <Trophy size={20} aria-hidden />
        </span>
        <p className="text-sm leading-snug text-muted">
          {pool.length} vrais joueurs africains des 5 grands championnats européens. Points estimés à partir de leurs
          vraies statistiques de la saison 2025/2026 (apparitions, buts, passes).
        </p>
      </Card>

      <LineupBuilder pool={pool} />
    </div>
  );
}
