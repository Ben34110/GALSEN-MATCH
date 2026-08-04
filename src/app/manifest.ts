import type { MetadataRoute } from "next";

// Icônes de démonstration en SVG — à remplacer par un set PNG complet
// (192/512 + maskable) via un générateur de favicons avant mise en production.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Galsen Match",
    short_name: "Galsen Match",
    description:
      "Actu, livescore, jeu fantasy Starting 6 et chat communautaire pour la communauté footballistique africaine.",
    start_url: "/actu",
    display: "standalone",
    orientation: "portrait",
    background_color: "#060e0a",
    theme_color: "#060e0a",
    lang: "fr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
