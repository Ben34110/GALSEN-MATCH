import { LineupBuilder } from "@/components/fantasy/lineup-builder";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { getFantasyPool, getPlayerStatsMap } from "@/lib/data/fantasy";

export default function FantasyPage() {
  const pool = getFantasyPool();
  const stats = getPlayerStatsMap();

  return (
    <div>
      <SectionHeader
        eyebrow="Starting 6"
        title="Journée 12"
        subtitle="1 gardien · 2 défenseurs · 2 milieux · 1 attaquant. Le capitaine double ses points."
      />

      <Card className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Journée 11 (terminée)</p>
          <p className="text-lg font-bold text-foreground">Ton équipe a marqué 612 pts</p>
        </div>
        <span className="text-2xl">⚽</span>
      </Card>

      <LineupBuilder pool={pool} stats={stats} />
    </div>
  );
}
