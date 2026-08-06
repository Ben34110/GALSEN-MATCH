"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, CalendarClock, ChevronRight, Newspaper, Star, Trophy } from "lucide-react";
import { ArticleCard } from "@/components/actu/article-card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getArticles } from "@/lib/data/news";
import { getAfricanPlayers, positionCode } from "@/lib/data/african-players";
import { calculateRealLineupPoints } from "@/services/real-player-scoring";
import { useFantasyStorage } from "@/hooks/use-saved-lineup";
import { getGameweekInfo } from "@/lib/fantasy-gameweek";
import { filledCount, isSquadComplete } from "@/lib/fantasy-lineup";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { initialsFromUsername } from "@/lib/onboarding";
import type { AfricanPlayer, PlayerPosition } from "@/types";

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "ligue1-sn", label: "Ligue 1 Sénégal" },
  { id: "mercato", label: "Mercato" },
  { id: "can2025", label: "CAN 2025" },
  { id: "communaute", label: "Communauté" },
] as const;

const QUICK_LINKS = [
  { id: "upcoming", label: "À venir", icon: CalendarClock },
  { id: "mercato", label: "Mercato", icon: ArrowLeftRight },
  { id: "fantasy", label: "Fantasy", icon: Trophy },
  { id: "actu", label: "Actualités", icon: Newspaper },
] as const;

export default function ActuPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const articles = useMemo(() => getArticles(), []);
  const filtered = filter === "all" ? articles : articles.filter((article) => article.category === filter);
  const articlesRef = useRef<HTMLDivElement>(null);

  const profile = useOnboardingProfile();
  const pool = useMemo(() => getAfricanPlayers(), []);
  const { activeJournee, editableJournee } = useMemo(() => getGameweekInfo(), []);
  const storage = useFantasyStorage();
  // Prefer previewing the journée currently being played if a team was set
  // for it; otherwise fall back to whatever's being prepared next.
  const previewJournee = storage[activeJournee] && filledCount(storage[activeJournee].seats) > 0 ? activeJournee : editableJournee;
  const squad = storage[previewJournee];
  const lineupPlayers: AfricanPlayer[] = squad
    ? Object.values(squad.seats)
        .filter((id): id is string => id !== null)
        .map((id) => pool.find((player) => String(player.id) === id))
        .filter((player): player is AfricanPlayer => Boolean(player))
    : [];
  const squadComplete = Boolean(squad && isSquadComplete(squad.seats));
  const lineupPoints =
    squad && squadComplete
      ? calculateRealLineupPoints(
          lineupPlayers.map((player) => ({ player, position: (positionCode(player.position) ?? "A") as PlayerPosition })),
          squad.captainId
        )
      : null;

  function goToArticles(nextFilter: (typeof FILTERS)[number]["id"]) {
    setFilter(nextFilter);
    articlesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-3 lg:mb-8">
        <div>
          <p className="text-sm text-muted">Bonjour 👋</p>
          <h1 className="mt-0.5 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {profile?.username ?? "Amina Diop"}
          </h1>
        </div>
        <Link
          href="/profil"
          aria-label="Voir le profil"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-base font-extrabold text-accent-ink shadow-sm transition-transform active:scale-95"
        >
          {profile ? initialsFromUsername(profile.username) : "AD"}
        </Link>
      </header>

      {squad && lineupPlayers.length > 0 ? (
        <Card className="glass-accent mb-6 flex flex-col gap-4 text-foreground shadow-md lg:mb-8">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Ton équipe · Journée {previewJournee}
            </span>
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
              {squadComplete ? `${lineupPoints} pts est.` : `${lineupPlayers.length}/11`}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {lineupPlayers.map((player) => {
              const isCaptain = String(player.id) === squad.captainId;
              return (
                <div key={player.id} className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "relative grid size-9 place-items-center overflow-hidden rounded-full bg-accent/10",
                      isCaptain && "ring-2 ring-accent"
                    )}
                  >
                    <Image src={player.photo} alt="" width={36} height={36} className="size-9 object-cover" unoptimized />
                    {isCaptain && (
                      <Star
                        size={11}
                        className="absolute -right-1 -top-1 rounded-full bg-accent-2 p-0.5 text-foreground"
                        fill="currentColor"
                        aria-hidden
                      />
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <Link
            href="/fantasy"
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-sm font-bold text-accent-ink",
              "transition-transform duration-[var(--duration-fast)] active:scale-[0.98]"
            )}
          >
            Gérer mon équipe
            <ChevronRight size={16} aria-hidden />
          </Link>
        </Card>
      ) : (
        <Card className="mb-6 flex items-center justify-between gap-3 lg:mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Journée {previewJournee}</p>
            <p className="text-base font-bold text-foreground">Compose ton équipe de la semaine</p>
          </div>
          <Link
            href="/fantasy"
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-bold text-accent-ink",
              "transition-transform duration-[var(--duration-fast)] active:scale-95"
            )}
          >
            Créer
            <ChevronRight size={16} aria-hidden />
          </Link>
        </Card>
      )}

      <div className="-mx-4 mb-7 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0 lg:mb-8">
        {QUICK_LINKS.map(({ id, label, icon: Icon }) => {
          const content = (
            <>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon size={17} aria-hidden />
              </span>
              {label}
            </>
          );
          const className = cn(
            "flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-border bg-surface pl-1.5 pr-4 text-sm font-semibold text-foreground shadow-sm",
            "transition-transform duration-[var(--duration-fast)] active:scale-95"
          );

          if (id === "upcoming") {
            return (
              <Link key={id} href="/upcoming" className={className}>
                {content}
              </Link>
            );
          }
          if (id === "fantasy") {
            return (
              <Link key={id} href="/fantasy" className={className}>
                {content}
              </Link>
            );
          }
          return (
            <button key={id} type="button" onClick={() => goToArticles(id === "mercato" ? "mercato" : "all")} className={className}>
              {content}
            </button>
          );
        })}
      </div>

      <div ref={articlesRef} className="scroll-mt-24">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">L&apos;essentiel du jour</h2>
        </div>

        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={cn(
                "min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold",
                "transition-colors duration-[var(--duration-fast)] active:scale-95",
                filter === item.id
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border bg-surface text-muted hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            Aucun article dans cette catégorie pour l&apos;instant.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
