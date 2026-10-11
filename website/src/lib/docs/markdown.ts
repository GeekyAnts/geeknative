import rehypeShiki from "@shikijs/rehype";
import type { Element, Root as HastRoot } from "hast";
import { toString } from "hast-util-to-string";
import type { Root as MdastRoot } from "mdast";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { BASE_PATH } from "./nav";
import { geeknativeTheme } from "./theme";

export interface TocItem {
  depth: 2 | 3;
  id: string;
  text: string;
}

/** A rendered page: HTML, with named components (embeds) between the HTML parts. */
export type Chunk = { type: "html"; html: string } | { type: "embed"; name: Embed };
export type Embed = "architecture" | "showcase";

const CALLOUTS: Record<string, string> = { note: "Note", tip: "Tip", caution: "Caution" };

// `:::note` / `:::tip` / `:::caution` become callouts. Any other directive syntax is put back as
// the text it was, so a stray `word:other` in prose survives.
function remarkCallouts() {
  return (tree: MdastRoot) => {
    visit(tree, (node, index, parent) => {
      const n = node as unknown as { type: string; name: string; children?: unknown[]; data?: Record<string, unknown> };
      if (n.type === "containerDirective" && CALLOUTS[n.name]) {
        n.data = { hName: "aside", hProperties: { className: ["callout", `callout-${n.name}`], "data-label": CALLOUTS[n.name] } };
        return;
      }
      if (!parent || index === undefined) return;
      if (n.type === "textDirective") {
        const restored = [{ type: "text", value: `:${n.name}` }, ...((n.children as unknown[]) ?? [])];
        (parent.children as unknown[]).splice(index, 1, ...restored);
        return index + restored.length;
      }
      if (n.type === "leafDirective" || n.type === "containerDirective") {
        const restored = n.type === "leafDirective" ? [{ type: "paragraph", children: [{ type: "text", value: `::${n.name}` }] }] : (n.children ?? []);
        (parent.children as unknown[]).splice(index, 1, ...restored);
        return index + restored.length;
      }
    });
  };
}

// Collects h2 and h3 headings (after rehype-slug gave them ids) for "On this page".
function rehypeToc(toc: TocItem[]) {
  return () => (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && typeof node.properties?.id === "string") {
        toc.push({ depth: node.tagName === "h2" ? 2 : 3, id: node.properties.id, text: toString(node).trim() });
      }
    });
  };
}

// Site-absolute links ("/docs/...") get the GitHub Pages base path. Tables get a scroll wrapper.
function rehypeSiteLinks() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName === "a" && typeof node.properties?.href === "string") {
        const href = node.properties.href;
        if (href.startsWith("/") && !href.startsWith("//") && !href.startsWith(`${BASE_PATH}/`)) {
          node.properties.href = `${BASE_PATH}${href}`;
        }
        if (/^https?:\/\//.test(href)) node.properties.rel = ["noreferrer"];
      }
      if (node.tagName === "table" && parent && index !== undefined) {
        const wrapper: Element = { type: "element", tagName: "div", properties: { className: ["table-wrap"] }, children: [node] };
        (parent.children as unknown[])[index] = wrapper;
        return ["skip", index + 1];
      }
    });
  };
}

const EMBED = /<p>\{\{(architecture|showcase)\}\}<\/p>/;

export async function renderMarkdown(source: string): Promise<{ chunks: Chunk[]; toc: TocItem[] }> {
  const toc: TocItem[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCallouts)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeToc(toc))
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      test: ["h2", "h3"],
      properties: { className: ["heading-anchor"], ariaHidden: "true", tabIndex: -1 },
      content: { type: "text", value: "#" },
    })
    .use(rehypeShiki, {
      theme: geeknativeTheme,
      langs: ["sh", "bash", "json", "md", "ts", "tsx", "swift", "kotlin", "yaml", "xml", "css", "makefile"],
      defaultLanguage: "text",
      fallbackLanguage: "text",
      transformers: [
        {
          name: "geeknative:label",
          pre(node) {
            node.properties["data-language"] = this.options.lang === "sh" ? "shell" : this.options.lang;
          },
        },
      ],
    })
    .use(rehypeSiteLinks)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(source);

  const chunks: Chunk[] = [];
  const parts = String(file).split(EMBED);
  parts.forEach((part, i) => {
    if (i % 2 === 1) chunks.push({ type: "embed", name: part as Embed });
    else if (part.trim()) chunks.push({ type: "html", html: part });
  });
  return { chunks, toc };
}
