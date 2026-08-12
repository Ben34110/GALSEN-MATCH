"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlobalSearchSheet } from "@/components/search/global-search-sheet";

// A floating button rather than a 6th bottom-nav item — the nav
// (components/nav/floating-nav.tsx) already has 5 tabs and no shared top
// bar exists in this app shell (see app/(app)/layout.tsx's own comment on
// why), so this is the one persistent, reachable-from-anywhere entry point
// for global search instead of crowding either.
export function GlobalSearchButton() {
  const t = useTranslations("search.bar");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openAriaLabel")}
        className="glass-panel fixed right-4 z-40 grid size-11 place-items-center rounded-full text-foreground shadow-sm transition-transform duration-[var(--duration-fast)] active:scale-90 top-[calc(1rem+var(--safe-top))] lg:right-8"
      >
        <Search size={20} aria-hidden />
      </button>
      {open && <GlobalSearchSheet onClose={() => setOpen(false)} />}
    </>
  );
}
