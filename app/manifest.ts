import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kylobyte - Ventas y Stock",
    short_name: "Kylobyte",
    description: "Ventas, stock y service del local",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f2f7",
    // Igual que el meta theme-color: la barra de estado queda del color de la app.
    theme_color: "#f2f2f7",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Vender", url: "/" },
      { name: "Stock", url: "/stock" },
      { name: "Service", url: "/service" },
      { name: "Caja", url: "/caja" },
    ],
  };
}
