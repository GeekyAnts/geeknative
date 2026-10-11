import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMarkdown, type Chunk, type TocItem } from "./markdown";
import { DOCS_SECTIONS, EDIT_BASE } from "./nav";

const ROOT = path.join(process.cwd(), "content", "docs");

export interface DocMeta {
  slug: string; // "reference/cli"
  href: string; // "/docs/reference/cli/"
  title: string;
  description: string;
  file: string; // "reference/cli.md"
  editUrl: string;
  section: { id: string; title: string; index: number };
}

export interface Doc extends DocMeta {
  chunks: Chunk[];
  toc: TocItem[];
}

let metaCache: DocMeta[] | null = null;

/** Every page, in sidebar order. Fails the build if a listed page is missing. */
export function allDocs(): DocMeta[] {
  if (metaCache) return metaCache;
  metaCache = DOCS_SECTIONS.flatMap((section, s) =>
    section.pages.map((page) => {
      const file = `${section.id}/${page}.md`;
      const full = path.join(ROOT, file);
      if (!fs.existsSync(full)) throw new Error(`Docs page missing: content/docs/${file}`);
      const { data } = matter(fs.readFileSync(full, "utf8"));
      if (typeof data.title !== "string") throw new Error(`content/docs/${file} needs a title in its front matter`);
      return {
        slug: `${section.id}/${page}`,
        href: `/docs/${section.id}/${page}/`,
        title: data.title,
        description: typeof data.description === "string" ? data.description : "",
        file,
        editUrl: `${EDIT_BASE}${file}`,
        section: { id: section.id, title: section.title, index: s + 1 },
      };
    }),
  );
  return metaCache;
}

export async function getDoc(slug: string): Promise<Doc | null> {
  const meta = allDocs().find((d) => d.slug === slug);
  if (!meta) return null;
  const { content } = matter(fs.readFileSync(path.join(ROOT, meta.file), "utf8"));
  const { chunks, toc } = await renderMarkdown(content);
  return { ...meta, chunks, toc };
}

export function neighbors(slug: string) {
  const docs = allDocs();
  const i = docs.findIndex((d) => d.slug === slug);
  return { prev: i > 0 ? docs[i - 1] : null, next: i >= 0 && i < docs.length - 1 ? docs[i + 1] : null };
}

/** Sidebar data: sections with their pages. */
export function sidebar() {
  const docs = allDocs();
  return DOCS_SECTIONS.map((section, s) => ({
    id: section.id,
    title: section.title,
    index: s + 1,
    pages: docs.filter((d) => d.section.id === section.id).map(({ href, title, description }) => ({ href, title, description })),
  }));
}

export type SidebarSection = ReturnType<typeof sidebar>[number];
