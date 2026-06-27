import type { Metadata } from "next";
import "./globals.css";
import { SyncProvider } from "@/components/providers/SyncProvider";

export const metadata: Metadata = {
  title: "RPM³ — Outcome Operating System",
  description: "Result. Purpose. Method. Focus Areas. Massive Actions. Focus 3.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f0f11" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RPM³" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full">
        <SyncProvider>{children}</SyncProvider>
      </body>
    </html>
  );
}
