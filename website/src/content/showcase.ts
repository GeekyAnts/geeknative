// Apps shown on /showcase/. A folder under demo-apps is not enough to appear here:
// add an entry, then capture screenshots into public/screens/<slug>/.

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
  screens: ShowcaseScreen[];
};

export const showcaseApps: ShowcaseApp[] = [
  {
    slug: "dine-in",
    name: "The Dining Club",
    summary: "Members discover Mumbai's most exceptional restaurants and reserve a table in a few steps.",
    mark: "#35251E",
    screens: [
      { id: "discover", label: "Discover", path: "/", title: "Discover · The Dining Club" },
      { id: "explore", label: "Explore", path: "/explore", title: "Explore · The Dining Club" },
      { id: "restaurant", label: "Restaurant", path: "/restaurants/maison-lumiere", title: "Maison Lumière · The Dining Club" },
      { id: "reserve", label: "Reserve", path: "/restaurants/maison-lumiere/reserve", title: "Reserve a table · The Dining Club" },
      { id: "confirmation", label: "Confirmation", path: "/reservations/e47315ca-32cd-4b5e-83bf-9c78f0d8706a/confirmation", title: "Your table awaits · The Dining Club" },
    ],
  },
];

export const showcaseHref = (slug: string) => `/showcase/${slug}/`;

export const getShowcase = (slug: string) => showcaseApps.find((app) => app.slug === slug);
