import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DataProvider } from "@/components/DataProvider";
import { TabBar } from "@/components/TabBar";

export const metadata: Metadata = {
  title: "Repuestos",
  description: "Control de stock y lista de repuestos a comprar",
  appleWebApp: { capable: true, title: "Repuestos", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f2f2f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-app text-ink antialiased">
        <DataProvider>
          <div className="mx-auto min-h-screen w-full max-w-md pb-28">{children}</div>
          <TabBar />
        </DataProvider>
      </body>
    </html>
  );
}
