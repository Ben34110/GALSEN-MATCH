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
        "flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
        selected ? "border-accent bg-accent/10" : "border-border bg-surface",
        disabled && !selected && "opacity-40"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled && !selected}
        className="flex flex-1 items-center gap-2.5 text-left disabled:cursor-not-allowed"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-bold text-foreground">
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
            "shrink-0 rounded-full p-1.5 transition-colors",
            isCaptain ? "bg-accent-2 text-accent-ink" : "bg-surface-2 text-muted hover:text-foreground"
          )}
        >
          <Star size={13} fill={isCaptain ? "currentColor" : "none"} />
        </button>
      )}

      <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-accent">
        {selected ? `${points}` : ""}
      </span>
    </div>
  );
}
