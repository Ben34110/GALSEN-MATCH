# Actualités (news aggregation) — setup

Automated multi-source sports news, pulled from each outlet's RSS/XML feed and shown on the Actu tab with country filter pills, auto-translated to match the reader's locale. Two things need to exist before real articles show up: the `news` table (with its columns kept current) in Supabase, and an external scheduler hitting the sync endpoint every ~30 minutes.

## 1. Supabase

The `news` table lives in `supabase/schema.sql`, alongside the app's other tables.

1. Open your Supabase project's SQL Editor.
2. Paste the **entire** contents of `supabase/schema.sql` and run it — it's idempotent (`if not exists` / `add column if not exists` everywhere), so re-running it against a project that already has some of these tables/columns only adds what's missing. **Re-run this file every time it changes** — `create table if not exists` is a no-op once the table already exists, so new columns (like `language`/`title_translated`/`summary_translated`, added after the table's first release) need their own `alter table ... add column if not exists` to reach a project that already has `news`, which is why those lines exist as separate statements right after the `create table`.

`content_url` is the table's unique key — it's what the sync endpoint upserts on to avoid ever storing the same article twice, satisfying the "no duplicates" requirement without a separate GUID column.

Until the table (and its columns) match the current schema, `GET /api/cron/fetch-news` still fetches and parses every source's feed successfully but every insert fails (logged per-source in the response, not thrown) and `getArticles()` — used by the Actu page — returns `null`, which renders "Actualités indisponibles pour l'instant." instead of a broken page.

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
2. For each, fetches and parses its RSS feed (`src/lib/news/rss-sync.ts`, via the `rss-parser` package), extracting title, summary, link, image, author (`dc:creator`), and publish date. Images go through a fallback chain (`enclosure` → `media:content`/`media:thumbnail` → first `<img>` in the article body → Open Graph fetch of the article page), then a HEAD request verifies the URL is actually publicly loadable before it's stored — some sources' image CDNs sit behind bot-protection that blocks any hotlinked request (GHANAsoccernet's `cms.ghanasoccernet.com`, confirmed via direct testing), and there's no header trick around that, so those come through as no-image instead of a broken `<img>`.
3. For a pan-African source (`country: "general"` in `sources.ts`, e.g. Afrik-Foot), each article's actual country gets detected from its title + summary (`src/lib/news/country-classifier.ts`) instead of every one of its articles landing in the "Général" bucket — keyword/demonym matching against all 53 nations (e.g. "algérien"/"Algérie" → dz), picking the single clear winner by hit count and staying "general" on a tie (a multi-country roundup or a headline with no country mentioned at all). Verified against a live day of Afrik-Foot: 14/20 titles resolved to a specific country, the rest correctly stayed general rather than guessing. Country-specific sources (wiwsport, DZfoot, etc.) skip this — their country is already known.
4. Diffs the fetched batch against `content_url`s already in the table, and only for the genuinely new ones: translates title + summary (see "Translation" below), then upserts everything keyed on `content_url` with `ignoreDuplicates`.
5. Returns a per-source breakdown: `{ ok, fetched, inserted, sources: [{ source, fetched, inserted, error? }] }`.

The Actu page (`src/app/(app)/actu/page.tsx`) reads the table via `getArticles()` (`src/lib/data/news.ts`) on every request (`force-dynamic`) — a newly-synced article shows up on the very next page load, no redeploy or cache window to wait out. Country filter pills are generated dynamically from whatever countries are actually present in the fetched articles (see `ActuPageClient`), so they grow automatically as sources are added.

### Translation

Each source declares its real publishing `language` ("fr" or "en") in `sources.ts`. At sync time, every genuinely new article gets machine-translated into whichever of the two it *isn't*, via the free, keyless [mymemory.translated.net](https://mymemory.translated.net) API, and both versions are stored (`title`/`summary` = original, `title_translated`/`summary_translated` = the other language). `lib/news/localize.ts` picks whichever pair matches the reader's locale (the same `galsen-match:locale` preference set in Profil) at render time, falling back to the original text if a translation call ever failed — a card never renders blank because of a translation hiccup. Arabic isn't translated yet (full app i18n, RTL included, is the roadmap's phase 5) — an "ar" reader currently sees French, same as the rest of the app.

Translation is deliberately gated on "not already stored" (not "every fetch") — translating the full feed every 30 minutes regardless would burn through MyMemory's free daily quota re-translating articles that haven't changed. At today's ~9-source scale, volume stays well within the free tier's limits.

### Adding a new source

Add one entry to `NEWS_SOURCES` in `src/lib/news/sources.ts`:

```ts
{ id: "footballivoire", name: "Football Ivoire", feedUrl: "https://.../feed/", country: "cotedivoire", language: "fr" }
```

`country` should match an id in `src/lib/data/african-nations.ts`, or `"general"` for a pan-African outlet with no single home country. Verify the feed URL actually returns RSS/XML by hand first (`curl <url> | head`) — a source with no real feed, or whose "category" feed turns out to just be an unfiltered general-news feed at a different URL (seen on Yabiladi and Linfodrome), is left commented out rather than wired in with something that isn't actually usable.

**Nine sources are live today**, all hand-verified against real, actively-publishing feeds:

| Source | Country | Language |
|---|---|---|
| wiwsport | Sénégal | fr |
| GHANAsoccernet | Ghana | en |
| DZfoot | Algérie | fr |
| Complete Sports | Nigeria | en |
| Brila FM Sports | Nigeria | en |
| Kawowo Sports | Ouganda | en |
| Le Site Info (sport) | Maroc | fr |
| Actu Cameroun (sport) | Cameroun | fr |
| Afrik-Foot | Général (pan-African) | fr |

**Sport News Africa** was requested but doesn't currently publish a public RSS/XML feed — checked `/feed`, `/feed/`, `/feed.xml`, `/rss`, `/rss.xml`, `/?feed=rss2`, and `robots.txt`/`sitemap.xml` for a pointer to one. It's a Laravel/Filament app (not WordPress), so no default `/feed/` route exists. Left as a commented-out placeholder — add it for real the moment they ship one. Afrik-Foot (added above) covers similar pan-African ground in the meantime.

**Côte d'Ivoire** has no source wired in after trying ~15 candidates (Fratmat, Abidjan.net, Koaci, Linfodrome, Soir Info, and several guessed football-specific domains that don't resolve). Linfodrome is real and Ivorian but general-news only — its `/rss/sport` and `/rss?rubrique=sport` paths return the exact same unfiltered 101-item feed as the homepage, not sport-only content. Revisit if a dedicated Ivorian sports outlet with a real feed turns up.
