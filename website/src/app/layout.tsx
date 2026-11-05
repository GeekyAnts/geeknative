import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { absoluteUrl } from "@/lib/seo";
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
  // Next adds the /geeknative base path to file-based metadata images (the OG image) itself, but not to
  // canonical or og:url, so those use absoluteUrl().
  metadataBase: new URL("https://geekyants.github.io"),
  title: {
    default: "geeknative · One prompt. Three native apps.",
    template: "%s · geeknative",
  },
  description,
  keywords: [
    "native app development",
    "SwiftUI",
    "Jetpack Compose",
    "React",
    "TanStack Start",
    "coding agents",
    "Claude Code",
    "AGENTS.md",
    "iOS Android web app",
    "React Native alternative",
    "Flutter alternative",
  ],
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title: "geeknative · One prompt. Three native apps.",
    description,
    type: "website",
    siteName: "geeknative",
    url: absoluteUrl("/"),
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
