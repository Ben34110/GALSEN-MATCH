"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ChevronRight, Newspaper, Radio, Star, Trophy } from "lucide-react";
import { ArticleCard } from "@/components/actu/article-card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getArticles } from "@/lib/data/news";
import { getFantasyPool, getPlayerStatsMap } from "@/lib/data/fantasy";
import { calculateLineupPoints } from "@/services/fantasy-scoring";
import { useSavedLineup } from "@/hooks/use-saved-lineup";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { initialsFromUsername } from "@/lib/onboarding";
import type { LineupSlot } from "@/types";

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "ligue1-sn", label: "Ligue 1 Sénégal" },
  { id: "mercato", label: "Mercato" },
  { id: "can2025", label: "CAN 2025" },
  { id: "communaute", label: "Communauté" },
] as const;

const QUICK_LINKS = [
  { id: "directs", label: "Directs", icon: Radio },
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
  const pool = useMemo(() => getFantasyPool(), []);
  const stats = useMemo(() => getPlayerStatsMap(), []);
  const savedLineup = useSavedLineup();
  const lineupPlayers = savedLineup
    ? savedLineup.selectedIds
        .map((id) => pool.find((player) => player.id === id))
        .filter((player): player is NonNullable<typeof player> => Boolean(player))
    : [];
  const lineupSlots: LineupSlot[] = lineupPlayers.map((player) => ({ playerId: player.id, position: player.position }));
  const lineupPoints =
    savedLineup && lineupSlots.length === 6 ? calculateLineupPoints(lineupSlots, savedLineup.captainId, stats) : null;

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

      {savedLineup && lineupPlayers.length === 6 ? (
        <Card className="gradient-accent mb-6 flex flex-col gap-4 border-0 text-accent-ink shadow-md lg:mb-8">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-accent-ink/75">
              Ton Starting 6 · Journée {savedLineup.matchday}
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
              {lineupPoints} pts est.
            </span>
          </div>

          <div className="flex items-center justify-between gap-1">
            {lineupPlayers.map((player) => {
              const isCaptain = player.id === savedLineup.captainId;
              return (
                <div key={player.id} className="flex flex-1 flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "relative grid size-10 place-items-center rounded-full bg-white/20 text-[11px] font-bold",
                      isCaptain && "ring-2 ring-white"
                    )}
                  >
                    {player.photoInitials}
                    {isCaptain && (
                      <Star
                        size={12}
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
              "flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-accent",
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Starting 6 · Journée 12</p>
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

          if (id === "directs") {
            return (
              <Link key={id} href="/live" className={className}>
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
