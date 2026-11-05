import type { MetadataRoute } from "next";
import { allArticles, COLLECTIONS, type CollectionId } from "@/lib/articles";
import { allDocs } from "@/lib/docs/content";
import { absoluteUrl } from "@/lib/seo";

// Served at /geeknative/sitemap.xml. GitHub Pages serves this site under a path, so crawlers won't
// find it through a robots.txt; submit it in Google Search Console and Bing Webmaster Tools.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const collections = Object.keys(COLLECTIONS) as CollectionId[];
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/docs/"), changeFrequency: "weekly", priority: 0.9 },
    ...allDocs().map((d) => ({ url: absoluteUrl(d.href), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...collections.flatMap((id) => [
      { url: absoluteUrl(`/${id}/`), changeFrequency: "weekly" as const, priority: 0.8 },
      ...allArticles(id).map((a) => ({
        url: absoluteUrl(a.href),
        ...(a.date ? { lastModified: a.date } : {}),
        changeFrequency: "monthly" as const,
        priority: id === "blog" ? 0.6 : 0.8,
      })),
    ]),
  ];
}
