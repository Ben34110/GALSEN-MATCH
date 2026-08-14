import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { NativeBridge } from "@/components/pwa/native-bridge";
import { ActivityHeartbeat } from "@/components/pwa/activity-heartbeat";
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

const APP_NAME = "AfroLive";
const APP_DESCRIPTION =
  "Actu, livescore, jeu fantasy Starting 6 et chat communautaire pour la communauté footballistique africaine.";
// The production Vercel URL — real (see docs/ios-app.md, cron-job.org's
// configured endpoints), not a placeholder. Needed as metadataBase so
// og:image/twitter:image resolve to an absolute URL when this page is
// shared (relative URLs there aren't reliably resolved by link-preview
// crawlers, which don't necessarily know the page's own origin).
const SITE_URL = "https://galsen-match.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  // Next.js auto-links the manifest.ts route; `appleWebApp` covers what
  // that alone doesn't for a Home-Screen-installed PWA on iOS specifically
  // (Apple ignores manifest.json's display/name for this, wants its own
  // meta tags) — capable removes Safari chrome, title is what shows under
  // the icon (short_name would truncate "AfroLive" oddly otherwise).
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    locale: "fr_FR",
    url: SITE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  // Disable iOS Safari's automatic blue-underline linkification of phone
  // numbers/addresses/dates inside plain text (e.g. a match date, a
  // player's shirt number) — those aren't meant to be tappable links here.
  formatDetection: { telephone: false, date: false, address: false, email: false },
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
        <NativeBridge />
        <ActivityHeartbeat />
        <AccentThemeProvider />
        <AppLocaleProvider>
          {children}
          <InstallPrompt />
        </AppLocaleProvider>
      </body>
    </html>
  );
}
