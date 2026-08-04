"use client";

import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/actu/article-card";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { getArticles } from "@/lib/data/news";

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "ligue1-sn", label: "Ligue 1 Sénégal" },
  { id: "mercato", label: "Mercato" },
  { id: "can2025", label: "CAN 2025" },
  { id: "communaute", label: "Communauté" },
] as const;

export default function ActuPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const articles = useMemo(() => getArticles(), []);
  const filtered = filter === "all" ? articles : articles.filter((article) => article.category === filter);

  return (
    <div>
      <SectionHeader
        eyebrow="Actu & Mercato"
        title="L'essentiel du jour"
        subtitle="Synthèses originales générées à partir de sources vérifiées — chaque résumé renvoie vers l'article d'origine."
      />

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
  );
}
