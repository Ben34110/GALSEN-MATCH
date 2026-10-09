import { useTranslations } from "next-intl";
import { getNationalityFlag } from "@/lib/data/nationality-flags";
import type { DomesticClubRosterPlayer } from "@/lib/data/domestic-leagues";

// Deliberately plain text, no Link/href anywhere — these players don't
// have a rich profile page the way an international does (no live rating
// coverage, no multi-season history, see sync-domestic-players.mjs), and
// the user explicitly asked for this list to be a simple roster, not a
// clickable one. Same non-interactive pattern as
// components/live/match-lineups.tsx's own player rows.
export function DomesticClubRoster({ players, loading }: { players: DomesticClubRosterPlayer[]; loading: boolean }) {
  const t = useTranslations("upcoming.africanLeagues");

  if (loading) {
    return <p className="px-3 py-4 text-center text-xs text-muted">{t("loadingRoster")}</p>;
  }

  if (players.length === 0) {
    return <p className="px-3 py-4 text-center text-xs text-muted">{t("noRoster")}</p>;
  }

  return (
    <ul className="flex flex-col gap-1 px-3 py-2">
      {players.map((player) => (
        <li key={player.id} className="flex items-center gap-2 py-1 text-sm text-foreground">
          <span aria-hidden className="shrink-0 text-xs">
            {getNationalityFlag(player.nationality)}
          </span>
          <span className="min-w-0 flex-1 truncate">{player.name}</span>
          {player.position && <span className="shrink-0 text-[11px] text-muted">{player.position}</span>}
        </li>
      ))}
    </ul>
  );
}
