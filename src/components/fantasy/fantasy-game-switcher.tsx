"use client";

import { usePathname } from "next/navigation";
import { SegmentedControl, type SegmentedControlItem } from "@/components/ui/segmented-control";

const GAMES: SegmentedControlItem[] = [
  { id: "xi", label: "Le XI", href: "/fantasy" },
  { id: "ballon-dor", label: "Ballon d'Or", href: "/fantasy/ballon-dor" },
  { id: "quiz", label: "Quizz", href: "/fantasy/quiz" },
];

function matches(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Rendered at the top of all three game pages — switching games never
// requires backing out to an intermediate hub screen. Active game is
// derived from the pathname (same approach as floating-nav.tsx) rather
// than a prop, so each page just renders this with no state of its own.
// "/fantasy" would prefix-match every other game's route too, so the
// longest matching href wins (e.g. "/fantasy/quiz/leaderboard" resolves to
// "quiz", not "xi", even though both technically prefix-match "/fantasy").
export function FantasyGameSwitcher() {
  const pathname = usePathname();
  const activeId = [...GAMES].filter((game) => matches(game.href!, pathname)).sort((a, b) => b.href!.length - a.href!.length)[0]
    ?.id;

  return <SegmentedControl items={GAMES} activeId={activeId ?? "xi"} className="mb-6 lg:mb-8" />;
}
