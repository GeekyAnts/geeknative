// @ts-check
import path from 'node:path'
import { readJson } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { assertIdentifier, banner, hex2, kebab, OUT, parseHex, xcodeJson } from './util.js'

const SOURCE = 'contracts/tokens.json'

/** Colors every app relies on. Projects can add more. */
const REQUIRED_COLORS = [
  'background',
  'onBackground',
  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'primary',
  'onPrimary',
  'outline',
  'error',
  'onError',
]

const IOS_TEXT_STYLES = new Set([
  'largeTitle', 'title', 'title2', 'title3', 'headline', 'subheadline', 'body', 'callout', 'footnote', 'caption', 'caption2',
])

const M3_TEXT_SLOTS = new Set([
  'displayLarge', 'displayMedium', 'displaySmall', 'headlineLarge', 'headlineMedium', 'headlineSmall',
  'titleLarge', 'titleMedium', 'titleSmall', 'bodyLarge', 'bodyMedium', 'bodySmall',
  'labelLarge', 'labelMedium', 'labelSmall',
])

/** @type {Record<number, string>} */
const IOS_WEIGHTS = { 100: 'ultraLight', 200: 'thin', 300: 'light', 400: 'regular', 500: 'medium', 600: 'semibold', 700: 'bold', 800: 'heavy', 900: 'black' }
/** @type {Record<number, string>} */
const KOTLIN_WEIGHTS = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Normal', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' }

/**
 * Material 3 color roles and the token each one is filled from. Screens and app bars sit on
 * `background` (as on iOS); `surface` is for cards and grouped content. A project token named
 * after a role (e.g. "secondary") replaces the default, except `surface` and `onSurface`.
 */
const M3_ROLES = {
  primary: 'primary',
  onPrimary: 'onPrimary',
  primaryContainer: 'surfaceVariant',
  onPrimaryContainer: 'onSurface',
  inversePrimary: 'primary',
  secondary: 'primary',
  onSecondary: 'onPrimary',
  secondaryContainer: 'surfaceVariant',
  onSecondaryContainer: 'onSurface',
  tertiary: 'primary',
  onTertiary: 'onPrimary',
  tertiaryContainer: 'surfaceVariant',
  onTertiaryContainer: 'onSurface',
  background: 'background',
  onBackground: 'onBackground',
  surface: 'background',
  onSurface: 'onBackground',
  surfaceVariant: 'surfaceVariant',
  onSurfaceVariant: 'onSurfaceVariant',
  surfaceTint: 'primary',
  inverseSurface: 'onBackground',
  inverseOnSurface: 'background',
  error: 'error',
  onError: 'onError',
  outline: 'outline',
  outlineVariant: 'outline',
  surfaceBright: 'background',
  surfaceDim: 'surfaceVariant',
  surfaceContainerLowest: 'background',
  surfaceContainerLow: 'surface',
  surfaceContainer: 'surface',
  surfaceContainerHigh: 'surface',
  surfaceContainerHighest: 'surface',
}

/** shadcn/ui variable names, mapped onto tokens so its components pick up the design. */
const SHADCN_ALIASES = {
  foreground: 'on-background',
  card: 'surface',
  'card-foreground': 'on-surface',
  popover: 'surface',
  'popover-foreground': 'on-surface',
  'primary-foreground': 'on-primary',
  secondary: 'surface-variant',
  'secondary-foreground': 'on-surface',
  muted: 'surface-variant',
  'muted-foreground': 'on-surface-variant',
  accent: 'surface-variant',
  'accent-foreground': 'on-surface',
  destructive: 'error',
  'destructive-foreground': 'on-error',
  border: 'outline',
  input: 'outline',
  ring: 'primary',
}

/**
 * @typedef {[number, number, number, number]} Rgba
 * @typedef {{ light: Rgba, dark: Rgba }} ColorToken
 * @typedef {{ size: number, lineHeight: number, weight: number, ios: string, android: string }} TextToken
 * @typedef {{
 *   colors: Record<string, ColorToken>,
 *   spacing: Record<string, number>,
 *   radius: Record<string, number>,
 *   typography: Record<string, TextToken>,
 * }} Tokens
 * @typedef {{ path: string, content: string | Buffer }} Output
 */

/** @param {string} root @returns {Tokens} */
export function readTokens(root) {
  const raw = readJson(path.join(root, 'contracts', 'tokens.json'), SOURCE)

  /** @type {Record<string, ColorToken>} */
  const colors = {}
  for (const [name, value] of Object.entries(raw.color ?? {})) {
    assertIdentifier(name, `${SOURCE} color`)
    if (!value || typeof value !== 'object') {
      throw new CliError(`${SOURCE} color.${name} must be an object like { "light": "#FFFFFF", "dark": "#000000" }.`)
    }
    const light = parseHex(value.light, `${SOURCE} color.${name}.light`)
    const dark = value.dark === undefined ? light : parseHex(value.dark, `${SOURCE} color.${name}.dark`)
    colors[name] = { light, dark }
  }
  const missing = REQUIRED_COLORS.filter((name) => !colors[name])
  if (missing.length) throw new CliError(`${SOURCE} is missing required colors: ${missing.join(', ')}.`)

  const spacing = readNumbers(raw.spacing, 'spacing')
  const radius = readNumbers(raw.radius, 'radius')

  /** @type {Record<string, TextToken>} */
  const typography = {}
  for (const [name, value] of Object.entries(raw.typography ?? {})) {
    assertIdentifier(name, `${SOURCE} typography`)
    const where = `${SOURCE} typography.${name}`
    const { size, lineHeight, weight, ios, android } = value ?? {}
    if (!(size > 0) || !(lineHeight > 0)) throw new CliError(`${where} needs positive "size" and "lineHeight" numbers.`)
    if (!IOS_WEIGHTS[weight]) throw new CliError(`${where} "weight" must be 100, 200, ... or 900.`)
    if (!IOS_TEXT_STYLES.has(ios)) {
      throw new CliError(`${where} "ios" must be a Dynamic Type style: ${[...IOS_TEXT_STYLES].join(', ')}.`)
    }
    if (!M3_TEXT_SLOTS.has(android)) {
      throw new CliError(`${where} "android" must be a Material 3 type style: ${[...M3_TEXT_SLOTS].join(', ')}.`)
    }
    typography[name] = { size, lineHeight, weight, ios, android }
  }
  for (const name of ['body']) {
    if (!typography[name]) throw new CliError(`${SOURCE} typography needs a "${name}" style.`)
  }

  const family = raw.font?.family ?? 'system'
  if (family !== 'system') {
    throw new CliError(
      `${SOURCE} font.family "${family}" isn't supported yet: codegen only handles "system" fonts. Keep "system" for now.`,
    )
  }

  return { colors, spacing, radius, typography }
}

/** @param {unknown} group @param {string} label */
function readNumbers(group, label) {
  /** @type {Record<string, number>} */
  const values = {}
  for (const [name, value] of Object.entries(group ?? {})) {
    assertIdentifier(name, `${SOURCE} ${label}`)
    if (typeof value !== 'number' || value < 0) throw new CliError(`${SOURCE} ${label}.${name} must be a number of 0 or more.`)
    values[name] = value
  }
  return values
}

/** @param {Tokens} tokens @returns {Output[]} */
export function tokenOutputs(tokens) {
  return [
    { path: `${OUT.iosGenerated}/Tokens.swift`, content: swift(tokens) },
    ...accentColorSet(tokens),
    { path: `${OUT.androidKotlin}/Tokens.kt`, content: kotlin(tokens) },
    { path: `${OUT.androidRes}/values/generated_colors.xml`, content: androidColorResources(tokens, 'light') },
    { path: `${OUT.androidRes}/values-night/generated_colors.xml`, content: androidColorResources(tokens, 'dark') },
    { path: `${OUT.webGenerated}/tokens.css`, content: css(tokens) },
  ]
}

// ---------- iOS ----------

/** @param {Rgba} c */
const swiftHex = ([r, g, b, a]) => `0x${hex2(r)}${hex2(g)}${hex2(b)}${hex2(a)}`

/** @param {Tokens} tokens */
function swift(tokens) {
  const colors = Object.entries(tokens.colors)
    .map(([name, c]) => `    static let ${name} = Color(light: ${swiftHex(c.light)}, dark: ${swiftHex(c.dark)})`)
    .join('\n')
  const numbers = (/** @type {Record<string, number>} */ group) =>
    Object.entries(group).map(([name, value]) => `    static let ${name}: CGFloat = ${value}`).join('\n')
  const type = Object.entries(tokens.typography)
    .map(([name, t]) => `    static let ${name}: Font = .${t.ios}.weight(.${IOS_WEIGHTS[t.weight]})`)
    .join('\n')

  return `// ${banner(SOURCE)}
import SwiftUI
import UIKit

/// Colors. Each one adapts to light and dark mode on its own.
nonisolated enum AppColors {
${colors}
}

/// Spacing, in points.
nonisolated enum AppSpacing {
${numbers(tokens.spacing)}
}

/// Corner radii, in points.
nonisolated enum AppRadius {
${numbers(tokens.radius)}
}

/// Text styles. Each maps to a Dynamic Type style, so it follows the user's text size setting.
nonisolated enum AppTypography {
${type}
}

private extension Color {
    nonisolated init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { traits in
            UIColor(rgba: traits.userInterfaceStyle == .dark ? dark : light)
        })
    }
}

private extension UIColor {
    nonisolated convenience init(rgba: UInt32) {
        self.init(
            red: CGFloat((rgba >> 24) & 0xFF) / 255,
            green: CGFloat((rgba >> 16) & 0xFF) / 255,
            blue: CGFloat((rgba >> 8) & 0xFF) / 255,
            alpha: CGFloat(rgba & 0xFF) / 255
        )
    }
}
`
}

/** The global accent color, so system controls use the brand's primary color. @param {Tokens} tokens */
function accentColorSet(tokens) {
  const dir = `${OUT.iosGenerated}/Colors.xcassets`
  const component = (/** @type {Rgba} */ [r, g, b, a]) => ({
    color: {
      'color-space': 'srgb',
      components: { alpha: (a / 255).toFixed(3), blue: `0x${hex2(b)}`, green: `0x${hex2(g)}`, red: `0x${hex2(r)}` },
    },
    idiom: 'universal',
  })
  const { light, dark } = tokens.colors.primary
  const info = { author: 'xcode', version: 1 }
  return [
    { path: `${dir}/Contents.json`, content: `${xcodeJson({ info })}\n` },
    {
      path: `${dir}/AccentColor.colorset/Contents.json`,
      content: `${xcodeJson({
        colors: [component(light), { appearances: [{ appearance: 'luminosity', value: 'dark' }], ...component(dark) }],
        info,
      })}\n`,
    },
  ]
}

// ---------- Android ----------

/** @param {Rgba} c */
const argb = ([r, g, b, a]) => `${hex2(a)}${hex2(r)}${hex2(g)}${hex2(b)}`

/** @param {Tokens} tokens */
function kotlin(tokens) {
  const names = Object.keys(tokens.colors)
  const fields = names.map((name) => `    val ${name}: Color,`).join('\n')
  const values = (/** @type {'light' | 'dark'} */ mode) =>
    names.map((name) => `    ${name} = Color(0x${argb(tokens.colors[name][mode])}),`).join('\n')
  const roles = Object.entries(M3_ROLES)
    .map(([role, fallback]) => {
      const own = tokens.colors[role] && role !== 'surface' && role !== 'onSurface'
      return `        ${role} = ${own ? role : fallback},`
    })
    .join('\n')
  const numbers = (/** @type {Record<string, number>} */ group) =>
    Object.entries(group).map(([name, value]) => `    val ${name} = ${value}.dp`).join('\n')
  const styles = Object.entries(tokens.typography)
    .map(
      ([name, t]) =>
        `    val ${name} = TextStyle(fontWeight = FontWeight.${KOTLIN_WEIGHTS[t.weight]}, fontSize = ${t.size}.sp, lineHeight = ${t.lineHeight}.sp)`,
    )
    .join('\n')
  const slots = Object.entries(tokens.typography)
    .map(([name, t]) => `    ${t.android} = AppTypography.${name},`)
    .join('\n')
  const shape = (/** @type {string} */ key) => (tokens.radius[key] !== undefined ? `RoundedCornerShape(AppRadius.${key})` : null)
  const shapes = [
    ['extraSmall', shape('xs') ?? shape('sm')],
    ['small', shape('sm')],
    ['medium', shape('md')],
    ['large', shape('lg')],
    ['extraLarge', shape('xl') ?? shape('lg')],
  ]
    .filter(([, value]) => value)
    .map(([slot, value]) => `    ${slot} = ${value},`)
    .join('\n')

  return `// ${banner(SOURCE)}
package app.generated

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Colors for one appearance (light or dark). In composables, read the current set with \`AppTheme.colors\`. */
@Immutable
data class AppColorTokens(
${fields}
)

val LightAppColors = AppColorTokens(
${values('light')}
)

val DarkAppColors = AppColorTokens(
${values('dark')}
)

/** Maps the tokens onto Material 3 color roles, so stock components match the design. */
fun AppColorTokens.toColorScheme(dark: Boolean): ColorScheme =
    (if (dark) darkColorScheme() else lightColorScheme()).copy(
${roles}
    )

/** Spacing. */
object AppSpacing {
${numbers(tokens.spacing)}
}

/** Corner radii. */
object AppRadius {
${numbers(tokens.radius)}
}

/** Text styles, in sp so they follow the user's font size setting. */
object AppTypography {
${styles}
}

/** The text styles mapped onto Material 3 type roles, so stock components use them. */
val AppMaterialTypography = Typography().copy(
${slots}
)

/** The radii mapped onto Material 3 shape roles. */
val AppShapes = Shapes(
${shapes}
)
`
}

/** Window background and other XML-side colors, with a night variant. @param {Tokens} tokens @param {'light' | 'dark'} mode */
function androidColorResources(tokens, mode) {
  const items = Object.entries(tokens.colors)
    .map(([name, c]) => `    <color name="token_${kebab(name).replace(/-/g, '_')}">#${argb(c[mode])}</color>`)
    .join('\n')
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${banner(SOURCE)} -->
<resources>
${items}
</resources>
`
}

// ---------- Web ----------

/** @param {Rgba} c */
const cssColor = ([r, g, b, a]) => `#${hex2(r)}${hex2(g)}${hex2(b)}${a === 255 ? '' : hex2(a)}`.toLowerCase()

/** @param {number} px */
const rem = (px) => `${Number((px / 16).toFixed(4))}rem`

/** @param {Tokens} tokens */
function css(tokens) {
  const colorVars = (/** @type {'light' | 'dark'} */ mode, /** @type {string} */ indent) =>
    Object.entries(tokens.colors)
      .map(([name, c]) => `${indent}--color-${kebab(name)}: ${cssColor(c[mode])};`)
      .join('\n')
  const own = new Set(Object.keys(tokens.colors).map(kebab))
  const aliases = Object.entries(SHADCN_ALIASES)
    .filter(([alias]) => !own.has(alias))
    .map(([alias, target]) => `  --color-${alias}: var(--color-${target});`)
    .join('\n')
  const numbers = (/** @type {Record<string, number>} */ group, /** @type {string} */ prefix) =>
    Object.entries(group)
      .map(([name, value]) => `  --${prefix}-${kebab(name)}: ${value >= 9999 ? 'calc(infinity * 1px)' : `${value}px`};`)
      .join('\n')
  const type = Object.entries(tokens.typography)
    .map(([name, t]) =>
      [
        `  --text-${kebab(name)}: ${rem(t.size)};`,
        `  --text-${kebab(name)}--line-height: ${rem(t.lineHeight)};`,
        `  --text-${kebab(name)}--font-weight: ${t.weight};`,
      ].join('\n'),
    )
    .join('\n')

  return `/* ${banner(SOURCE)} */

/*
 * Tailwind theme: bg-primary, text-on-surface, p-md, gap-lg, rounded-lg, text-title, ...
 * Dark values apply when <html> has the "dark" class (see AppearanceEffect).
 */
@theme {
${colorVars('light', '  ')}

  /* shadcn/ui names, mapped onto the tokens above */
${aliases}

${numbers(tokens.spacing, 'spacing')}

${numbers(tokens.radius, 'radius')}

${type}

  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.dark {
  color-scheme: dark;
${colorVars('dark', '  ')}
}
`
}
