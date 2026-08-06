"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { MatchCard } from "@/components/live/match-card";
import { StandingsTable } from "@/components/live/standings-table";
import { FavoritesPanel } from "@/components/live/favorites-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import type { COMPETITIONS } from "@/lib/api-football";
import type { Match, StandingRow } from "@/types";

const TABS = [
  { id: "matches", label: "Matchs" },
  { id: "standings", label: "Classement" },
] as const;

interface LiveViewProps {
  competitions: typeof COMPETITIONS;
  activeLeagueId: number;
  matches: Match[];
  standingsRows: StandingRow[];
  standingsSeason: number;
  standingsSource: "api" | "mock" | "placeholder";
}

function CompetitionSelect({
  competitions,
  activeLeagueId,
}: {
  competitions: typeof COMPETITIONS;
  activeLeagueId: number;
}) {
  const router = useRouter();
  const africa = competitions.filter((c) => c.region === "africa");
  const europe = competitions.filter((c) => c.region === "europe");
  const defaultLeagueId = competitions[0].id;

  return (
    <div className="relative">
      <select
        value={activeLeagueId}
        onChange={(event) => {
          const id = Number(event.target.value);
          router.push(id === defaultLeagueId ? "/live" : `/live?league=${id}`);
        }}
        aria-label="Choisir une compétition"
        className={cn(
          "min-h-11 w-full appearance-none rounded-xl border border-border bg-surface pl-3.5 pr-10 text-sm font-semibold text-foreground",
          "focus:border-accent focus:outline-none"
        )}
      >
        <optgroup label="Afrique">
          {africa.map((competition) => (
            <option key={competition.id} value={competition.id}>
              {competition.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Europe">
          {europe.map((competition) => (
            <option key={competition.id} value={competition.id}>
              {competition.name}
            </option>
          ))}
        </optgroup>
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
}

export function LiveView({
  competitions,
  activeLeagueId,
  matches,
  standingsRows,
  standingsSeason,
  standingsSource,
}: LiveViewProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("matches");
  const activeCompetition = competitions.find((c) => c.id === activeLeagueId) ?? competitions[0];

  const live = matches.filter((match) => match.status === "live");
  const upcoming = matches.filter((match) => match.status === "scheduled");
  const finished = matches.filter((match) => match.status === "finished");

  return (
    <div>
      <SectionHeader
        eyebrow="Livescore"
        title="Matchs"
        subtitle="Scores mis à jour via une couche de cache — API-Football n'est jamais interrogée directement par le client."
      />

      <div className="mb-5 flex gap-2" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "min-h-10 rounded-full border px-4 py-2 text-xs font-semibold",
              "transition-colors duration-[var(--duration-fast)] active:scale-95",
              tab === item.id
                ? "border-accent bg-accent text-accent-ink"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "matches" ? (
        <div className="flex flex-col gap-7">
          <section>
            <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Mes clubs favoris</h2>
            <FavoritesPanel />
          </section>

          <section>
            <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Parcourir une compétition</h2>
            <CompetitionSelect competitions={competitions} activeLeagueId={activeLeagueId} />
          </section>

          <div className="flex flex-col gap-7">
            <h2 className="-mb-2 font-serif text-lg font-bold text-foreground">{activeCompetition.name}</h2>

            {live.length > 0 && (
              <section>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent-3">
                  <span className="relative flex size-1.5" aria-hidden>
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-3 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-accent-3" />
                  </span>
                  En direct
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {live.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">
                  À venir — {upcoming[0]?.roundLabel ?? `J${upcoming[0]?.matchday}`}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {upcoming.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            )}

            {finished.length > 0 && (
              <section>
                <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Derniers résultats</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {finished.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </section>
            )}

            {live.length === 0 && upcoming.length === 0 && finished.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
                Aucun match à afficher pour l&apos;instant.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <CompetitionSelect competitions={competitions} activeLeagueId={activeLeagueId} />
          </div>
          <p className="mb-3 text-xs font-medium text-muted">
            {standingsSource === "api" &&
              (standingsRows.every((row) => row.played === 0)
                ? `Saison ${standingsSeason}/${standingsSeason + 1} — aucun match joué pour l'instant, classement à 0 point.`
                : `Saison ${standingsSeason}/${standingsSeason + 1}`)}
            {standingsSource === "mock" && "Classement de démonstration — API-Football indisponible pour cette requête."}
            {standingsSource === "placeholder" &&
              `Saison ${standingsSeason}/${standingsSeason + 1} — aucun match joué pour l'instant, classement à 0 point.`}
          </p>
          {standingsRows.length > 0 ? (
            <StandingsTable rows={standingsRows} />
          ) : (
            <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
              Classement indisponible pour l&apos;instant.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
