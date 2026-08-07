import { getSupabaseAdmin } from "@/lib/supabase";
import type { Article } from "@/types";

const NEWS_LIMIT = 60;

// Server-only — reads the `news` table populated by GET /api/cron/fetch-news
// (see lib/news/rss-sync.ts). Returns null (not []) when Supabase isn't
// configured or the read fails, so the page can tell "no articles yet"
// apart from "unavailable" — same convention as getLeaderboard.
export async function getArticles(): Promise<Article[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("news")
    .select("id, title, summary, content_url, image_url, author, source_name, country, published_at")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(NEWS_LIMIT);
  if (error || !data) return null;

  return data.map(
    (row): Article => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      contentUrl: row.content_url,
      imageUrl: row.image_url,
      author: row.author,
      sourceName: row.source_name,
      country: row.country,
      publishedAt: row.published_at,
    })
  );
}
