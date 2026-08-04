"use client";

import { useMemo, useState } from "react";
import { MatchCard } from "@/components/live/match-card";
import { StandingsTable } from "@/components/live/standings-table";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { getMatches, getStandings } from "@/lib/data/live";

const TABS = [
  { id: "matches", label: "Matchs" },
  { id: "standings", label: "Classement" },
] as const;

export default function LivePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("matches");
  const matches = useMemo(() => getMatches(), []);
  const standings = useMemo(() => getStandings(), []);

  const live = matches.filter((match) => match.status === "live");
  const upcoming = matches.filter((match) => match.status === "scheduled");
  const finished = matches.filter((match) => match.status === "finished");

  return (
    <div>
      <SectionHeader
        eyebrow="Livescore"
        title="Ligue 1 Sénégal"
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
          {live.length > 0 && (
            <section>
              <h2 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent-3">
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-3 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-accent-3" />
                </span>
                En direct
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {live.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">À venir</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {upcoming.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {finished.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Derniers résultats</h2>
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
      ) : (
        <StandingsTable rows={standings} />
      )}
    </div>
  );
}
