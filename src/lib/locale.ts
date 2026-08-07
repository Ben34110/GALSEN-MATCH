export const LOCALE_STORAGE_KEY = "galsen-match:locale";

export type Locale = "fr" | "en" | "ar";

export function resolveLocale(raw: string | null): Locale {
  return raw === "en" || raw === "ar" ? raw : "fr";
}
