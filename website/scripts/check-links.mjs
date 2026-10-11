// Checks every internal link and asset in the static export (out/): each href or src under
// /geeknative/ must resolve to a file. Exits 1 if any don't.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const BASE = "/geeknative";

if (!existsSync(OUT)) {
  console.error("out/ is missing. Run `npm run build` first.");
  process.exit(1);
}

/** @param {string} dir @returns {string[]} */
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

/** @param {string} url */
function exists(url) {
  const clean = decodeURIComponent(url.split("#")[0].split("?")[0]);
  if (!clean.startsWith(`${BASE}/`) && clean !== BASE) return true;
  const file = path.join(OUT, clean.slice(BASE.length));
  if (existsSync(file) && statSync(file).isFile()) return true;
  return existsSync(path.join(file, "index.html"));
}

const pages = walk(OUT).filter((f) => f.endsWith(".html"));
const failures = [];
let checked = 0;
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (!url.startsWith("/")) continue;
    checked++;
    if (!exists(url)) failures.push(`${path.relative(OUT, page)} → ${url}`);
  }
}

console.log(`Checked ${checked} internal links and assets in ${pages.length} pages.`);
if (failures.length) {
  console.error(`${failures.length} broken:\n${[...new Set(failures)].map((f) => `  ${f}`).join("\n")}`);
  process.exit(1);
}
console.log("No broken links.");
