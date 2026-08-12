import { notFound } from "next/navigation";
import { TeamProfileView } from "@/components/profile/team-profile-view";
import { getTeamDetail } from "@/lib/data/team-profile";

// Same `from`-param pattern as joueur/[id]/page.tsx and live/match/[id]/
// page.tsx — reachable from the global search sheet from anywhere in the
// app. Covers both clubs and national teams (see TeamDetail's `type`).
export default async function TeamProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const teamId = Number(id);
  if (!Number.isFinite(teamId)) notFound();

  const team = await getTeamDetail(teamId);
  if (!team) notFound();

  const backHref = from && from.startsWith("/") && !from.startsWith("//") ? from : "/actu";

  return <TeamProfileView team={team} backHref={backHref} />;
}
