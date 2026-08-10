"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeftRight, CalendarClock, ChevronRight, Newspaper, Star, Trophy } from "lucide-react";
import { ArticleCard } from "@/components/actu/article-card";
import { Card } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { cn } from "@/lib/utils";
import { AFRICAN_NATIONS } from "@/lib/data/african-nations";
import { getAfricanPlayers } from "@/lib/data/african-players";
import { useFantasyStorage } from "@/hooks/use-saved-lineup";
import { getGameweekInfo } from "@/lib/fantasy-gameweek";
import { filledCount, isSquadComplete } from "@/lib/fantasy-lineup";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { useLocalStorageValue } from "@/hooks/use-local-storage-value";
import { LOCALE_STORAGE_KEY, resolveLocale } from "@/lib/locale";
import { localizeArticle } from "@/lib/news/localize";
import { getOrCreateDeviceId } from "@/lib/device-id";
import type { LeaderboardEntry } from "@/lib/data/fantasy-leaderboard";
import type { AfricanPlayer, Article } from "@/types";

const QUICK_LINKS = [
  { id: "upcoming", label: "Matchs", icon: CalendarClock },
  { id: "mercato", label: "Mercato", icon: ArrowLeftRight },
  { id: "fantasy", label: "Fantasy", icon: Trophy },
  { id: "actu", label: "Actualités", icon: Newspaper },
] as const;

export function ActuPageClient({
  articles,
  leaderboard,
}: {
  articles: Article[] | null;
  leaderboard: LeaderboardEntry[] | null;
}) {
  const [filter, setFilter] = useState<string>("all");
  const articlesRef = useRef<HTMLDivElement>(null);

  // A "new articles for <country>" push notification (see
  // app/actions/notifications.ts + api/cron/fetch-news/route.ts) links
  // here with ?country=<id> — land straight on that filter instead of
  // "Dernières news" once mounted, so tapping the notification actually
  // shows what it announced. Reading the URL only client-side (not as the
  // initial useState value) avoids a server/client hydration mismatch —
  // SSR always renders "Dernières news" active, then this corrects it
  // right after mount, same as every other localStorage/URL-derived
  // client state in this app.
  const countryParam = useSearchParams().get("country");
  useEffect(() => {
    if (countryParam) Promise.resolve(countryParam).then(setFilter);
  }, [countryParam]);

  // Every article not already written in the app's current locale gets
  // swapped for its precomputed translation (see lib/news/localize.ts) —
  // an English source under a French locale, or vice versa, never shows
  // raw untranslated text.
  const locale = resolveLocale(useLocalStorageValue(LOCALE_STORAGE_KEY));
  const localizedArticles = useMemo(
    () => (articles ? articles.map((article) => localizeArticle(article, locale)) : null),
    [articles, locale]
  );

  // Country pills only show up for countries a currently-synced article
  // actually belongs to — with two sources live today that's "Sénégal" and
  // "Ghana", growing automatically as lib/news/sources.ts gains entries.
  const countryFilters = useMemo(() => {
    if (!localizedArticles) return [];
    const present = new Set(localizedArticles.map((article) => article.country));
    const ordered: { id: string; label: string }[] = [];
    if (present.has("general")) ordered.push({ id: "general", label: "Général" });
    for (const nation of AFRICAN_NATIONS) {
      if (present.has(nation.id)) ordered.push({ id: nation.id, label: nation.label });
    }
    return ordered;
  }, [localizedArticles]);

  const filtered = !localizedArticles
    ? []
    : filter === "all"
      ? localizedArticles
      : localizedArticles.filter((article) => article.country === filter);

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
  // Rank within this journée's leaderboard (see app/actions/fantasy-sync.ts
  // — every synced squad row always carries device_id, signed in or not,
  // so matching on it finds "this device's" entry either way). 0 means not
  // ranked yet (leaderboard unavailable, or nothing synced for this device).
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const myRank = leaderboard ? leaderboard.findIndex((entry) => entry.deviceId === deviceId) + 1 : 0;

  function goToArticles(nextFilter: string) {
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
        <Link href="/profil" aria-label="Voir le profil" className="shrink-0 transition-transform active:scale-95">
          <ProfileAvatar countryId={profile?.countryId ?? "senegal"} size={10} />
        </Link>
      </header>

      {squad && lineupPlayers.length > 0 ? (
        <Card className="glass-accent mb-6 flex flex-col gap-4 text-foreground shadow-md lg:mb-8">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Ton équipe · Journée {previewJournee}
            </span>
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
              {squadComplete ? (myRank > 0 ? `#${myRank} au classement` : "En attente du classement") : `${lineupPlayers.length}/11`}
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
            href="/fantasy/xi"
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
            href="/fantasy/xi"
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
          if (id === "mercato") {
            return (
              <Link key={id} href="/mercato" className={className}>
                {content}
              </Link>
            );
          }
          return (
            <button key={id} type="button" onClick={() => goToArticles("all")} className={className}>
              {content}
            </button>
          );
        })}
      </div>

      <div ref={articlesRef} className="scroll-mt-24">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">Actualités</h2>
        </div>

        {articles && articles.length > 0 && (
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
            <button
              onClick={() => setFilter("all")}
              aria-pressed={filter === "all"}
              className={cn(
                "min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold",
                "transition-colors duration-[var(--duration-fast)] active:scale-95",
                filter === "all"
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border bg-surface text-muted hover:text-foreground"
              )}
            >
              Dernières news
            </button>
            {countryFilters.map((item) => (
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
        )}

        {!articles ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            Actualités indisponibles pour l&apos;instant.
          </p>
        ) : filtered.length === 0 ? (
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
