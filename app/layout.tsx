import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./theme-sticker.css";
import { AuthProvider } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Palkuppi",
  description: "Palkuppi: track your daily milk and what you owe the milkman.",
};
export const viewport: Viewport = { themeColor: "#3E82E3", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="sticker" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=localStorage.getItem('palkuppi-theme');document.documentElement.dataset.theme=(t==='soft'||t==='sticker')?t:'sticker'}catch(e){}",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
