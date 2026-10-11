// The docs, in reading order. Each page is content/docs/<section>/<page>.md.

export const BASE_PATH = "/geeknative";

export const DOCS_SECTIONS = [
  { id: "start-here", title: "Start here", pages: ["introduction", "quick-start", "requirements"] },
  {
    id: "guides",
    title: "Guides",
    pages: ["working-with-your-agent", "idea-to-three-apps", "design-changes", "claude-code", "other-agents"],
  },
  {
    id: "concepts",
    title: "Concepts",
    pages: ["how-it-works", "project-structure", "architecture", "specs-and-parity", "file-ownership"],
  },
  { id: "reference", title: "Reference", pages: ["cli", "contracts", "platforms"] },
  { id: "project", title: "Project", pages: ["roadmap", "contributing", "changelog"] },
] as const;

export const EDIT_BASE = "https://github.com/GeekyAnts/geeknative/edit/main/website/content/docs/";

/** "/docs/reference/cli/" → "/docs/reference/cli" (for comparing paths with or without a trailing slash). */
export const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
