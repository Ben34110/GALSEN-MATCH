"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { cn, formatKickoff } from "@/lib/utils";
import { fetchDomesticLeagueMatches, fetchDomesticClubRoster } from "@/app/(app)/upcoming/actions";
import { DomesticClubRoster } from "@/components/upcoming/domestic-club-roster";
import type { DomesticLeagueSummary, DomesticFixture, DomesticClubRosterPlayer } from "@/lib/data/domestic-leagues";
import type { DomesticClub } from "@/types";

// One club row inside an expanded country — its own small accordion for
// the (non-clickable, see domestic-club-roster.tsx) roster, fetched only
// once this specific club is opened. 472 clubs total across every
// static-tier country, so per-club lazy loading matters here just as much
// as per-country.
function ClubRow({ club }: { club: DomesticClub }) {
  const [open, setOpen] = useState(false);
  const [roster, setRoster] = useState<DomesticClubRosterPlayer[] | null>(null);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && roster === null) {
      fetchDomesticClubRoster(club.id).then(setRoster);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        {club.logo ? (
          <Image src={club.logo} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" unoptimized />
        ) : (
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface-2 text-[8px] font-bold text-muted">
            {club.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{club.name}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && <DomesticClubRoster players={roster ?? []} loading={roster === null} />}
    </div>
  );
}

function MatchesList({ fixtures, error }: { fixtures: DomesticFixture[]; error: string | null }) {
  const t = useTranslations("upcoming.africanLeagues");

  if (fixtures.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted">
        {t("noMatches")}
        {error && <span className="mt-1 block text-[10px] text-muted/70">({error})</span>}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {fixtures.map((fixture) => (
        <Link key={fixture.id} href={`/live/match/${fixture.id}?from=/upcoming`}>
          <Card interactive className="flex items-center gap-2 p-3">
            <div className="flex flex-1 items-center justify-end gap-2 text-right">
              <span className="truncate text-sm font-semibold text-foreground">{fixture.homeTeam.name}</span>
              {fixture.homeTeam.logo && (
                <Image src={fixture.homeTeam.logo} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" unoptimized />
              )}
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-muted">
              {fixture.status === "finished" ? formatKickoff(fixture.kickoffAt).split(" ").slice(0, 2).join(" ") : formatKickoff(fixture.kickoffAt)}
            </span>
            <div className="flex flex-1 items-center gap-2">
              {fixture.awayTeam.logo && (
                <Image src={fixture.awayTeam.logo} alt="" width={20} height={20} className="size-5 shrink-0 object-contain" unoptimized />
              )}
              <span className="truncate text-sm font-semibold text-foreground">{fixture.awayTeam.name}</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function CountryRow({ league, clubs }: { league: DomesticLeagueSummary; clubs: DomesticClub[] }) {
  const t = useTranslations("upcoming.africanLeagues");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<{ fixtures: DomesticFixture[]; error: string | null } | null>(null);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && matches === null) {
      fetchDomesticLeagueMatches(league.leagueId).then(setMatches);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-bold text-foreground">{league.country}</span>
          <span className="block text-[11px] text-muted">{league.leagueName}</span>
        </span>
        <ChevronDown size={18} className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-3">
          <div>
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">{t("matchesHeading")}</h4>
            {matches ? <MatchesList fixtures={matches.fixtures} error={matches.error} /> : <p className="text-xs text-muted">{t("loadingMatches")}</p>}
          </div>
          <div>
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">{t("clubsHeading", { count: clubs.length })}</h4>
            <div className="flex flex-col gap-2">
              {clubs.map((club) => (
                <ClubRow key={club.id} club={club} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AfricanLeaguesSectionProps {
  leagues: DomesticLeagueSummary[];
  clubsByCountry: Record<string, DomesticClub[]>;
}

// The ~37-country "Championnats africains" tab minus the 8 already covered
// live elsewhere in the app (Maroc, Afrique du Sud, Égypte, Tunisie,
// Algérie, Nigeria, Ghana, Sénégal — see lib/data/domestic-leagues.ts's
// USABLE_LEAGUES, which only ever contains the static tier). Everything
// here loads lazily per country/per club on expand — matches and rosters
// alike — so this tab never ships the full dataset up front, only the
// country/club names themselves (already in the server-rendered props,
// no API call needed for those).
export function AfricanLeaguesSection({ leagues, clubsByCountry }: AfricanLeaguesSectionProps) {
  const t = useTranslations("upcoming.africanLeagues");
  return (
    <div>
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-col gap-2">
        {leagues.map((league) => (
          <CountryRow key={league.leagueId} league={league} clubs={clubsByCountry[league.country] ?? []} />
        ))}
      </div>
    </div>
  );
}
