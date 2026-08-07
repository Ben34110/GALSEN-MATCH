import type { Article } from "@/types";
import type { Locale } from "@/lib/locale";

// Only fr/en are actually translated (see rss-sync.ts) — full app i18n
// (including Arabic) is the roadmap's phase 5, not built yet, so an "ar"
// reader gets French, the app's primary language, same as everywhere else
// in the app today.
export function resolveNewsLocale(locale: Locale): "fr" | "en" {
  return locale === "en" ? "en" : "fr";
}

// Swaps in the translated title/summary when the reader's locale doesn't
// match the article's source language, falling back to the original text
// if a translation is missing (e.g. the mymemory.translated.net call
// failed at sync time) — never renders nothing.
export function localizeArticle(article: Article, locale: Locale): Article {
  const target = resolveNewsLocale(locale);
  if (article.language === target) return article;
  return {
    ...article,
    title: article.titleTranslated ?? article.title,
    summary: article.summaryTranslated ?? article.summary,
  };
}
