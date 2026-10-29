import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Repuestos - Servicio Tecnico",
    short_name: "Repuestos",
    description: "Stock de repuestos y lista de compra",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f2f7",
    theme_color: "#0071e3",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
