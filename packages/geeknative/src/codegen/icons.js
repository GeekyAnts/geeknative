// @ts-check
import path from 'node:path'
import { readJson } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { assertIdentifier, banner, OUT, swiftString } from './util.js'

const SOURCE = 'contracts/icons.json'
const ANDROID_ICON = /^Icons\.(AutoMirrored\.)?(Filled|Outlined|Rounded|Sharp|TwoTone)\.([A-Z][A-Za-z0-9]*)$/
const LUCIDE_ICON = /^[A-Z][A-Za-z0-9]*$/

/**
 * @typedef {{ ios: string, android: string, web: string }} Icon
 * @typedef {{ path: string, content: string | Buffer }} Output
 */

/** @param {string} root @returns {Record<string, Icon>} */
export function readIcons(root) {
  const raw = readJson(path.join(root, 'contracts', 'icons.json'), SOURCE)
  /** @type {Record<string, Icon>} */
  const icons = {}
  for (const [name, value] of Object.entries(raw)) {
    if (name.startsWith('$')) continue
    assertIdentifier(name, `${SOURCE} icon`)
    const where = `${SOURCE} "${name}"`
    const { ios, android, web } = value ?? {}
    if (typeof ios !== 'string' || !ios) throw new CliError(`${where} needs "ios": an SF Symbol name like "gearshape".`)
    if (typeof android !== 'string' || !ANDROID_ICON.test(android)) {
      throw new CliError(`${where} needs "android": a Material icon like "Icons.Filled.Settings" or "Icons.AutoMirrored.Filled.ArrowBack".`)
    }
    if (typeof web !== 'string' || !LUCIDE_ICON.test(web)) throw new CliError(`${where} needs "web": a Lucide icon name like "Settings".`)
    icons[name] = { ios, android, web }
  }
  return icons
}

/** @param {Record<string, Icon>} icons @returns {Output[]} */
export function iconOutputs(icons) {
  const entries = Object.entries(icons).sort(([a], [b]) => (a < b ? -1 : 1))
  return [
    { path: `${OUT.iosGenerated}/Icons.swift`, content: swift(entries) },
    { path: `${OUT.androidKotlin}/Icons.kt`, content: kotlin(entries) },
    { path: `${OUT.webGenerated}/icons.ts`, content: typescript(entries) },
  ]
}

/** @param {[string, Icon][]} entries */
function swift(entries) {
  return `// ${banner(SOURCE)}

/// Icons as SF Symbol names. Use with \`Image(systemName: AppIcon.settings)\`.
nonisolated enum AppIcon {
${entries.map(([name, icon]) => `    static let ${name} = ${swiftString(icon.ios)}`).join('\n')}
}
`
}

/** @param {[string, Icon][]} entries */
function kotlin(entries) {
  const imports = new Set(['androidx.compose.material.icons.Icons', 'androidx.compose.ui.graphics.vector.ImageVector'])
  for (const [, icon] of entries) {
    const [, mirrored, style, name] = /** @type {RegExpMatchArray} */ (icon.android.match(ANDROID_ICON))
    imports.add(`androidx.compose.material.icons.${mirrored ? 'automirrored.' : ''}${style.toLowerCase()}.${name}`)
  }
  return `// ${banner(SOURCE)}
package app.generated

${[...imports].sort().map((i) => `import ${i}`).join('\n')}

/** Icons as Material icons. Use with \`Icon(AppIcons.settings, contentDescription = ...)\`. */
object AppIcons {
${entries.map(([name, icon]) => `    val ${name}: ImageVector get() = ${icon.android}`).join('\n')}
}
`
}

/** @param {[string, Icon][]} entries */
function typescript(entries) {
  const components = [...new Set(entries.map(([, icon]) => icon.web))].sort()
  return `// ${banner(SOURCE)}
import { ${components.join(', ')} } from 'lucide-react'

/** Icons as Lucide components. Use as \`<AppIcons.settings className="size-6" />\`. */
export const AppIcons = {
${entries.map(([name, icon]) => `  ${name}: ${icon.web},`).join('\n')}
} as const
`
}
