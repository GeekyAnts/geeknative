// Links, navigation and shared copy for the site.

export const links = {
  github: "https://github.com/GeekyAnts/geeknative",
  npm: "https://www.npmjs.com/package/geeknative",
  issues: "https://github.com/GeekyAnts/geeknative/issues",
  releases: "https://github.com/GeekyAnts/geeknative/releases",
  geekyants: "https://geekyants.com",
  colony: "https://colony.geekyants.com",
  openSource: "https://geekyants.com/open-source",
  hire: "https://geekyants.com/hire",
};

/**
 * The GeekyAnts Hire page, where the contact form is. `placement` names where the link sits
 * (nav, footer, closing, article, ...) so enquiries can be traced back to it.
 */
export const hireUrl = (placement: string) =>
  `${links.hire}?utm_source=geeknative&utm_medium=website&utm_campaign=talk-to-the-team&utm_content=${encodeURIComponent(placement)}`;

export const createCommand = 'npm create geeknative@latest my-app -- --name "My App" --id com.acme.myapp';

export const nav = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Use cases", href: "/use-cases/" },
  { label: "Compare", href: "/compare/" },
  { label: "Showcase", href: "/showcase/" },
  { label: "Blog", href: "/blog/" },
  { label: "Docs", href: "/docs/" },
];

export const footer = {
  learn: [
    { label: "Use cases", href: "/use-cases/" },
    { label: "Compare", href: "/compare/" },
    { label: "Showcase", href: "/showcase/" },
    { label: "Blog", href: "/blog/" },
    { label: "vs React Native", href: "/compare/react-native/" },
    { label: "vs Flutter", href: "/compare/flutter/" },
  ],
  docs: [
    { label: "Quick start", href: "/docs/start-here/quick-start/" },
    { label: "How it works", href: "/docs/concepts/how-it-works/" },
    { label: "Working with your agent", href: "/docs/guides/working-with-your-agent/" },
    { label: "CLI reference", href: "/docs/reference/cli/" },
    { label: "Contracts", href: "/docs/reference/contracts/" },
  ],
  project: [
    { label: "GitHub", href: links.github },
    { label: "npm", href: links.npm },
    { label: "Releases", href: links.releases },
    { label: "Roadmap", href: "/docs/project/roadmap/" },
    { label: "Contributing", href: "/docs/project/contributing/" },
  ],
  geekyants: [
    { label: "Talk to the team", href: hireUrl("footer") },
    { label: "geekyants.com", href: links.geekyants },
    { label: "The colony", href: links.colony },
    { label: "Open source", href: links.openSource },
  ],
};
