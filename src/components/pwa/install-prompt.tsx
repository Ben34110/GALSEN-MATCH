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
        "fixed inset-x-4 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl",
        "bottom-[calc(5.5rem+var(--safe-bottom))] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:mx-0 lg:w-96",
        "border border-border bg-surface/95 p-3 pl-4 shadow-lg shadow-black/30 backdrop-blur",
        "animate-rise-in"
      )}
      role="dialog"
      aria-label="Installer AfroLive"
    >
      <Download size={18} className="shrink-0 text-accent" aria-hidden />
      <div className="flex-1 text-xs leading-snug text-foreground">
        {isIOS ? (
          <span>
            Installe AfroLive : appuie sur <strong>Partager</strong> puis{" "}
            <strong>Sur l&apos;écran d&apos;accueil</strong>.
          </span>
        ) : (
          <span>Installe AfroLive sur ton écran d&apos;accueil pour un accès rapide.</span>
        )}
      </div>
      {!isIOS && deferredPrompt && (
        <button
          onClick={install}
          className={cn(
            "shrink-0 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-accent-ink",
            "transition-transform duration-[var(--duration-fast)] active:scale-95"
          )}
        >
          Installer
        </button>
      )}
      <button
        onClick={() => writeLocalStorageValue(DISMISSED_KEY, "1")}
        aria-label="Fermer"
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <X size={16} />
      </button>
    </div>
  );
}
