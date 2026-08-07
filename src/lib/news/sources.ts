// Modular RSS source list — the single place to add a new sports outlet.
// Each entry needs a real, working RSS/XML feed URL (verified by hand
// before being added here; a source with no feed left as a commented-out
// placeholder below rather than a guessed URL that would 404 every run).
export interface NewsSource {
  id: string;
  // Display name, used as the "credits" shown on every article card
  // ("Par <auteur> • <name>").
  name: string;
  feedUrl: string;
  // Matches an id in lib/data/african-nations.ts, or "general" for a
  // pan-African outlet with no single home country.
  country: string;
}

export const NEWS_SOURCES: NewsSource[] = [
  { id: "wiwsport", name: "wiwsport", feedUrl: "https://wiwsport.com/feed/", country: "senegal" },
  { id: "ghanasoccernet", name: "GHANAsoccernet", feedUrl: "https://ghanasoccernet.com/feed/", country: "gh" },
  { id: "dzfoot", name: "DZfoot", feedUrl: "https://www.dzfoot.com/feed", country: "dz" },
  { id: "completesports", name: "Complete Sports", feedUrl: "https://www.completesports.com/feed/", country: "ng" },
  { id: "brila", name: "Brila FM Sports", feedUrl: "https://www.brila.net/feed/", country: "ng" },
  { id: "kawowo", name: "Kawowo Sports", feedUrl: "https://www.kawowo.com/feed/", country: "ug" },

  // Sport News Africa doesn't currently publish a public RSS/XML feed —
  // checked /feed, /feed/, /feed.xml, /rss, /rss.xml, /?feed=rss2 and
  // robots.txt/sitemap.xml for a pointer to one; the site only exposes
  // page/article sitemaps (not built on WordPress, so no default /feed/
  // route exists). Add it here the moment they ship a real feed URL —
  // parsing, dedup, country tagging and the UI all already support it.
  // { id: "sportnewsafrica", name: "Sport News Africa", feedUrl: "https://sportnewsafrica.com/feed/", country: "general" },

  // Morocco: no working sports feed found. Hespress, Le360 and
  // mapsport.ma all return 403 (Cloudflare/bot-protected) even with a
  // browser user agent; Yabiladi has a real feed but its "sport" category
  // path (/rss/sport/) actually returns the same unfiltered general-news
  // feed as the homepage, not sport-only, so it's not usable as-is. Revisit
  // if one of these opens up or a smaller Moroccan sports outlet is found.

  // Add one entry per country's sports outlet as you find a working feed,
  // e.g.:
  // { id: "footballivoire", name: "Football Ivoire", feedUrl: "https://.../feed/", country: "cotedivoire" },
];
