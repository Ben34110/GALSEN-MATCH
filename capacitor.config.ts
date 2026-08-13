import type { CapacitorConfig } from "@capacitor/cli";

// Remote-URL mode: the native shell just loads the live Vercel deployment
// in a WebView instead of bundling a local copy of the site — the whole
// point being zero changes to how this Next.js app is built/deployed
// (Server Components, Server Actions, the cron routes, Supabase — all of
// it keeps working exactly as it does in a browser tab, see docs/ios-app.md).
// `webDir` still has to point at *something* on disk even though it's
// unused in this mode — www/index.html is a placeholder Capacitor's CLI
// requires to exist, never actually loaded.
const config: CapacitorConfig = {
  appId: "com.afrolive.app",
  appName: "AfroLive",
  webDir: "www",
  backgroundColor: "#f7f7fc", // matches manifest.ts's theme_color/background_color
  server: {
    url: "https://galsen-match.vercel.app",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      // Kept visible until components/pwa/native-bridge.tsx explicitly
      // calls SplashScreen.hide() once the app has actually mounted —
      // the default auto-hide timer can't know when a *remote* page has
      // finished loading over the network, so a fixed duration would
      // either flash blank content (too short) or hold the splash after
      // the app is already usable (too long).
      launchAutoHide: false,
      backgroundColor: "#f7f7fc",
    },
    StatusBar: {
      style: "DARK", // dark icons/text — this app is light-theme only (see globals.css)
    },
  },
};

export default config;
