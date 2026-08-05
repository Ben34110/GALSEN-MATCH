import { FantasyView } from "@/components/fantasy/fantasy-view";
import { getAfricanPlayers } from "@/lib/data/african-players";

export default function FantasyPage() {
  const pool = getAfricanPlayers();

  return (
    <div>
      <FantasyView pool={pool} />
    </div>
  );
}
