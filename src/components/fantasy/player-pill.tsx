import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTeamById } from "@/lib/mock/teams";
import type { Player } from "@/types";

interface PlayerPillProps {
  player: Player;
  points: number;
  selected: boolean;
  isCaptain: boolean;
  disabled: boolean;
  onToggle: () => void;
  onSetCaptain: () => void;
}

export function PlayerPill({ player, points, selected, isCaptain, disabled, onToggle, onSetCaptain }: PlayerPillProps) {
  const team = getTeamById(player.teamId);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-xl border py-1.5 pl-2.5 pr-1.5 transition-colors duration-[var(--duration-fast)]",
        selected ? "border-accent bg-accent/10" : "border-border bg-surface",
        disabled && !selected && "opacity-40"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled && !selected}
        className="flex min-h-11 flex-1 items-center gap-2.5 rounded-lg text-left disabled:cursor-not-allowed"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-bold text-foreground">
          {player.photoInitials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">{player.fullName}</span>
          <span className="block text-[11px] text-muted">{team?.shortName ?? "—"}</span>
        </span>
      </button>

      {selected && (
        <button
          type="button"
          onClick={onSetCaptain}
          aria-pressed={isCaptain}
          aria-label={isCaptain ? "Capitaine" : "Désigner comme capitaine"}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-[var(--duration-fast)] active:scale-90",
            isCaptain ? "bg-accent-2 text-foreground" : "bg-surface-2 text-muted hover:text-foreground"
          )}
        >
          <Star size={14} fill={isCaptain ? "currentColor" : "none"} aria-hidden />
        </button>
      )}

      <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-accent">
        {selected ? `${points}` : ""}
      </span>
    </div>
  );
}
