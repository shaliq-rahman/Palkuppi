import type { MetadataRoute } from "next";

/** Makes "Add to Home Screen" install Palkuppi as a standalone app (no browser bars). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Palkuppi",
    short_name: "Palkuppi",
    description: "Track your daily milk and what you owe the milkman.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#AEC3FA",
    theme_color: "#AEC3FA",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
