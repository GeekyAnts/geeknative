// Copies project assets that geeknative doesn't generate into each app:
// - contracts/catalog.json, the demonstration restaurant catalog
// - contracts/fonts/display/*.ttf, the serif display typeface (Cormorant Garamond)
// `node scripts/assets.mjs` writes them; `node scripts/assets.mjs --check` fails if any copy is stale.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')

const androidFontName = (file) =>
  `display_${path
    .basename(file, '.ttf')
    .replace(/^CormorantGaramond-/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()}.ttf`

const displayFonts = readdirSync(path.join(root, 'contracts/fonts/display')).filter((f) => f.endsWith('.ttf'))

const copies = [
  ['contracts/catalog.json', 'apps/ios/App/Resources/catalog.json'],
  ['contracts/catalog.json', 'apps/android/app/src/main/assets/catalog.json'],
  ['contracts/catalog.json', 'apps/web/src/data/catalog.json'],
  ...displayFonts.flatMap((f) => [
    [`contracts/fonts/display/${f}`, `apps/ios/App/Resources/Fonts/${f}`],
    [`contracts/fonts/display/${f}`, `apps/android/app/src/main/res/font/${androidFontName(f)}`],
    [`contracts/fonts/display/${f}`, `apps/web/src/assets/fonts/${f}`],
  ]),
]

const stale = []
for (const [from, to] of copies) {
  const source = path.join(root, from)
  const target = path.join(root, to)
  const same = existsSync(target) && readFileSync(source).equals(readFileSync(target))
  if (same) continue
  if (check) {
    stale.push(to)
    continue
  }
  mkdirSync(path.dirname(target), { recursive: true })
  copyFileSync(source, target)
  console.log(`✔ assets     ${to}`)
}

if (check && stale.length) {
  console.error(`✖ assets     out of date: ${stale.join(', ')}. Run \`make assets\`.`)
  process.exit(1)
}
if (check) console.log('✔ assets     up to date')
