#!/usr/bin/env node
// Scans ../demo-apps and writes src/generated/showcase.json. The starter plus every finished
// demo app feed the landing frames; demo apps also become /showcase/ pages. Featured shots are
// copied from demo-apps/<slug>/previews/ into public/showcase/<slug>/ so the static export can
// serve them. public/showcase/ is generated; demo-apps/<slug>/previews/ is the source.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const website = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(website, "..");
const demoRoot = path.join(repo, "demo-apps");
const starterFile = path.join(website, "content", "showcase-starter.json");
const catalogFile = path.join(website, "src", "generated", "showcase.json");
const publicShowcase = path.join(website, "public", "showcase");
const PLATFORMS = ["ios", "android", "web"];
const APPEARANCES = ["light", "dark"];
const MAX_SCREENS = 5;

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function chromeTitle(name, screen) {
  const webPath = (screen.webPath ?? "/").split(/\s+/)[0] || "/";
  if (webPath === "/") return name;
  return `${screen.label} · ${name}`;
}

function shotName(platform, screenId, appearance) {
  return `${platform}-${screenId}-${appearance}.webp`;
}

function featuredScreens(screens) {
  const marked = screens.filter((screen) => screen.showcase === true);
  if (marked.length) return marked.slice(0, MAX_SCREENS);
  const picked = [];
  const signedOut = screens.find((screen) => !screen.signedIn);
  const signedIn = screens.find((screen) => screen.signedIn);
  if (signedOut) picked.push(signedOut);
  if (signedIn && signedIn !== signedOut) picked.push(signedIn);
  if (!picked.length) return screens.slice(0, MAX_SCREENS);
  return picked.slice(0, MAX_SCREENS);
}

function missingShots(dir, screens) {
  const missing = [];
  for (const screen of screens) {
    for (const platform of PLATFORMS) {
      for (const appearance of APPEARANCES) {
        const file = path.join(dir, platform, `${screen.id}-${appearance}.webp`);
        if (!existsSync(file)) missing.push(path.relative(dir, file));
      }
    }
  }
  return missing;
}

const MARK_FALLBACK = "#4F46E5";

export function brandMark(root, shots) {
  const fromShots = typeof shots?.mark === "string" ? shots.mark.trim() : "";
  if (fromShots) return fromShots;
  const tokensFile = path.join(root, "contracts", "tokens.json");
  if (!existsSync(tokensFile)) return MARK_FALLBACK;
  try {
    const tokens = readJson(tokensFile);
    const primary = tokens.color?.primary?.light;
    return typeof primary === "string" && primary.trim() ? primary.trim() : MARK_FALLBACK;
  } catch {
    return MARK_FALLBACK;
  }
}

function productSummary(root, fallback) {
  const file = path.join(root, "PRODUCT.md");
  if (!existsSync(file)) return fallback;
  const markdown = readFileSync(file, "utf8");
  const start = markdown.indexOf("## In one sentence");
  if (start < 0) return fallback;
  const rest = markdown.slice(start + "## In one sentence".length).trim();
  const end = rest.search(/\n##\s/);
  const paragraph = (end < 0 ? rest : rest.slice(0, end)).replace(/\s+/g, " ").trim();
  return paragraph || fallback;
}

function entryFromScreens({ slug, name, summary, mark, shotPrefix, screens }) {
  return {
    slug,
    name,
    summary,
    mark,
    shotPrefix,
    screens: screens.map((screen) => {
      const webPath = (screen.webPath ?? "/").split(/\s+/)[0] || "/";
      return {
        id: screen.id,
        label: screen.label,
        webPath,
        title: chromeTitle(name, { ...screen, webPath }),
      };
    }),
  };
}

function loadStarter() {
  if (!existsSync(starterFile)) {
    throw new Error(`Missing ${path.relative(website, starterFile)}`);
  }
  const starter = readJson(starterFile);
  if (!starter.slug || !starter.name || !Array.isArray(starter.screens) || !starter.screens.length) {
    throw new Error("content/showcase-starter.json needs slug, name and screens.");
  }
  return entryFromScreens({
    slug: starter.slug,
    name: starter.name,
    summary: starter.summary || "The starter app every project begins with.",
    mark: starter.mark || "#4F46E5",
    shotPrefix: "/geeknative/screens",
    screens: starter.screens,
  });
}

function copyPreviewShots(root, dest, screens) {
  mkdirSync(dest, { recursive: true });
  for (const screen of screens) {
    for (const platform of PLATFORMS) {
      for (const appearance of APPEARANCES) {
        copyFileSync(
          path.join(root, "previews", platform, `${screen.id}-${appearance}.webp`),
          path.join(dest, shotName(platform, screen.id, appearance)),
        );
      }
    }
  }
}

function loadDemoApp(slug) {
  const root = path.join(demoRoot, slug);
  const appFile = path.join(root, "contracts", "app.json");
  const shotsFile = path.join(root, "previews", "shots.json");
  if (!existsSync(appFile) || !existsSync(shotsFile)) {
    console.warn(`showcase: skip ${slug} (needs contracts/app.json and previews/shots.json)`);
    return null;
  }

  let app;
  try {
    app = readJson(appFile);
  } catch (error) {
    console.warn(`showcase: skip ${slug} (${error instanceof Error ? error.message : "invalid JSON"})`);
    return null;
  }
  if (!app.name) {
    console.warn(`showcase: skip ${slug} (missing name)`);
    return null;
  }

  let shots;
  try {
    shots = readJson(shotsFile);
  } catch (error) {
    console.warn(`showcase: skip ${slug} (${error instanceof Error ? error.message : "invalid shots.json"})`);
    return null;
  }
  if (!Array.isArray(shots.screens) || !shots.screens.length) {
    console.warn(`showcase: skip ${slug} (previews/shots.json has no screens)`);
    return null;
  }

  const screens = featuredScreens(shots.screens);
  const missing = missingShots(path.join(root, "previews"), screens);
  if (missing.length) {
    console.warn(`showcase: skip ${slug} (missing shots: ${missing.join(", ")})`);
    return null;
  }

  copyPreviewShots(root, path.join(publicShowcase, slug), screens);
  return entryFromScreens({
    slug,
    name: app.name,
    summary: productSummary(root, app.name),
    mark: brandMark(root, shots),
    shotPrefix: `/geeknative/showcase/${slug}`,
    screens,
  });
}

function loadDemoApps() {
  if (!existsSync(demoRoot)) return [];
  const slugs = readdirSync(demoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  const apps = [];
  for (const slug of slugs) {
    const app = loadDemoApp(slug);
    if (app) apps.push(app);
  }
  return apps;
}

function main() {
  if (existsSync(publicShowcase)) rmSync(publicShowcase, { recursive: true, force: true });
  mkdirSync(path.dirname(catalogFile), { recursive: true });
  const starter = loadStarter();
  const demos = loadDemoApps();
  const catalog = { apps: [starter, ...demos] };
  writeFileSync(catalogFile, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`showcase: ${catalog.apps.map((app) => `${app.slug} (${app.screens.length})`).join(", ")}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
