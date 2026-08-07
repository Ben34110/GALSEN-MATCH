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

// rss-parser's own URL fetching mis-detects charset for feeds whose XML
// prolog omits an explicit `encoding="UTF-8"` (e.g. GHANAsoccernet's
// `<?xml version="1.0"?>`, vs. wiwsport's `<?xml version="1.0"
// encoding="UTF-8"?>`) — it silently fell back to a single-byte encoding,
// producing mojibake like "BjÃ¶rkegren" instead of "Björkegren" for every
// non-ASCII character. Fetching and decoding the bytes ourselves, using the
// HTTP response's real Content-Type charset (which every RSS server sends
// correctly, prolog or not), sidesteps that heuristic entirely.
async function fetchFeedXml(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Feed request failed: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  const charset = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase() || "utf-8";
  const buffer = await res.arrayBuffer();
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return new TextDecoder("utf-8").decode(buffer);
  }
}

// Some sources' own backends double-encode non-ASCII text before it ever
// reaches us (confirmed on ghanasoccernet: its feed serves the literal
// bytes for "BjÃ¶rkegren" on the wire, already-mojibake'd — a bug in their
// pipeline, not a decode issue on ours, since fetching the raw bytes and
// decoding as UTF-8 still yields the corrupted text). Reinterpreting the
// string as Latin-1 bytes and re-decoding as UTF-8 reverses exactly that
// pattern.
//
// Only safe to attempt when every character in the input is already within
// the Latin-1 range (<= U+00FF) — that's the only way a string can be the
// result of misreading UTF-8 bytes as Latin-1 in the first place. Skipping
// this check bit once: checking only for a U+FFFD replacement character
// afterwards isn't enough, because Buffer.from(str, "latin1") *silently
// truncates* any character above U+00FF to its low byte instead of
// failing — e.g. a genuine curly quote U+2019 (’) truncates to 0x19,
// re-decodes as the *valid* control character U+0019, and slips past a
// replacement-character check while quietly destroying real text (this
// broke Brila's real curly quotes/en-dashes on the first version of this
// function). Bailing out whenever the input has any character above
// U+00FF avoids that path entirely.
function fixMojibake(text: string): string {
  if ([...text].some((ch) => ch.codePointAt(0)! > 0xff)) return text;
  try {
    const reversed = Buffer.from(text, "latin1").toString("utf8");
    return reversed.includes("�") ? text : reversed;
  } catch {
    return text;
  }
}

const SUMMARY_MAX_LENGTH = 220;

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

// The <img> tag is embedded HTML source (e.g. inside <content:encoded>),
// so its src attribute is HTML-entity-escaped like any other HTML text —
// a WordPress/Jetpack CDN URL routinely contains "&amp;" for a literal
// "&" query-string separator. Left undecoded, the resulting URL is wrong
// (kawowo.com images came through as ".../uploads/x.jpg?fit=1024%2C683
// &amp;ssl=1" instead of "...&ssl=1").
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

function firstImageInHtml(html: string | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match?.[1] ? decodeHtmlEntities(match[1]) : null;
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

// Some sources' image CDN sits behind a Cloudflare bot challenge that
// blocks any non-browser request (confirmed on ghanasoccernet's
// cms.ghanasoccernet.com — 403 on a plain fetch, and a real browser's
// cross-origin <img> request can't solve a JS challenge either, so this
// isn't a header/user-agent problem, it's genuinely unloadable for anyone
// hotlinking it). A HEAD check at sync time catches this generically for
// any current or future source, instead of hardcoding a per-domain
// exception — an unreachable image is stored as null so the card renders
// cleanly without one, rather than a broken-image icon.
async function verifyImageReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(6000) });
    return res.ok;
  } catch {
    return false;
  }
}

// Free, keyless translation API (mymemory.translated.net) — meant for
// exactly this kind of light, occasional use, unlike scraping an unofficial
// endpoint. Only ever called for articles not already stored (see
// syncAllNewsSources), so volume stays proportional to genuinely new
// articles per sync, not the full feed every 30 minutes.
async function translateText(text: string, from: "fr" | "en", to: "fr" | "en"): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { responseStatus?: number; responseData?: { translatedText?: string } };
    const translated = json.responseData?.translatedText;
    if (json.responseStatus !== 200 || typeof translated !== "string" || !translated.trim()) return null;
    return translated;
  } catch {
    return null;
  }
}

const OTHER_LANGUAGE: Record<"fr" | "en", "fr" | "en"> = { fr: "en", en: "fr" };

async function translateArticle(
  article: ParsedNewsItem
): Promise<{ titleTranslated: string | null; summaryTranslated: string | null }> {
  const target = OTHER_LANGUAGE[article.language];
  const [titleTranslated, summaryTranslated] = await Promise.all([
    translateText(article.title, article.language, target),
    article.summary ? translateText(article.summary, article.language, target) : Promise.resolve(null),
  ]);
  return { titleTranslated, summaryTranslated };
}

export interface ParsedNewsItem {
  title: string;
  summary: string | null;
  contentUrl: string;
  imageUrl: string | null;
  author: string | null;
  sourceName: string;
  country: string;
  language: "fr" | "en";
  publishedAt: string | null;
}

export async function fetchSourceArticles(source: NewsSource): Promise<ParsedNewsItem[]> {
  const xml = await fetchFeedXml(source.feedUrl);
  const feed = await parser.parseString(xml);
  const items: ParsedNewsItem[] = [];

  for (const item of feed.items) {
    const link = item.link?.trim();
    if (!link || !item.title) continue;

    let imageUrl = resolveFeedImage(item) ?? (await fetchOgImage(link));
    if (imageUrl && !(await verifyImageReachable(imageUrl))) imageUrl = null;

    items.push({
      title: fixMojibake(item.title.trim()),
      summary: item.contentSnippet ? fixMojibake(truncate(item.contentSnippet, SUMMARY_MAX_LENGTH)) : null,
      contentUrl: link,
      imageUrl,
      author: item.creator?.trim() ? fixMojibake(item.creator.trim()) : null,
      sourceName: source.name,
      country: source.country,
      language: source.language,
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
//
// Translation happens here, BEFORE the upsert, and only for articles whose
// content_url isn't already in the table — translating on every sync
// regardless would re-translate the same already-stored articles every 30
// minutes for no reason, burning through mymemory.translated.net's free
// daily quota for nothing new.
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

      const { data: existing, error: selectError } = await supabase
        .from("news")
        .select("content_url")
        .in(
          "content_url",
          articles.map((a) => a.contentUrl)
        );
      if (selectError) throw new Error(selectError.message);
      const existingUrls = new Set((existing ?? []).map((row) => row.content_url as string));
      const newArticles = articles.filter((a) => !existingUrls.has(a.contentUrl));

      const rows = await Promise.all(
        newArticles.map(async (article) => {
          const { titleTranslated, summaryTranslated } = await translateArticle(article);
          return {
            title: article.title,
            summary: article.summary,
            content_url: article.contentUrl,
            image_url: article.imageUrl,
            author: article.author,
            source_name: article.sourceName,
            country: article.country,
            language: article.language,
            title_translated: titleTranslated,
            summary_translated: summaryTranslated,
            published_at: article.publishedAt,
          };
        })
      );

      if (rows.length === 0) {
        results.push({ source: source.id, fetched: articles.length, inserted: 0 });
        continue;
      }

      const { data, error } = await supabase
        .from("news")
        .upsert(rows, { onConflict: "content_url", ignoreDuplicates: true })
        .select("id");

      results.push({ source: source.id, fetched: articles.length, inserted: data?.length ?? 0, error: error?.message });
    } catch (err) {
      results.push({ source: source.id, fetched: 0, inserted: 0, error: err instanceof Error ? err.message : "unknown error" });
    }
  }
  return results;
}
