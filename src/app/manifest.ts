import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grimorio — Schede GDR",
    short_name: "Grimorio",
    description:
      "Gestione schede personaggio D&D 5e (2024): stats, incantesimi, equip, homebrew. Offline, dati sul dispositivo.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e0f13",
    theme_color: "#0e0f13",
    categories: ["games", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
