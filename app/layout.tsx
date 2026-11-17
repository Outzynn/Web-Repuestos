import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DataProvider } from "@/components/DataProvider";
import { RegisterServiceWorker } from "@/components/InstallApp";
import { TabBar } from "@/components/TabBar";
import { themeScript } from "@/components/Theme";

export const metadata: Metadata = {
  title: "Kylobyte",
  description: "Ventas, stock y service del local",
  applicationName: "Kylobyte",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kylobyte", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-app text-ink antialiased">
        <DataProvider>
          <div className="pb-tabs mx-auto min-h-screen w-full max-w-md">{children}</div>
          <TabBar />
          <RegisterServiceWorker />
        </DataProvider>
      </body>
    </html>
  );
}
