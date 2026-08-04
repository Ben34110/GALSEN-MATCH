import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FloatingNav } from "@/components/nav/floating-nav";
import { AppTopBar } from "@/components/nav/app-top-bar";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { AccentThemeProvider } from "@/components/theme/accent-theme-provider";
import { AmbientGlow } from "@/components/theme/ambient-glow";

export const metadata: Metadata = {
  title: "Galsen Match",
  description:
    "Actu, livescore, jeu fantasy Starting 6 et chat communautaire pour la communauté footballistique africaine.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#060e0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <ServiceWorkerRegister />
        <AccentThemeProvider />
        <AmbientGlow />
        <a
          href="#contenu"
          className={[
            "fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-accent px-4 py-2",
            "text-sm font-semibold text-accent-ink transition-transform duration-[var(--duration-base)]",
            "focus-visible:translate-y-0",
          ].join(" ")}
        >
          Aller au contenu principal
        </a>

        <AppTopBar />

        <div className="mx-auto flex w-full max-w-6xl lg:gap-10 lg:px-8">
          <FloatingNav />
          <main
            id="contenu"
            className={[
              "w-full min-w-0 flex-1 px-4 pb-[calc(6rem+var(--safe-bottom))] pt-5",
              "sm:px-6 lg:max-w-3xl lg:px-0 lg:pb-16 lg:pt-10",
            ].join(" ")}
          >
            {children}
          </main>
        </div>

        <InstallPrompt />
      </body>
    </html>
  );
}
