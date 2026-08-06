"use client";

import { useSyncExternalStore } from "react";

// Petit store externe autour de localStorage : permet de lire une valeur
// persistée sans jamais désynchroniser le rendu serveur/client (le rendu
// serveur et la première passe client renvoient `null`, puis React
// re-rend automatiquement avec la vraie valeur juste après l'hydratation).
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function writeLocalStorageValue(key: string, value: string) {
  window.localStorage.setItem(key, value);
  emitChange();
}

export function removeLocalStorageValue(key: string) {
  window.localStorage.removeItem(key);
  emitChange();
}

export function useLocalStorageValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key),
    () => null
  );
}
