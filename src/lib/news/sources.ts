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

  // Sport News Africa doesn't currently publish a public RSS/XML feed —
  // checked /feed, /feed/, /feed.xml, /rss, /rss.xml, /?feed=rss2 and
  // robots.txt/sitemap.xml for a pointer to one; the site only exposes
  // page/article sitemaps (not built on WordPress, so no default /feed/
  // route exists). Add it here the moment they ship a real feed URL —
  // parsing, dedup, country tagging and the UI all already support it.
  // { id: "sportnewsafrica", name: "Sport News Africa", feedUrl: "https://sportnewsafrica.com/feed/", country: "general" },

  // Add one entry per country's sports outlet as you find a working feed,
  // e.g.:
  // { id: "footballivoire", name: "Football Ivoire", feedUrl: "https://.../feed/", country: "cotedivoire" },
];
