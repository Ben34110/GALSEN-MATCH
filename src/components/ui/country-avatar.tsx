import { cn } from "@/lib/utils";

// A profile avatar framed by a ring in the user's chosen country's colors —
// reuses the same .gradient-accent (accent/accent-2/accent-3) that already
// re-paints live when the country changes (see accent-theme-provider.tsx),
// so this needs no per-country logic of its own. No photo upload system
// exists, so the avatar itself stays initials-based.
export function CountryAvatar({ initials, size = 14 }: { initials: string; size?: 10 | 14 }) {
  const outer = size === 14 ? "size-14 p-[3px]" : "size-10 p-[2px]";
  const fontSize = size === 14 ? "text-lg" : "text-xs";

  return (
    <span className={cn("gradient-accent inline-grid shrink-0 place-items-center rounded-full", outer)}>
      <span className={cn("grid size-full place-items-center rounded-full bg-surface font-extrabold text-accent", fontSize)}>
        {initials}
      </span>
    </span>
  );
}
