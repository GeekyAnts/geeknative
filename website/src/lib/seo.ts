// Absolute URLs and structured data. Metadata routes (the sitemap) and JSON-LD don't get the base
// path added by Next, so they build full URLs from SITE_URL.

export const SITE_URL = "https://geekyants.github.io/geeknative";

/** "/blog/post/" → "https://geekyants.github.io/geeknative/blog/post/" */
export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

/** The site-wide share image. Pages that set their own openGraph replace the root one, so they add this. */
export const ogImage = { url: absoluteUrl("/opengraph-image.png"), width: 1200, height: 630, alt: "geeknative: one prompt, three native apps" };

export const publisher = {
  "@type": "Organization",
  name: "GeekyAnts",
  url: "https://geekyants.com",
  sameAs: ["https://github.com/GeekyAnts", "https://www.linkedin.com/company/geekyants-software-pvt-ltd/", "https://x.com/geekyants"],
} as const;

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}

export const softwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "geeknative",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux",
  description:
    "An open source project template and CLI that lets a coding agent build the same app natively for iOS (SwiftUI), Android (Jetpack Compose) and the web (React and TanStack Start) from one spec, with no cross-platform runtime.",
  url: absoluteUrl("/"),
  downloadUrl: "https://www.npmjs.com/package/geeknative",
  codeRepository: "https://github.com/GeekyAnts/geeknative",
  license: "https://www.apache.org/licenses/LICENSE-2.0",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: publisher,
  publisher,
} as const;
