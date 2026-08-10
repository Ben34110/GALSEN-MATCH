"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Globe2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { getAfricanNation } from "@/lib/data/african-nations";
import type { Article } from "@/types";

export function ArticleCard({ article }: { article: Article }) {
  const t = useTranslations("actu.news");
  const nation = article.country === "general" ? null : getAfricanNation(article.country);
  const countryLabel = nation?.label ?? t("general");

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden p-0">
      {article.imageUrl && (
        <div className="aspect-[16/9] w-full shrink-0 overflow-hidden bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external RSS domains, unknown ahead of time */}
          <img src={article.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground ring-1 ring-inset ring-accent/20">
            {nation ? (
              // eslint-disable-next-line @next/next/no-img-element -- small fixed-domain crest, not worth the Image pipeline
              <img src={nation.logo} alt="" className="size-3.5 shrink-0 object-contain" />
            ) : (
              <Globe2 size={12} className="shrink-0" aria-hidden />
            )}
            {countryLabel}
          </span>
          {article.publishedAt && <span className="text-[11px] text-muted">{formatRelativeTime(article.publishedAt)}</span>}
        </div>

        <h2 className="line-clamp-2 text-[15px] font-bold leading-snug text-foreground">{article.title}</h2>
        {article.summary && <p className="line-clamp-3 text-sm leading-relaxed text-muted">{article.summary}</p>}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <p className="min-w-0 truncate text-[11px] text-muted">
            {t("byline", { author: article.author ?? t("defaultAuthor"), source: article.sourceName })}
          </p>
          <a
            href={article.contentUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full text-xs font-semibold text-accent transition-colors hover:text-foreground hover:underline"
          >
            {t("readArticle")}
            <ExternalLink size={12} aria-hidden />
          </a>
        </div>
      </div>
    </Card>
  );
}
