import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSquad } from "@/lib/data/live";
import type { SquadPlayer } from "@/types";

const POSITION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];
const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: "Gardiens",
  Defender: "Défenseurs",
  Midfielder: "Milieux",
  Attacker: "Attaquants",
};

function groupByPosition(players: SquadPlayer[]): [string, SquadPlayer[]][] {
  const groups = new Map<string, SquadPlayer[]>();
  for (const player of players) {
    const list = groups.get(player.position) ?? [];
    list.push(player);
    groups.set(player.position, list);
  }
  const known = POSITION_ORDER.filter((position) => groups.has(position));
  const rest = [...groups.keys()].filter((position) => !POSITION_ORDER.includes(position));
  return [...known, ...rest].map((position) => [position, groups.get(position)!]);
}

export default async function TeamSquadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = Number(id);
  if (!Number.isFinite(teamId)) notFound();

  const squad = await getSquad(teamId);
  if (!squad) notFound();

  return (
    <div>
      <Link
        href="/live"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        Retour
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <Image src={squad.teamLogo} alt="" width={44} height={44} className="size-11 shrink-0 object-contain" unoptimized />
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">{squad.teamName}</h1>
      </div>

      <div className="flex flex-col gap-6">
        {groupByPosition(squad.players).map(([position, players]) => (
          <section key={position}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              {POSITION_LABELS[position] ?? position}
            </h2>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-2"
                >
                  <Image
                    src={player.photo}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 shrink-0 rounded-full bg-surface-2 object-cover"
                    unoptimized
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{player.name}</span>
                    <span className="block text-[11px] text-muted">{player.age} ans</span>
                  </span>
                  {player.number !== null && (
                    <span className="shrink-0 text-sm font-bold tabular-nums text-muted">#{player.number}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
