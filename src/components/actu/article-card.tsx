import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import type { Article } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  mercato: "Mercato",
  "ligue1-sn": "Ligue 1 Sénégal",
  can2025: "CAN 2025",
  communaute: "Communauté",
};

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className="flex flex-col gap-2">
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
        className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
      >
        Source : {article.sourceName}
        <ExternalLink size={12} />
      </a>
    </Card>
  );
}
