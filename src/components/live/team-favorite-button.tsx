"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useFavoriteTeamIds, toggleFavoriteTeam } from "@/hooks/use-favorite-teams";

// Favoriting works from anywhere a team id is known — including a match
// detail page for a competition whose official standings aren't available
// yet (see lib/data/live.ts's placeholder standings).
export function TeamFavoriteButton({ teamId, teamName }: { teamId: number; teamName: string }) {
  const t = useTranslations("live.favorite");
  const favoriteIds = useFavoriteTeamIds();
  const isFavorite = favoriteIds.includes(teamId);

  return (
    <button
      type="button"
      onClick={() => toggleFavoriteTeam(teamId, favoriteIds)}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? t("remove", { teamName }) : t("add", { teamName })}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-[var(--duration-fast)] active:scale-90",
        isFavorite ? "bg-accent-2 text-foreground" : "bg-surface-2 text-muted hover:text-foreground"
      )}
    >
      <Star size={15} fill={isFavorite ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}
