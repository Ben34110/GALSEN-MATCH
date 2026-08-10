"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useFavoriteMatchIds, toggleFavoriteMatch } from "@/hooks/use-favorite-matches";

// Bookmarks a fixture id locally (same pattern as TeamFavoriteButton's star)
// — a "cloche" rather than a star since it marks a match to watch out for,
// not a team to follow.
export function MatchFavoriteButton({ fixtureId, matchLabel }: { fixtureId: number; matchLabel: string }) {
  const t = useTranslations("upcoming.matchFavorite");
  const favoriteIds = useFavoriteMatchIds();
  const isFavorite = favoriteIds.includes(fixtureId);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavoriteMatch(fixtureId, favoriteIds);
      }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t("remove", { match: matchLabel }) : t("add", { match: matchLabel })}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-[var(--duration-fast)] active:scale-90",
        isFavorite ? "bg-accent-2 text-foreground" : "bg-surface-2 text-muted hover:text-foreground"
      )}
    >
      <Bell size={15} fill={isFavorite ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}
