# Actualités (news aggregation) — setup

Automated multi-source sports news, pulled from each outlet's RSS/XML feed and shown on the Actu tab with country filter pills. Two things need to exist before real articles show up: the `news` table in Supabase, and an external scheduler hitting the sync endpoint every ~30 minutes.

## 1. Supabase

The `news` table was added to `supabase/schema.sql` (`create table if not exists news (...)`) — the same file the other tables (notifications, fantasy squads) already live in.

1. Open your Supabase project's SQL Editor.
2. Paste the contents of `supabase/schema.sql` and run it — it's idempotent (`if not exists` everywhere), so re-running it against a project that already has the other tables only adds `news`.

`content_url` is the table's unique key — it's what the sync endpoint upserts on to avoid ever storing the same article twice, satisfying the "no duplicates" requirement without a separate GUID column.

Until this table exists, `GET /api/cron/fetch-news` still fetches and parses every source's feed successfully but every insert fails (logged per-source in the response, not thrown) and `getArticles()` — used by the Actu page — returns `null`, which renders "Actualités indisponibles pour l'instant." instead of a broken page.

## 2. External scheduler

Same approach as `/api/cron/poll` (see `docs/notifications.md`) — Vercel's free-tier cron only runs once a day, so use a free external scheduler instead:

**cron-job.org:**
1. New cron job.
2. URL: `https://<your-app>.vercel.app/api/cron/fetch-news`
3. Schedule: every 30 minutes.
4. Request method: GET.
5. Custom header: `Authorization: Bearer <CRON_SECRET>` (same env var already used by the poll endpoint).

## How it works

`GET /api/cron/fetch-news` (see `src/app/api/cron/fetch-news/route.ts`):

1. Loops over every entry in `src/lib/news/sources.ts`.
2. For each, fetches and parses its RSS feed (`src/lib/news/rss-sync.ts`, via the `rss-parser` package), extracting title, summary, link, image (`enclosure` → `media:content`/`media:thumbnail` → first `<img>` in the article body → Open Graph fetch of the article page, in that order), author (`dc:creator`), and publish date.
3. Upserts every parsed article into the `news` table, keyed on `content_url` with `ignoreDuplicates`, so a re-run only ever inserts genuinely new articles.
4. Returns a per-source breakdown: `{ ok, fetched, inserted, sources: [{ source, fetched, inserted, error? }] }`.

The Actu page (`src/app/(app)/actu/page.tsx`) reads the table via `getArticles()` (`src/lib/data/news.ts`) with `revalidate = 1800`, matching the sync cadence — a fresh article shows up within 30 minutes without needing a redeploy. Country filter pills are generated dynamically from whatever countries are actually present in the fetched articles (see `ActuPageClient`), so they grow automatically as sources are added.

### Adding a new source

Add one entry to `NEWS_SOURCES` in `src/lib/news/sources.ts`:

```ts
{ id: "footballivoire", name: "Football Ivoire", feedUrl: "https://.../feed/", country: "cotedivoire" }
```

`country` should match an id in `src/lib/data/african-nations.ts`, or `"general"` for a pan-African outlet with no single home country. Verify the feed URL actually returns RSS/XML by hand first (`curl <url> | head`) — a source with no real feed is left commented out rather than wired in with a guessed URL that would silently fail every 30 minutes.

**Sport News Africa** was requested but doesn't currently publish a public RSS/XML feed — checked `/feed`, `/feed/`, `/feed.xml`, `/rss`, `/rss.xml`, `/?feed=rss2`, and `robots.txt`/`sitemap.xml` for a pointer to one. It's a Laravel/Filament app (not WordPress, which is where the default `/feed/` convention comes from) and only exposes page/article sitemaps, not a syndication feed. It's left as a commented-out placeholder in `sources.ts` — add it for real the moment they ship one.

Two sources are live today: **wiwsport** (Senegal) and **GHANAsoccernet** (Ghana), both verified working WordPress RSS feeds.
