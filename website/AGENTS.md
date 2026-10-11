# geeknative website

The landing page and documentation for geeknative: a static Next.js site (`output: "export"`) published to GitHub Pages at https://geekyants.github.io/geeknative/. Its design follows colony.geekyants.com: white paper, black type, one red (#CA0515), Archivo set wide, JetBrains Mono labels, and the ant colony drawing every figure.

## Layout

| Path | What it is |
|---|---|
| src/app/page.tsx, src/components/landing/ | The landing page, one component per section |
| src/lib/colony/ | The ant colony: engine and shaders adapted from colony.geekyants.com, plus geeknative's formations (mark, devices, flow, parity, markwhite, trail) |
| src/components/colony/ | The canvas, stages, and overlays that align labels with formations |
| src/components/showcase/ | The device frames with real app screenshots (public/screens/) |
| src/components/diagrams/ | The architecture diagram (also embedded in the docs with `{{architecture}}`) |
| content/docs/ | Docs pages in Markdown. Frontmatter: title, description. Callouts: `:::note`, `:::tip`, `:::caution` |
| src/app/docs/, src/components/docs/, src/lib/docs/ | The docs routes, layout, search (Pagefind) and Markdown pipeline |
| scripts/ | preview (serves out/ under /geeknative), check-links, deploy (pushes out/ to gh-pages) |

## Rules

- Internal links: in components use next/link (`href="/docs/..."`, the base path is added); plain `<a>` and image paths need the `/geeknative` prefix. In Markdown, link to `/docs/<section>/<page>/`.
- Document only what exists in the repo today (template/ and packages/geeknative/). Planned work belongs on the Roadmap page.
- Writing style: short, plain sentences. No em dashes or en dashes. Code samples must match real file names, commands and generated symbols.
- Screenshots are real captures of the starter app; regenerate them rather than editing them.
- The colony: every `ColonyStage` gets its own ants, and they stay in that stage. Unlike colony.geekyants.com, ants never travel between sections as the page scrolls, because that was distracting. Rebuilds after a resize place ants directly instead of walking them over.
- Scrolling is the browser's own. Don't add smooth-scroll or scroll-jacking libraries such as Lenis. The colony's canvas sits in the page and scrolls with it (it covers the viewport plus a margin and moves along each frame), so the ants stay locked to their figures under native scrolling.

## Commands

- `npm run dev`: dev server at http://localhost:3000/geeknative/ (search needs a build).
- `npm run build`: static export to out/, then the Pagefind index.
- `npm run check-links`: fails on broken internal links in out/.
- `npm run preview`: serves out/ at http://localhost:4410/geeknative/.
- `npm run deploy`: builds and pushes out/ to the gh-pages branch (CI does this on push to main).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
