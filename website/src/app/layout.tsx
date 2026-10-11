import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Your coding agent builds the same app in SwiftUI, Jetpack Compose and TanStack Start from one spec, with no cross-platform runtime. Open source, by GeekyAnts.";

export const metadata: Metadata = {
  // Next adds the /geeknative base path to metadata URLs itself.
  metadataBase: new URL("https://geekyants.github.io"),
  title: {
    default: "geeknative · One prompt. Three native apps.",
    template: "%s · geeknative",
  },
  description,
  openGraph: {
    title: "geeknative · One prompt. Three native apps.",
    description,
    type: "website",
    siteName: "geeknative",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
