import Parser from "rss-parser";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NEWS_SOURCES, type NewsSource } from "@/lib/news/sources";

interface MediaContentEntry {
  $: { url?: string; medium?: string };
}

interface RawFeedItem {
  title?: string;
  link?: string;
  creator?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  "content:encoded"?: string;
  enclosure?: { url?: string; type?: string };
  mediaContent?: MediaContentEntry[];
  mediaThumbnail?: { $: { url?: string } };
}

const parser: Parser<object, RawFeedItem> = new Parser({
  timeout: 15_000,
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

const SUMMARY_MAX_LENGTH = 220;

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function firstImageInHtml(html: string | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match?.[1] ?? null;
}

// Open Graph fallback — only reached when the feed item itself has no
// usable image (no enclosure, no media:content/thumbnail, no <img> in the
// description/content). Rare for the WordPress-style feeds this app
// targets, but keeps the OG-extraction requirement honest for any source
// that omits images from its feed.
async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const res = await fetch(articleUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function resolveFeedImage(item: RawFeedItem): string | null {
  if (item.enclosure?.url && (!item.enclosure.type || item.enclosure.type.startsWith("image/"))) {
    return item.enclosure.url;
  }
  const imageMedia = item.mediaContent?.find((m) => m.$.medium === "image" && m.$.url);
  if (imageMedia?.$.url) return imageMedia.$.url;
  if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url;
  return firstImageInHtml(item.content) ?? firstImageInHtml(item["content:encoded"]);
}

export interface ParsedNewsItem {
  title: string;
  summary: string | null;
  contentUrl: string;
  imageUrl: string | null;
  author: string | null;
  sourceName: string;
  country: string;
  publishedAt: string | null;
}

export async function fetchSourceArticles(source: NewsSource): Promise<ParsedNewsItem[]> {
  const feed = await parser.parseURL(source.feedUrl);
  const items: ParsedNewsItem[] = [];

  for (const item of feed.items) {
    const link = item.link?.trim();
    if (!link || !item.title) continue;

    const imageUrl = resolveFeedImage(item) ?? (await fetchOgImage(link));

    items.push({
      title: item.title.trim(),
      summary: item.contentSnippet ? truncate(item.contentSnippet, SUMMARY_MAX_LENGTH) : null,
      contentUrl: link,
      imageUrl,
      author: item.creator?.trim() || null,
      sourceName: source.name,
      country: source.country,
      publishedAt: item.isoDate ?? (item.pubDate ? new Date(item.pubDate).toISOString() : null),
    });
  }

  return items;
}

export interface SourceSyncResult {
  source: string;
  fetched: number;
  inserted: number;
  error?: string;
}

// Called by GET /api/cron/fetch-news. Upserts on content_url (the news
// table's unique key — see supabase/schema.sql) with ignoreDuplicates, so
// re-running against the same feed every 30 minutes only ever inserts the
// articles it hasn't seen yet.
export async function syncAllNewsSources(): Promise<SourceSyncResult[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NEWS_SOURCES.map((source) => ({ source: source.id, fetched: 0, inserted: 0, error: "Supabase not configured" }));
  }

  const results: SourceSyncResult[] = [];
  for (const source of NEWS_SOURCES) {
    try {
      const articles = await fetchSourceArticles(source);
      if (articles.length === 0) {
        results.push({ source: source.id, fetched: 0, inserted: 0 });
        continue;
      }

      const { data, error } = await supabase
        .from("news")
        .upsert(
          articles.map((article) => ({
            title: article.title,
            summary: article.summary,
            content_url: article.contentUrl,
            image_url: article.imageUrl,
            author: article.author,
            source_name: article.sourceName,
            country: article.country,
            published_at: article.publishedAt,
          })),
          { onConflict: "content_url", ignoreDuplicates: true }
        )
        .select("id");

      results.push({ source: source.id, fetched: articles.length, inserted: data?.length ?? 0, error: error?.message });
    } catch (err) {
      results.push({ source: source.id, fetched: 0, inserted: 0, error: err instanceof Error ? err.message : "unknown error" });
    }
  }
  return results;
}
