import { notFound } from "next/navigation";
import { PlayerProfileView } from "@/components/profile/player-profile-view";
import { getPlayerDetail } from "@/lib/data/player-profile";

// Reachable from the global search sheet (see components/search/global-
// search-sheet.tsx) from anywhere in the app — `from` lets the "Retour"
// link go back to wherever the search was opened from, same pattern as
// live/match/[id]/page.tsx's own `from` param.
export default async function PlayerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const playerId = Number(id);
  if (!Number.isFinite(playerId)) notFound();

  const player = await getPlayerDetail(playerId);
  if (!player) notFound();

  const backHref = from && from.startsWith("/") && !from.startsWith("//") ? from : "/actu";

  return <PlayerProfileView player={player} backHref={backHref} />;
}
