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

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === item.id
                ? "border-accent bg-accent text-accent-ink"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
