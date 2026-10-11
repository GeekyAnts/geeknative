# geeknative website

The landing page and documentation for geeknative, built with Astro and Starlight and published to GitHub Pages at https://geekyants.github.io/geeknative/.

## Working here

- Pages live in src/content/docs/. The sidebar is defined in astro.config.mjs; add new pages there.
- The site is served under the `/geeknative` base. Write internal links with the base included (`/geeknative/reference/cli/`). The links validator fails the build on broken links.
- Document only what exists in the repo today (template/ and packages/geeknative/). Planned work belongs on the Roadmap page.
- Writing style: short, plain sentences. No em dashes or en dashes. Code samples must match real file names, commands and generated symbols.

## Commands

- `npm run dev`: dev server (use `astro dev --background` from agents; manage it with `astro dev stop`, `astro dev status`, `astro dev logs`).
- `npm run build`: builds to dist/ and validates links.
- `npm run preview`: serves the built site.

Astro docs: https://docs.astro.build. Starlight docs: https://starlight.astro.build.
