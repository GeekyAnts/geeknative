import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMarkdown, type Chunk, type TocItem } from "./docs/markdown";

// Pages outside the docs: use cases, comparisons and blog posts. Each is a Markdown file in
// content/<collection>/<slug>.md with front matter: title, description, label (a short name for
// cards and breadcrumbs), and either order (use cases, compare) or date (blog, YYYY-MM-DD).

export const COLLECTIONS = {
  "use-cases": {
    title: "Use cases",
    heading: "Who geeknative is for",
    description:
      "How startups, product teams, agencies and enterprises use geeknative to ship native iOS, Android and web apps from one spec with a coding agent.",
    schemaType: "Article",
  },
  compare: {
    title: "Compare",
    heading: "geeknative compared",
    description:
      "How geeknative compares with React Native, Flutter, Capacitor, Ionic and Kotlin Multiplatform, and when each one is the better choice.",
    schemaType: "Article",
  },
  blog: {
    title: "Blog",
    heading: "Notes on native apps and coding agents",
    description: "Writing from the geeknative team on building native iOS, Android and web apps with coding agents.",
    schemaType: "BlogPosting",
  },
} as const;

export type CollectionId = keyof typeof COLLECTIONS;

export interface ArticleMeta {
  collection: CollectionId;
  slug: string;
  href: string; // "/blog/my-post/"
  title: string;
  label: string;
  description: string;
  order: number;
  date?: string;
  author: string;
  words: number;
}

export interface Article extends ArticleMeta {
  chunks: Chunk[];
  toc: TocItem[];
}

const ROOT = path.join(process.cwd(), "content");
const cache = new Map<CollectionId, ArticleMeta[]>();

function read(collection: CollectionId, file: string) {
  return matter(fs.readFileSync(path.join(ROOT, collection, file), "utf8"));
}

/** Every page in a collection: blog posts newest first, the others by `order`. */
export function allArticles(collection: CollectionId): ArticleMeta[] {
  const hit = cache.get(collection);
  if (hit) return hit;
  const dir = path.join(ROOT, collection);
  const items = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const { data, content } = read(collection, file);
      const where = `content/${collection}/${file}`;
      if (typeof data.title !== "string") throw new Error(`${where} needs a title in its front matter`);
      if (typeof data.description !== "string") throw new Error(`${where} needs a description in its front matter`);
      const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : typeof data.date === "string" ? data.date : undefined;
      if (collection === "blog" && !date) throw new Error(`${where} needs a date (YYYY-MM-DD) in its front matter`);
      const slug = file.replace(/\.md$/, "");
      return {
        collection,
        slug,
        href: `/${collection}/${slug}/`,
        title: data.title,
        label: typeof data.label === "string" ? data.label : data.title,
        description: data.description,
        order: typeof data.order === "number" ? data.order : 99,
        date,
        author: typeof data.author === "string" ? data.author : "The geeknative team",
        words: content.split(/\s+/).filter(Boolean).length,
      } satisfies ArticleMeta;
    })
    .sort((a, b) => (collection === "blog" ? (b.date ?? "").localeCompare(a.date ?? "") || a.order - b.order : a.order - b.order));
  cache.set(collection, items);
  return items;
}

export async function getArticle(collection: CollectionId, slug: string): Promise<Article | null> {
  const meta = allArticles(collection).find((a) => a.slug === slug);
  if (!meta) return null;
  const { content } = read(collection, `${slug}.md`);
  const { chunks, toc } = await renderMarkdown(content);
  return { ...meta, chunks, toc };
}

export const readingMinutes = (words: number) => Math.max(1, Math.round(words / 220));

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
