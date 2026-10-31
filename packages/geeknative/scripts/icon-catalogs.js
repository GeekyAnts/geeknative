// Rebuilds src/codegen/catalogs/lucide.json: every Lucide icon as shape data, which `geeknative gen`
// draws natively in each app. Run it to move projects to a newer Lucide release:
//   node scripts/icon-catalogs.js 1.55.0
// Without a version it refreshes the one the catalog already has.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const catalogs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/codegen/catalogs')
const file = path.join(catalogs, 'lucide.json')

const version = process.argv[2] ?? JSON.parse(readFileSync(file, 'utf8')).version
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Expected a Lucide version like 1.55.0, got "${version}".`)

/** @param {string} url */
async function fetchText(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.text()
}

const base = `https://unpkg.com/lucide-static@${version}`
/** @type {Record<string, [string, Record<string, string>][]>} */
const nodes = JSON.parse(await fetchText(`${base}/icon-nodes.json`))
const icons = Object.fromEntries(Object.keys(nodes).sort().map((id) => [id, nodes[id]]))

// Lucide draws every icon on a 24-unit grid with a 2-unit stroke; the catalog records that so
// custom SVGs and other families can be checked against the same style.
writeFileSync(file, `${JSON.stringify({ version, viewBox: 24, strokeWidth: 2, icons })}\n`)
writeFileSync(path.join(catalogs, 'LUCIDE-LICENSE.txt'), `Lucide ${version}, https://lucide.dev\n\n${await fetchText(`${base}/LICENSE`)}`)
console.log(`wrote catalogs/lucide.json (${Object.keys(icons).length} icons from lucide-static ${version})`)
