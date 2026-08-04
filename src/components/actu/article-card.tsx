import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Article } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  mercato: "Mercato",
  "ligue1-sn": "Ligue 1 Sénégal",
  can2025: "CAN 2025",
  communaute: "Communauté",
};

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Badge tone="accent">{CATEGORY_LABELS[article.category] ?? article.category}</Badge>
        <span className="text-[11px] text-muted">{formatRelativeTime(article.publishedAt)}</span>
      </div>

      <h2 className="text-[15px] font-bold leading-snug text-foreground">{article.title}</h2>
      <p className="text-sm leading-relaxed text-muted">{article.summaryAi}</p>

      <a
        href={article.sourceUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={cn(
          "mt-auto inline-flex min-h-9 w-fit items-center gap-1.5 rounded-full pt-2 text-xs font-semibold",
          "text-accent transition-colors hover:text-foreground hover:underline"
        )}
      >
        Source : {article.sourceName}
        <ExternalLink size={12} aria-hidden />
      </a>
    </Card>
  );
}
