import { FantasyView } from "@/components/fantasy/fantasy-view";
import { getAfricanPlayers } from "@/lib/data/african-players";

export default function FantasyXiPage() {
  const pool = getAfricanPlayers();

  return (
    <div>
      <FantasyView pool={pool} />
    </div>
  );
}
