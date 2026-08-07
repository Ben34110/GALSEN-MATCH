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
  // The language the source actually publishes in — drives auto-translation
  // (see rss-sync.ts's translateArticle): an article is translated into
  // whichever of "fr"/"en" it ISN'T already written in, so a French-locale
  // reader never sees raw English (or vice versa).
  language: "fr" | "en";
}

export const NEWS_SOURCES: NewsSource[] = [
  { id: "wiwsport", name: "wiwsport", feedUrl: "https://wiwsport.com/feed/", country: "senegal", language: "fr" },
  { id: "ghanasoccernet", name: "GHANAsoccernet", feedUrl: "https://ghanasoccernet.com/feed/", country: "gh", language: "en" },
  { id: "dzfoot", name: "DZfoot", feedUrl: "https://www.dzfoot.com/feed", country: "dz", language: "fr" },
  { id: "completesports", name: "Complete Sports", feedUrl: "https://www.completesports.com/feed/", country: "ng", language: "en" },
  { id: "brila", name: "Brila FM Sports", feedUrl: "https://www.brila.net/feed/", country: "ng", language: "en" },
  { id: "kawowo", name: "Kawowo Sports", feedUrl: "https://www.kawowo.com/feed/", country: "ug", language: "en" },
  { id: "lesiteinfo", name: "Le Site Info", feedUrl: "https://www.lesiteinfo.com/sport/feed", country: "maroc", language: "fr" },
  { id: "actucameroun", name: "Actu Cameroun", feedUrl: "https://actucameroun.com/category/sport/feed/", country: "cameroun", language: "fr" },
  { id: "afrikfoot", name: "Afrik-Foot", feedUrl: "https://www.afrik-foot.com/feed", country: "general", language: "fr" },

  // Sport News Africa doesn't currently publish a public RSS/XML feed —
  // checked /feed, /feed/, /feed.xml, /rss, /rss.xml, /?feed=rss2 and
  // robots.txt/sitemap.xml for a pointer to one; the site only exposes
  // page/article sitemaps (not built on WordPress, so no default /feed/
  // route exists). Add it here the moment they ship a real feed URL —
  // parsing, dedup, country tagging and the UI all already support it.
  // { id: "sportnewsafrica", name: "Sport News Africa", feedUrl: "https://sportnewsafrica.com/feed/", country: "general", language: "fr" },

  // Côte d'Ivoire: no working sports feed found after trying ~15
  // candidates (Fratmat, Abidjan.net, Koaci, Linfodrome, Soir Info, and
  // several guessed football-specific domains that don't resolve at all).
  // Linfodrome is real and Ivorian but general-news only — its "sport"
  // paths (/rss/sport, /rss?rubrique=sport) return the exact same
  // unfiltered 101-item feed as the homepage, not sport-only. Revisit if a
  // dedicated Ivorian sports outlet with a real feed turns up.

  // Add one entry per country's sports outlet as you find a working feed,
  // e.g.:
  // { id: "footballivoire", name: "Football Ivoire", feedUrl: "https://.../feed/", country: "cotedivoire", language: "fr" },
];
