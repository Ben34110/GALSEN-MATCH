import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AfroLive",
    short_name: "AfroLive",
    description:
      "Actu, livescore, jeu fantasy Starting 6 et chat communautaire pour la communauté footballistique africaine.",
    start_url: "/actu",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f7fc",
    theme_color: "#f7f7fc",
    lang: "fr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
