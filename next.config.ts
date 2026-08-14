import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.api-sports.io",
        pathname: "/football/**",
      },
    ],
  },
  // No CSP here: this app has no inline-script/third-party-embed audit
  // behind it yet, and a wrong CSP silently breaks the Capacitor iOS shell
  // (remote-URL mode — see ios/App) with no local repro. These four are
  // safe, no-tradeoff defaults; none of them touches the app's own script
  // execution and nothing in this codebase uses camera/mic/geolocation
  // (grepped — no getUserMedia/navigator.geolocation calls anywhere).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
