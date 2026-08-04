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

      <div className="mb-4 flex gap-1.5">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
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
        <div className="flex flex-col gap-6">
          {live.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-accent-3">En direct</h2>
              <div className="flex flex-col gap-3">
                {live.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">À venir</h2>
              <div className="flex flex-col gap-3">
                {upcoming.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {finished.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Derniers résultats</h2>
              <div className="flex flex-col gap-3">
                {finished.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <StandingsTable rows={standings} />
      )}
    </div>
  );
}
