import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FloatingNav } from "@/components/nav/floating-nav";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { AccentThemeProvider } from "@/components/theme/accent-theme-provider";

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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">
        <ServiceWorkerRegister />
        <AccentThemeProvider />
        <div className="mx-auto flex min-h-full max-w-lg flex-col">
          <main className="flex-1 px-4 pb-28 pt-6">{children}</main>
        </div>
        <FloatingNav />
        <InstallPrompt />
      </body>
    </html>
  );
}
