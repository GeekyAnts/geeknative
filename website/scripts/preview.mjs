// Serves the static export (out/) under /geeknative/, the way GitHub Pages does.
// Usage: npm run build && npm run preview   (then open http://localhost:4410/geeknative/)
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const BASE = "/geeknative";
const PORT = Number(process.env.PORT ?? 4410);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".wasm": "application/wasm",
  ".pf_meta": "application/octet-stream",
  ".pf_index": "application/octet-stream",
  ".pf_fragment": "application/octet-stream",
};

function resolve(urlPath) {
  if (!urlPath.startsWith(`${BASE}/`) && urlPath !== BASE) return null;
  const rel = decodeURIComponent(urlPath.slice(BASE.length)) || "/";
  const file = path.join(OUT, rel);
  if (!file.startsWith(OUT)) return null;
  if (existsSync(file) && statSync(file).isFile()) return file;
  const index = path.join(file, "index.html");
  if (existsSync(index)) return index;
  return null;
}

if (!existsSync(OUT)) {
  console.error("out/ is missing. Run `npm run build` first.");
  process.exit(1);
}

http
  .createServer((req, res) => {
    const urlPath = new URL(req.url ?? "/", "http://localhost").pathname;
    if (urlPath === "/") {
      res.writeHead(302, { location: `${BASE}/` }).end();
      return;
    }
    // Directories are served with a trailing slash, as on GitHub Pages.
    if (urlPath === BASE || (!path.extname(urlPath) && !urlPath.endsWith("/") && resolve(`${urlPath}/`))) {
      res.writeHead(301, { location: `${urlPath}/` }).end();
      return;
    }
    const file = resolve(urlPath);
    const target = file ?? path.join(OUT, "404.html");
    res.writeHead(file ? 200 : 404, { "content-type": TYPES[path.extname(target)] ?? "application/octet-stream" });
    createReadStream(target).pipe(res);
  })
  .listen(PORT, () => console.log(`Serving out/ at http://localhost:${PORT}${BASE}/`));
