"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ChevronRight, Newspaper, Radio, Trophy } from "lucide-react";
import { ArticleCard } from "@/components/actu/article-card";
import { Card } from "@/components/ui/card";
import { cn, formatKickoff } from "@/lib/utils";
import { getArticles } from "@/lib/data/news";
import { getMatches } from "@/lib/data/live";
import { getTeamById } from "@/lib/mock/teams";

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
  const matches = useMemo(() => getMatches(), []);
  const filtered = filter === "all" ? articles : articles.filter((article) => article.category === filter);
  const articlesRef = useRef<HTMLDivElement>(null);

  const featuredMatch =
    matches.find((match) => match.status === "live") ??
    matches.find((match) => match.status === "scheduled") ??
    matches[0];
  const homeTeam = featuredMatch ? getTeamById(featuredMatch.homeTeamId) : undefined;
  const awayTeam = featuredMatch ? getTeamById(featuredMatch.awayTeamId) : undefined;

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
            Amina Diop
          </h1>
        </div>
        <Link
          href="/profil"
          aria-label="Voir le profil"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-base font-extrabold text-accent-ink shadow-sm transition-transform active:scale-95"
        >
          AD
        </Link>
      </header>

      {featuredMatch && homeTeam && awayTeam && (
        <Card className="gradient-accent mb-6 flex flex-col gap-4 border-0 text-accent-ink shadow-md lg:mb-8">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-accent-ink/75">
              {featuredMatch.competition} · J{featuredMatch.matchday}
            </span>
            {featuredMatch.status === "live" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                </span>
                {featuredMatch.minute}&apos;
              </span>
            ) : (
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                {formatKickoff(featuredMatch.kickoffAt)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-white/20 text-sm font-bold">
                {homeTeam.logoInitials}
              </span>
              <span className="text-sm font-semibold">{homeTeam.shortName}</span>
            </div>
            <div className="px-2 text-2xl font-extrabold tabular-nums">
              {featuredMatch.homeScore ?? 0} – {featuredMatch.awayScore ?? 0}
            </div>
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-white/20 text-sm font-bold">
                {awayTeam.logoInitials}
              </span>
              <span className="text-sm font-semibold">{awayTeam.shortName}</span>
            </div>
          </div>

          <Link
            href="/live"
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-accent",
              "transition-transform duration-[var(--duration-fast)] active:scale-[0.98]"
            )}
          >
            Rejoindre la Live Room
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
