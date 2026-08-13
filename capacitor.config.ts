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
  server: {
    url: "https://galsen-match.vercel.app",
    cleartext: false,
  },
};

export default config;
