"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTeamDirectory, searchTeams } from "@/lib/data/team-directory";
import { useFavoriteTeamIds, toggleFavoriteTeam } from "@/hooks/use-favorite-teams";
import { fetchTeamUpcomingMatches } from "@/app/(app)/live/actions";
import { MatchCard } from "@/components/live/match-card";
import type { Match } from "@/types";

// A team id absent from this map means "not fetched yet" — rendered as
// loading. Present-but-"error" or an array are the two settled states.
type MatchesState = Record<number, Match[] | "error">;

export function FavoritesPanel() {
  const teams = useMemo(() => getTeamDirectory(), []);
  const favoriteIds = useFavoriteTeamIds();
  const [search, setSearch] = useState("");
  const [matchesByTeam, setMatchesByTeam] = useState<MatchesState>({});

  const results = useMemo(() => (search.trim() ? searchTeams(teams, search).slice(0, 30) : []), [teams, search]);
  const favoriteTeams = useMemo(
    () => favoriteIds.map((id) => teams.find((team) => team.id === id)).filter((team) => team !== undefined),
    [teams, favoriteIds]
  );

  useEffect(() => {
    for (const id of favoriteIds) {
      if (matchesByTeam[id] !== undefined) continue;
      fetchTeamUpcomingMatches(id)
        .then((matches) => setMatchesByTeam((current) => ({ ...current, [id]: matches })))
        .catch(() => setMatchesByTeam((current) => ({ ...current, [id]: "error" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the favorite id set itself changes
  }, [favoriteIds.join(",")]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Chercher un club (Real Madrid, Bayern…)"
            className={cn(
              "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground",
              "placeholder:text-muted focus:border-accent focus:outline-none"
            )}
          />
        </div>

        {search.trim() && (
          <div className="mt-2 flex flex-col gap-1.5">
            {results.map((team) => {
              const isFavorite = favoriteIds.includes(team.id);
              return (
                <div
                  key={team.id}
                  className="flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-2"
                >
                  <Image src={team.logo} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" unoptimized />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{team.name}</span>
                    <span className="block text-[11px] text-muted">{team.leagueName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFavoriteTeam(team.id, favoriteIds)}
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? `Retirer ${team.name} des favoris` : `Ajouter ${team.name} aux favoris`}
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-[var(--duration-fast)] active:scale-90",
                      isFavorite ? "bg-accent-2 text-foreground" : "bg-surface-2 text-muted hover:text-foreground"
                    )}
                  >
                    <Star size={16} fill={isFavorite ? "currentColor" : "none"} aria-hidden />
                  </button>
                </div>
              );
            })}
            {results.length === 0 && <p className="py-4 text-center text-sm text-muted">Aucun club trouvé.</p>}
          </div>
        )}
      </div>

      {favoriteTeams.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
          Cherche un club ci-dessus et ajoute-le en favori pour suivre tous ses prochains matchs.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {favoriteTeams.map((team) => {
            const state = matchesByTeam[team.id];
            return (
              <section key={team.id}>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
                    <Image src={team.logo} alt="" width={18} height={18} className="size-[18px] object-contain" unoptimized />
                    {team.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => toggleFavoriteTeam(team.id, favoriteIds)}
                    aria-label={`Retirer ${team.name} des favoris`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-accent-2 transition-transform active:scale-90"
                  >
                    <Star size={16} fill="currentColor" aria-hidden />
                  </button>
                </div>

                {state === undefined && <p className="py-4 text-center text-sm text-muted">Chargement…</p>}
                {state === "error" && (
                  <p className="py-4 text-center text-sm text-muted">Matchs indisponibles pour l&apos;instant.</p>
                )}
                {Array.isArray(state) &&
                  (state.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {state.map((match) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted">Aucun match à venir programmé.</p>
                  ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
