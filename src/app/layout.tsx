import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { AccentThemeProvider } from "@/components/theme/accent-theme-provider";
import { AppLocaleProvider } from "@/components/theme/locale-provider";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif-raw",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-raw",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AfroLive",
  description:
    "Actu, livescore, jeu fantasy Starting 6 et chat communautaire pour la communauté footballistique africaine.",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f7fc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`h-full ${displayFont.variable} ${sansFont.variable}`}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <ServiceWorkerRegister />
        <AccentThemeProvider />
        <AppLocaleProvider>
          {children}
          <InstallPrompt />
        </AppLocaleProvider>
      </body>
    </html>
  );
}
