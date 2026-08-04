"use client";

import { useEffect } from "react";

// Le service worker n'est enregistré qu'en production : en dev, il entrerait
// en conflit avec le hot-reload de Next.js (fichiers servis depuis le cache).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Échec de l'enregistrement du service worker", error);
    });
  }, []);

  return null;
}
