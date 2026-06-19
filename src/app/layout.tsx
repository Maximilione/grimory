import type { Metadata, Viewport } from "next";
import { Geist, Cinzel } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";
import { SrdPrefetch } from "@/components/SrdPrefetch";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

// Set the theme before first paint to avoid a flash (reads saved choice, else system).
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t||t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Grimorio — Schede GDR",
  description: "Gestione schede personaggio D&D 5e 2024, offline e local-first.",
  icons: {
    icon: [
      { url: `${base}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${base}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: `${base}/apple-icon.png`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Grimorio",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0f13",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" suppressHydrationWarning data-scroll-behavior="smooth" className={`${geistSans.variable} ${cinzel.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        {children}
        <ServiceWorker />
        <SrdPrefetch />
      </body>
    </html>
  );
}
