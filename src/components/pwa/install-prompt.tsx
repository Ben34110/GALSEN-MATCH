"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorageValue, writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useClientValue } from "@/hooks/use-client-value";

const DISMISSED_KEY = "galsen-match:install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const isStandalone = useMediaQuery("(display-mode: standalone)");
  const isIOS = useClientValue(() => /iPad|iPhone|iPod/.test(navigator.userAgent), false);
  const dismissed = useLocalStorageValue(DISMISSED_KEY) === "1";

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    setDeferredPrompt(null);
  }

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl",
        "border border-border bg-surface/95 p-3 pl-4 shadow-lg shadow-black/30 backdrop-blur"
      )}
      role="dialog"
      aria-label="Installer Galsen Match"
    >
      <Download size={18} className="shrink-0 text-accent" />
      <div className="flex-1 text-xs text-foreground">
        {isIOS ? (
          <span>
            Installe Galsen Match : appuie sur <strong>Partager</strong> puis{" "}
            <strong>Sur l&apos;écran d&apos;accueil</strong>.
          </span>
        ) : (
          <span>Installe Galsen Match sur ton écran d&apos;accueil pour un accès rapide.</span>
        )}
      </div>
      {!isIOS && deferredPrompt && (
        <button
          onClick={install}
          className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink"
        >
          Installer
        </button>
      )}
      <button
        onClick={() => writeLocalStorageValue(DISMISSED_KEY, "1")}
        aria-label="Fermer"
        className="shrink-0 rounded-full p-1 text-muted hover:text-foreground"
      >
        <X size={16} />
      </button>
    </div>
  );
}
