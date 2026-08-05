"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { accentThemes } from "@/lib/mock/accent-themes";
import { applyAccentTheme } from "@/components/theme/accent-theme-provider";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { COUNTRY_FLAGS, updateOnboardingProfile } from "@/lib/onboarding";
import { getAfricanPlayers, searchAfricanPlayers } from "@/lib/data/african-players";
import { getTeamDirectory, searchTeams } from "@/lib/data/team-directory";

const COUNTRIES = accentThemes.filter((theme) => theme.id !== "default");

export function PreferencesEditor() {
  const profile = useOnboardingProfile();
  const allPlayers = useMemo(() => getAfricanPlayers(), []);
  const allTeams = useMemo(() => getTeamDirectory(), []);

  const [playerSearch, setPlayerSearch] = useState("");
  const [clubSearch, setClubSearch] = useState("");

  if (!profile) return null;

  const selectedPlayers = profile.playerIds
    .map((id) => allPlayers.find((player) => String(player.id) === id))
    .filter((player): player is NonNullable<typeof player> => Boolean(player));

  const favoriteClub = profile.favoriteClubId ? allTeams.find((team) => team.id === profile.favoriteClubId) : undefined;

  const playerResults = playerSearch.trim() ? searchAfricanPlayers(allPlayers, playerSearch).slice(0, 20) : [];
  const clubResults = clubSearch.trim() ? searchTeams(allTeams, clubSearch).slice(0, 20) : [];

  function setCountry(countryId: string) {
    if (!profile) return;
    updateOnboardingProfile(profile, { countryId });
    applyAccentTheme(countryId);
  }

  function removePlayer(playerId: string) {
    if (!profile) return;
    updateOnboardingProfile(profile, { playerIds: profile.playerIds.filter((id) => id !== playerId) });
  }

  function addPlayer(playerId: string) {
    if (!profile) return;
    if (profile.playerIds.includes(playerId) || profile.playerIds.length >= 3) return;
    updateOnboardingProfile(profile, { playerIds: [...profile.playerIds, playerId] });
    setPlayerSearch("");
  }

  function setClub(teamId: number) {
    if (!profile) return;
    updateOnboardingProfile(profile, { favoriteClubId: teamId });
    setClubSearch("");
  }

  function clearClub() {
    if (!profile) return;
    updateOnboardingProfile(profile, { favoriteClubId: null });
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Pays favori</h2>
        <p className="mb-3 text-sm leading-relaxed text-muted">
          Adapte les couleurs de l&apos;app et l&apos;ordre du chat à ta nation.
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {COUNTRIES.map((country) => {
            const active = profile.countryId === country.id;
            return (
              <button
                key={country.id}
                type="button"
                onClick={() => setCountry(country.id)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-11 flex-col items-center gap-1.5 rounded-xl border p-2.5",
                  "transition-[transform,border-color,background-color] duration-[var(--duration-fast)] active:scale-95",
                  active ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/30"
                )}
              >
                <span className="text-2xl" aria-hidden>
                  {COUNTRY_FLAGS[country.id]}
                </span>
                <span className="text-[11px] font-semibold text-foreground">{country.label}</span>
                {active && <Check size={14} className="text-accent" aria-hidden />}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Joueurs préférés</h2>
          <span className="text-xs font-semibold tabular-nums text-accent">{selectedPlayers.length}/3</span>
        </div>

        <div className="mb-3 flex flex-col gap-1.5">
          {selectedPlayers.map((player) => (
            <div
              key={player.id}
              className="flex min-h-11 items-center gap-2.5 rounded-xl border border-accent bg-accent/10 px-2.5 py-2"
            >
              <Image
                src={player.photo}
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-full bg-surface-2 object-cover"
                unoptimized
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{player.name}</span>
                <span className="block truncate text-[11px] text-muted">
                  {player.nationality} · {player.teamName ?? "—"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removePlayer(String(player.id))}
                aria-label={`Retirer ${player.name}`}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <X size={15} aria-hidden />
              </button>
            </div>
          ))}
          {selectedPlayers.length === 0 && <p className="text-sm text-muted">Aucun joueur sélectionné.</p>}
        </div>

        {selectedPlayers.length < 3 && (
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={playerSearch}
              onChange={(event) => setPlayerSearch(event.target.value)}
              placeholder="Ajouter un joueur…"
              className={cn(
                "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground",
                "placeholder:text-muted focus:border-accent focus:outline-none"
              )}
            />
            {playerSearch.trim() && (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {playerResults.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => addPlayer(String(player.id))}
                    className="flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-2 text-left transition-colors hover:border-accent/40"
                  >
                    <Image
                      src={player.photo}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 shrink-0 rounded-full bg-surface-2 object-cover"
                      unoptimized
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{player.name}</span>
                      <span className="block truncate text-[11px] text-muted">
                        {player.nationality} · {player.teamName ?? "—"}
                      </span>
                    </span>
                  </button>
                ))}
                {playerResults.length === 0 && <p className="py-2 text-center text-xs text-muted">Aucun joueur trouvé.</p>}
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Club préféré</h2>

        {favoriteClub ? (
          <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-accent bg-accent/10 px-2.5 py-2">
            <Image src={favoriteClub.logo} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" unoptimized />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{favoriteClub.name}</span>
              <span className="block text-[11px] text-muted">{favoriteClub.leagueName}</span>
            </span>
            <button
              type="button"
              onClick={clearClub}
              aria-label={`Retirer ${favoriteClub.name}`}
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={clubSearch}
              onChange={(event) => setClubSearch(event.target.value)}
              placeholder="Chercher un club (Real Madrid, Bayern…)"
              className={cn(
                "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground",
                "placeholder:text-muted focus:border-accent focus:outline-none"
              )}
            />
            {clubSearch.trim() && (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {clubResults.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setClub(team.id)}
                    className="flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-2 text-left transition-colors hover:border-accent/40"
                  >
                    <Image src={team.logo} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" unoptimized />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{team.name}</span>
                      <span className="block text-[11px] text-muted">{team.leagueName}</span>
                    </span>
                  </button>
                ))}
                {clubResults.length === 0 && <p className="py-2 text-center text-xs text-muted">Aucun club trouvé.</p>}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
