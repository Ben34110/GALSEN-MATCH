import { FantasyGameSwitcher } from "@/components/fantasy/fantasy-game-switcher";
import { BallonDorView } from "@/components/fantasy/ballon-dor-view";
import { getAfricanPlayers } from "@/lib/data/african-players";

export default function BallonDorPage() {
  const pool = getAfricanPlayers();

  return (
    <div>
      <FantasyGameSwitcher />
      <BallonDorView pool={pool} />
    </div>
  );
}
