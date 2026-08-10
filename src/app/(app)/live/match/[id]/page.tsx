import { notFound } from "next/navigation";
import { MatchDetailView } from "@/components/live/match-detail-view";
import { getFixtureDetail, getMatchLineups } from "@/lib/data/live";

// Reachable from more than one tab now (Fantasy XI's countdown, the
// Upcoming CAN qualifiers calendar, and push-notification deep links from
// api/cron/poll/route.ts) — `from` lets each caller say where "Retour"
// should actually go instead of a single tab winning by default. Falls back
// to /fantasy/xi (the original, still-correct behavior for notification taps
// and any caller that doesn't pass it) when absent or not an internal path.
export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const fixtureId = Number(id);
  if (!Number.isFinite(fixtureId)) notFound();

  const backHref = from && from.startsWith("/") && !from.startsWith("//") ? from : "/fantasy/xi";

  const [match, lineups] = await Promise.all([getFixtureDetail(fixtureId), getMatchLineups(fixtureId)]);
  if (!match) notFound();

  return <MatchDetailView match={match} lineups={lineups} backHref={backHref} />;
}
