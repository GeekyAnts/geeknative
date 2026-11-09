import { deviceShowcaseCatalog } from "@/lib/showcase-catalog";

export type ShowcaseScreen = {
  id: string;
  label: string;
  /** Path shown in the browser frame, matching the web app. */
  path: string;
  /** Browser tab title, matching the web app. */
  title: string;
};

export type ShowcaseApp = {
  slug: string;
  name: string;
  summary: string;
  /** Espresso (or the app's own dark brand color) for the browser tab mark. */
  mark: string;
  shotPrefix: string;
  screens: ShowcaseScreen[];
};

// Built by scripts/sync-showcase.mjs from demo-apps/<slug>/previews/. The starter stays on the landing frames only.
export const showcaseApps: ShowcaseApp[] = deviceShowcaseCatalog.apps
  .filter((app) => app.slug !== "starter")
  .map((app) => ({
    slug: app.slug,
    name: app.name,
    summary: app.summary,
    mark: app.mark,
    shotPrefix: app.shotPrefix,
    screens: app.screens.map((screen) => ({
      id: screen.id,
      label: screen.label,
      path: screen.webPath,
      title: screen.title,
    })),
  }));

export const showcaseHref = (slug: string) => `/showcase/${slug}/`;

export const getShowcase = (slug: string) => showcaseApps.find((app) => app.slug === slug);
