"use client";

import { useEffect } from "react";
import { getAccentTheme } from "@/lib/mock/accent-themes";
import { writeLocalStorageValue } from "@/hooks/use-local-storage-value";

export const ACCENT_STORAGE_KEY = "galsen-match:accent-theme";

export function applyAccentTheme(themeId: string) {
  const theme = getAccentTheme(themeId);
  const root = document.documentElement;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-ink", theme.accentInk);
  root.style.setProperty("--accent-2", theme.accent2);
  root.style.setProperty("--accent-3", theme.accent3);
  writeLocalStorageValue(ACCENT_STORAGE_KEY, theme.id);
}

// Réapplique le thème d'accent choisi par l'utilisateur (page Profil) au
// chargement de l'app, avant que Supabase ne fournisse cette préférence
// directement depuis le profil utilisateur (`users.accent_theme`).
export function AccentThemeProvider() {
  useEffect(() => {
    const saved = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    if (saved) applyAccentTheme(saved);
  }, []);

  return null;
}
