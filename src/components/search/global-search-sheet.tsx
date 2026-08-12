"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { getNationalityFlag } from "@/lib/data/nationality-flags";
import { searchGlobal } from "@/lib/data/global-search";

export function GlobalSearchSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations("search.bar");
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const from = `?from=${encodeURIComponent(pathname)}`;

  const results = useMemo(() => searchGlobal(query), [query]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-[calc(0.75rem+var(--safe-top))]">
        <h2 className="font-serif text-lg font-bold text-foreground">{t("title")}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeAriaLabel")}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-foreground"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="px-4 pb-2 pt-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("placeholder")}
            autoFocus
            className="min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+var(--safe-bottom))]">
        {query.trim() === "" && <p className="py-10 text-center text-sm text-muted">{t("prompt")}</p>}

        {query.trim() !== "" && results.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">{t("noResults", { query: query.trim() })}</p>
        )}

        <div className="flex flex-col gap-1.5">
          {results.map((result) =>
            result.kind === "player" ? (
              <Link
                key={`player-${result.player.id}`}
                href={`/joueur/${result.player.id}${from}`}
                onClick={onClose}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 transition-colors hover:border-accent/40"
              >
                <span className="relative shrink-0">
                  <Image
                    src={result.player.photo}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-full bg-surface-2 object-cover"
                    unoptimized
                  />
                  <span
                    className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-surface text-[11px] shadow-sm"
                    aria-hidden
                  >
                    {getNationalityFlag(result.player.nationality)}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{result.player.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {result.player.nationality} · {result.player.teamName ?? "—"}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                  {t("players")}
                </span>
              </Link>
            ) : (
              <Link
                key={`team-${result.team.id}`}
                href={`/equipe/${result.team.id}${from}`}
                onClick={onClose}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 transition-colors hover:border-accent/40"
              >
                <Image
                  src={result.team.logo}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 object-contain"
                  unoptimized
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{result.team.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {result.team.type === "national" ? result.team.country : result.team.leagueName}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                  {result.team.type === "national" ? t("national") : t("clubs")}
                </span>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
