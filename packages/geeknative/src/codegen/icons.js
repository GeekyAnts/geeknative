// @ts-check
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { readJson } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { jsxPaths, shapeFromNodes, shapeFromSvg, svgDocument, vectorDrawable } from './svg.js'
import { assertIdentifier, banner, OUT, snakeKey, xcodeJson } from './util.js'

const SOURCE = 'contracts/icons.json'

/** Icon families geeknative ships: every icon in a project comes from one of them, or from an SVG file. */
const FAMILIES = { lucide: new URL('./catalogs/lucide.json', import.meta.url) }

/**
 * @typedef {import('./svg.js').Node} Node
 * @typedef {import('./svg.js').Shape} Shape
 * @typedef {{ version: string, viewBox: number, strokeWidth: number, icons: Record<string, Node[]> }} Catalog
 * @typedef {{ shape: Shape, mirrored: boolean }} Icon
 * @typedef {{ path: string, content: string | Buffer }} Output
 */

/** @type {Partial<Record<keyof typeof FAMILIES, Catalog>>} */
const catalogs = {}

/** @param {keyof typeof FAMILIES} family */
function catalog(family) {
  return (catalogs[family] ??= JSON.parse(readFileSync(FAMILIES[family], 'utf8')))
}

/** @param {string} root @returns {Record<string, Icon>} */
export function readIcons(root) {
  const raw = readJson(path.join(root, 'contracts', 'icons.json'), SOURCE)
  const family = raw.$family ?? 'lucide'
  if (!(family in FAMILIES)) {
    throw new CliError(`${SOURCE} "$family" must be "lucide": the icon family geeknative ships. Leave it out to use Lucide.`)
  }
  const set = catalog(family)
  const strokeWidth = raw.$strokeWidth ?? set.strokeWidth
  if (typeof strokeWidth !== 'number' || !(strokeWidth > 0)) {
    throw new CliError(`${SOURCE} "$strokeWidth" must be a positive number (${family} draws with ${set.strokeWidth}).`)
  }
  const style = { size: set.viewBox, strokeWidth }

  /** @type {Record<string, Icon>} */
  const icons = {}
  for (const [name, value] of Object.entries(raw)) {
    if (name.startsWith('$')) continue
    assertIdentifier(name, `${SOURCE} icon`)
    const where = `${SOURCE} "${name}"`
    const spec = typeof value === 'string' ? { icon: value } : value
    if (!spec || typeof spec !== 'object' || (spec.icon === undefined) === (spec.svg === undefined)) {
      throw new CliError(`${where} must be a ${family} icon name like "settings", or { "svg": "logo.svg" } for a file in contracts/icons/.`)
    }
    if (spec.mirrored !== undefined && typeof spec.mirrored !== 'boolean') {
      throw new CliError(`${where} "mirrored" must be true or false.`)
    }
    let shape
    if (spec.icon !== undefined) {
      const nodes = typeof spec.icon === 'string' ? set.icons[spec.icon] : undefined
      if (!nodes) {
        throw new CliError(`${where} "${spec.icon}" is not a Lucide icon. Browse https://lucide.dev/icons for names like "settings" or "arrow-left".`)
      }
      shape = shapeFromNodes(nodes, style, where)
    } else {
      if (typeof spec.svg !== 'string' || !/^[\w.-]+\.svg$/.test(spec.svg)) {
        throw new CliError(`${where} "svg" must be the name of an .svg file in contracts/icons/, like "logo.svg".`)
      }
      const file = path.join(root, 'contracts', 'icons', spec.svg)
      if (!existsSync(file)) throw new CliError(`${where}: contracts/icons/${spec.svg} is missing.`)
      shape = shapeFromSvg(readFileSync(file, 'utf8'), `contracts/icons/${spec.svg}`, style)
    }
    icons[name] = { shape, mirrored: spec.mirrored ?? false }
  }
  return icons
}

/** @param {string} name */
const drawableName = (name) => `generated_icon_${snakeKey(name)}`

/** @param {Record<string, Icon>} icons @returns {Output[]} */
export function iconOutputs(icons) {
  const entries = Object.entries(icons).sort(([a], [b]) => (a < b ? -1 : 1))
  const assets = `${OUT.iosGenerated}/Icons.xcassets`
  const info = { author: 'xcode', version: 1 }
  /** @type {Output[]} */
  const outputs = [
    { path: `${OUT.iosGenerated}/Icons.swift`, content: swift(entries) },
    { path: `${assets}/Contents.json`, content: `${xcodeJson({ info })}\n` },
    // Icons live in their own namespace, so they can't collide with images in Assets.xcassets.
    { path: `${assets}/icon/Contents.json`, content: `${xcodeJson({ info, properties: { 'provides-namespace': true } })}\n` },
    { path: `${OUT.androidKotlin}/Icons.kt`, content: kotlin(entries) },
    { path: `${OUT.webGenerated}/icons.tsx`, content: typescript(entries) },
  ]
  for (const [name, icon] of entries) {
    const imageset = `${assets}/icon/${name}.imageset`
    const image = { filename: `${name}.svg`, idiom: 'universal', ...(icon.mirrored ? { 'language-direction': 'left-to-right' } : {}) }
    outputs.push(
      {
        path: `${imageset}/Contents.json`,
        content: `${xcodeJson({
          images: [image],
          info,
          properties: { 'preserves-vector-representation': true, 'template-rendering-intent': 'template' },
        })}\n`,
      },
      { path: `${imageset}/${name}.svg`, content: svgDocument(icon.shape, banner(SOURCE)) },
      {
        path: `${OUT.androidRes}/drawable/${drawableName(name)}.xml`,
        content: vectorDrawable(icon.shape, { mirrored: icon.mirrored, banner: banner(SOURCE) }),
      },
    )
  }
  return outputs
}

/** @param {[string, Icon][]} entries */
function swift(entries) {
  return `// ${banner(SOURCE)}
import DeveloperToolsSupport
import SwiftUI

/// Icons, drawn from Icons.xcassets as template images. Use with \`Image(AppIcon.settings)\`.
nonisolated enum AppIcon {
${entries.map(([name]) => `    static let ${name} = ImageResource(name: "icon/${name}", bundle: .main)`).join('\n')}
}
`
}

/** @param {[string, Icon][]} entries */
function kotlin(entries) {
  return `// ${banner(SOURCE)}
package app.generated

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import app.R

/** Icons, drawn from res/drawable. Use with \`Icon(AppIcons.settings, contentDescription = ...)\`. */
object AppIcons {
${entries
  .map(([name]) => `    val ${name}: ImageVector\n        @Composable get() = ImageVector.vectorResource(R.drawable.${drawableName(name)})`)
  .join('\n')}
}
`
}

/** @param {[string, Icon][]} entries */
function typescript(entries) {
  const components = entries
    .map(([name, icon]) => {
      const props = `box={${icon.shape.size}} line={${icon.shape.strokeWidth}}${icon.mirrored ? ' mirrored' : ''}`
      return `  ${name}: (props: IconProps) => (\n    <Icon ${props} {...props}>\n${jsxPaths(icon.shape, '      ')}\n    </Icon>\n  ),`
    })
    .join('\n')
  return `// ${banner(SOURCE)}
import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ box, line, mirrored, className, children, ...props }: IconProps & { box: number; line: number; mirrored?: boolean; children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={\`0 0 \${box} \${box}\`}
      fill="none"
      stroke="currentColor"
      strokeWidth={line}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={mirrored ? ['rtl:-scale-x-100', className].filter(Boolean).join(' ') : className}
      {...props}
    >
      {children}
    </svg>
  )
}

/** Icons, as inline SVG components. Use as \`<AppIcons.settings className="size-icon-md" />\`. */
export const AppIcons = {
${components}
} as const
`
}
