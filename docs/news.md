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

Translation is deliberately gated on "not already stored" (not "every fetch") — translating the full feed every 30 minutes regardless would burn through MyMemory's free daily quota re-translating articles that haven't changed.

**Quota**: anonymous use is capped at 5,000 words/day, shared across every request from this server. Set `MYMEMORY_CONTACT_EMAIL` (any real email — MyMemory just wants a contact point) to double that to 10,000/day, no signup needed. When the quota is fully spent for the day, MyMemory returns an error string instead of a translation — the sync doesn't fail, it just leaves `title_translated`/`summary_translated` null for whatever ran out of quota, so those articles temporarily show in their original language.

**Retry**: a capped pass (20 rows/source/sync — see `MAX_TRANSLATION_RETRIES_PER_SOURCE` in `rss-sync.ts`) re-attempts translation for existing rows still missing one, so a quota day doesn't leave articles stuck untranslated forever — they catch up automatically over the next several syncs once quota resets.

**Known past bug, now fixed**: the `language` column was added to the `news` table via `alter table ... add column if not exists language text not null default 'fr'` — Postgres applies that default to every row that already existed at migration time, regardless of the row's real source language. Every English-source article inserted *before* that migration silently got `language = 'fr'`, which made `localize.ts` treat it as already being in French and skip translating it — exactly what "GHANAsoccernet articles never translate to French" looked like. Already-affected rows were identified and corrected directly (their `language` fixed, then deleted and re-synced so they'd also get a real translation) — a genuinely new migration adding a column with a default should not hit this again unless another column gets backfilled the same way.

### Adding a new source

Add one entry to `NEWS_SOURCES` in `src/lib/news/sources.ts`:

```ts
{ id: "footballivoire", name: "Football Ivoire", feedUrl: "https://.../feed/", country: "cotedivoire", language: "fr" }
```

`country` should match an id in `src/lib/data/african-nations.ts`, or `"general"` for a pan-African outlet with no single home country. Verify the feed URL actually returns RSS/XML by hand first (`curl <url> | head`) — a source with no real feed, or whose "category" feed turns out to just be an unfiltered general-news feed at a different URL (seen on Yabiladi and Linfodrome), is left commented out rather than wired in with something that isn't actually usable.

**Sixteen sources are live today**, all hand-verified against real, actively-publishing feeds:

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
| Journal du Mali (sport) | Mali | fr |
| Afrik-Foot | Général (pan-African) | fr |
| RFI (Afrique Foot) | Général (pan-African) | fr |
| RMC Sport (football) | Général (mercato/foot europ.) | fr |
| Football Tunisien | Tunisie | fr |
| SABC News Sport | Afrique du Sud | en |
| Guineefoot | Guinée | fr |
| Foot RDC | RD Congo | fr |
| Journal de Brazza (football) | Congo | fr |

**Sport News Africa** was requested but doesn't currently publish a public RSS/XML feed — checked `/feed`, `/feed/`, `/feed.xml`, `/rss`, `/rss.xml`, `/?feed=rss2`, and `robots.txt`/`sitemap.xml` for a pointer to one. It's a Laravel/Filament app (not WordPress), so no default `/feed/` route exists. Left as a commented-out placeholder — add it for real the moment they ship one. Afrik-Foot (added above) covers similar pan-African ground in the meantime.

**Côte d'Ivoire** still has no dedicated source wired in after trying ~26 candidates across three rounds (Fratmat, Abidjan.net, Koaci, Linfodrome, Soir Info, AIP, Alerte Info, Notre Voie, Le Patriote, several guessed football-specific domains that don't resolve, and — most recently — sport-ivoire.ci, which has a real "Football - Elephants" section but times out on every feed path tried, no response within 10s). Linfodrome and Connectionivoirienne are both real, working, Ivorian feeds — but general-news only: Linfodrome's `/rss/sport`/`/rss?rubrique=sport` paths return the exact same unfiltered feed as the homepage, and Connectionivoirienne's real "Sports" section (`/sports/`) has no RSS at all, only the site-wide feed. Not a total gap though — RFI's pan-African feed (added above) regularly covers Côte d'Ivoire specifically and gets correctly classified per-article (see step 3 in "How it works" above). Revisit if a dedicated Ivorian sports outlet with a real, reliable feed turns up.

## Per-country push notifications

Profil → "Notifications actu" lets a device subscribe to any country (or "Actu Afrique" for pan-African articles) — same on/off model as favoriting a club, stored in the `news_notification_prefs` table (also added via `supabase/schema.sql`, so re-running it picks this up too). No separate scheduler needed: `GET /api/cron/fetch-news` sends the notifications itself, right after syncing, reusing the same VAPID env vars already configured for `/api/cron/poll` (see `docs/notifications.md`) — nothing new to set up there.

One push per (country, device) per sync, not one per article — five new Sénégal articles in the same run produce a single body reading "📰 Sénégal · 5 nouveaux articles disponibles" instead of five separate notifications. The bold title is always "Galsen Match" — iOS/Safari renders every web push notification as `[bold title] / "from <manifest app name>" / [body]`, and that "from" line is native Safari chrome tied to the manifest name, not something the payload can remove or replace; putting the app's own name in the title (rather than the country) is what's actually controllable, so the country lives in the body instead. Tapping it opens `/actu?country=<id>`, which the Actu page reads on mount to land straight on that filter instead of "Dernières news".

The notification also carries the first new article's cover image (whichever one in the batch actually has one — some sources' images get nulled by the reachability check) as the Notification API's `image` field, distinct from `icon` (the small app badge). This renders as the expanded/press-and-hold cover photo on **Android and desktop Chrome only** — confirmed via a [known MDN browser-compat-data discrepancy](https://github.com/mdn/browser-compat-data/issues/19318) that iOS Safari's push implementation doesn't actually support the `image` option at all (some compat tables incorrectly marked it as supported), regardless of what the payload sends. No known workaround exists for this on iOS today; the field is still sent because it costs nothing and works everywhere else.
