// @ts-check
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseFont } from '../lib/fontfile.js'
import { readJson } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { cssMotion, kotlinElevation, kotlinMotion, kotlinMotionImports, readElevation, readMotion, swiftElevation, swiftMotion } from './motion.js'
import { assertIdentifier, banner, hex2, kebab, OUT, parseHex, swiftString, xcodeJson } from './util.js'

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

/** Dynamic Type styles and their point size at the default (Large) text size. */
const IOS_TEXT_STYLE_SIZES = {
  largeTitle: 34, title: 28, title2: 22, title3: 20, headline: 17, subheadline: 15, body: 17, callout: 16, footnote: 13, caption: 12, caption2: 11,
}
const IOS_TEXT_STYLES = new Set(Object.keys(IOS_TEXT_STYLE_SIZES))

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
 * @typedef {{ size: number, lineHeight: number, weight: number, ios: string, android: string | null }} TextToken (`android`: the Material 3 role it fills, if any)
 * @typedef {{ file: string, postScriptName: string, data: Buffer, web: string, webData: Buffer }} Face one weight of the font
 * @typedef {{ family: 'system' } | { family: string, faces: Record<number, Face> }} FontSpec
 * @typedef {{
 *   colors: Record<string, ColorToken>,
 *   spacing: Record<string, number>,
 *   radius: Record<string, number>,
 *   icon: Record<string, number>,
 *   size: Record<string, number>,
 *   typography: Record<string, TextToken>,
 *   font: FontSpec,
 *   motion: import('./motion.js').Motion,
 *   elevation: Record<string, import('./motion.js').Shadow>,
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
  const icon = readNumbers(raw.icon, 'icon')
  // Fixed sizes of things (touch targets, avatars, dots). On the web they share Tailwind's
  // spacing scale with the spacing tokens, so the names can't overlap.
  const size = readNumbers(raw.size, 'size')
  for (const name of Object.keys(size)) {
    if (spacing[name] !== undefined) throw new CliError(`${SOURCE} size.${name} has the same name as spacing.${name}: on the web both become --spacing-${kebab(name)}. Rename one.`)
    if (name.startsWith('icon')) throw new CliError(`${SOURCE} size.${name} can't start with "icon": icon sizes use those names on the web.`)
  }

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
    // Optional: a style without one is AppTypography.x on Android but restyles no stock Material component.
    if (android !== undefined && !M3_TEXT_SLOTS.has(android)) {
      throw new CliError(`${where} "android", when given, must be a Material 3 type style: ${[...M3_TEXT_SLOTS].join(', ')}. Leave it out for a style no stock Material component should use.`)
    }
    typography[name] = { size, lineHeight, weight, ios, android: android ?? null }
  }
  for (const name of ['body']) {
    if (!typography[name]) throw new CliError(`${SOURCE} typography needs a "${name}" style.`)
  }

  const font = readFont(root, raw.font, typography)
  if (font.family === 'system') {
    // Without a shared font, iOS text takes its size from the Dynamic Type style, so the contract
    // must agree with it or the three apps drift apart.
    for (const [name, t] of Object.entries(typography)) {
      const expected = IOS_TEXT_STYLE_SIZES[/** @type {keyof typeof IOS_TEXT_STYLE_SIZES} */ (t.ios)]
      if (t.size !== expected) {
        const alternative = Object.entries(IOS_TEXT_STYLE_SIZES).find(([, size]) => size === t.size)?.[0]
        throw new CliError(
          `${SOURCE} typography.${name} has size ${t.size}, but its iOS style "${t.ios}" is ${expected}pt: with the system font, iOS sizes come from Dynamic Type. ` +
            `Use ${expected}${alternative ? `, or map it to "${alternative}" (${t.size}pt)` : ''}, or set a shared font family.`,
        )
      }
    }
  }

  const motion = readMotion(raw.motion)
  const elevation = readElevation(raw.elevation, new Set(Object.keys(colors)))

  return { colors, spacing, radius, icon, size, typography, font, motion, elevation }
}

/**
 * The shared typeface: "system" for each platform's own font, or a family whose files sit in
 * contracts/fonts, one per weight. Every weight the type scale uses must have a file, so no
 * platform silently falls back to another face.
 * @param {string} root
 * @param {any} raw
 * @param {Record<string, TextToken>} typography
 * @returns {FontSpec}
 */
function readFont(root, raw, typography) {
  const family = raw?.family ?? 'system'
  if (typeof family !== 'string' || !family.trim()) {
    throw new CliError(`${SOURCE} font.family must be a font family name like "Inter", or "system".`)
  }
  if (family === 'system') {
    if (raw?.files !== undefined || raw?.web !== undefined) {
      throw new CliError(`${SOURCE} font.files only applies to a shared family. Remove it, or set font.family to the family those files hold.`)
    }
    return { family }
  }
  const hint = `Run \`make font FAMILY="${family}"\` to download the files and fill this in.`
  if (!raw.files || typeof raw.files !== 'object' || Array.isArray(raw.files) || !Object.keys(raw.files).length) {
    throw new CliError(`${SOURCE} font "${family}" needs "files": a map from weight to a file in contracts/fonts/, like { "400": "Inter-Regular.ttf" }. ${hint}`)
  }
  if (raw.web !== undefined && (!raw.web || typeof raw.web !== 'object' || Array.isArray(raw.web))) {
    throw new CliError(`${SOURCE} font.web must be a map from weight to a web font file, like { "400": "Inter-Regular.woff2" }.`)
  }
  /** @type {Record<number, Face>} */
  const faces = {}
  for (const [key, file] of Object.entries(raw.files)) {
    const weight = Number(key)
    if (!IOS_WEIGHTS[weight]) throw new CliError(`${SOURCE} font.files has a weight "${key}": weights are 100, 200, ... 900.`)
    if (typeof file !== 'string' || !/^[\w.-]+\.(ttf|otf)$/i.test(file)) {
      throw new CliError(`${SOURCE} font.files["${key}"] must name a .ttf or .otf file in contracts/fonts/.`)
    }
    const where = `contracts/fonts/${file}`
    const full = path.join(root, 'contracts', 'fonts', file)
    if (!existsSync(full)) throw new CliError(`${where} is missing (font.files["${key}"]). ${hint}`)
    const data = readFileSync(full)
    const info = parseFont(data, where)
    if (info.family !== family) throw new CliError(`${where} is "${info.family}", but font.family is "${family}".`)
    if (info.weight !== weight) throw new CliError(`${where} has weight ${info.weight}, but font.files lists it under "${key}".`)

    let web = file
    let webData = data
    const override = raw.web?.[key]
    if (override !== undefined) {
      if (typeof override !== 'string' || !/^[\w.-]+\.(woff2|woff|ttf|otf)$/i.test(override)) {
        throw new CliError(`${SOURCE} font.web["${key}"] must name a .woff2, .woff, .ttf or .otf file in contracts/fonts/.`)
      }
      const webFile = path.join(root, 'contracts', 'fonts', override)
      if (!existsSync(webFile)) throw new CliError(`contracts/fonts/${override} is missing (font.web["${key}"]).`)
      web = override
      webData = readFileSync(webFile)
    }
    faces[weight] = { file, postScriptName: info.postScriptName, data, web, webData }
  }
  for (const key of Object.keys(raw.web ?? {})) {
    if (!raw.files[key]) throw new CliError(`${SOURCE} font.web["${key}"] has no matching entry in font.files.`)
  }
  const missing = [...new Set(Object.values(typography).map((t) => t.weight))].filter((w) => !faces[w]).sort()
  if (missing.length) {
    throw new CliError(
      `${SOURCE} font "${family}" has no file for weight${missing.length > 1 ? 's' : ''} ${missing.join(', ')}, which typography uses. ` +
        `Add ${missing.map((w) => `"${w}"`).join(', ')} to font.files. ${hint}`,
    )
  }
  return { family, faces }
}

/** "Inter-Regular.ttf" → "generated_inter_regular" (an Android resource name). @param {string} file */
const androidFontName = (file) => `generated_${file.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/_+$/, '').toLowerCase()}`

/** @param {FontSpec} font @returns {[number, Face][]} weights in ascending order */
const faceEntries = (font) =>
  font.family === 'system' ? [] : Object.entries(font.faces).map(([w, f]) => /** @type {[number, Face]} */ ([Number(w), f])).sort(([a], [b]) => a - b)

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
  /** @type {Output[]} */
  const fonts = faceEntries(tokens.font).flatMap(([, face]) => [
    { path: `${OUT.iosGenerated}/Fonts/${face.file}`, content: face.data },
    { path: `${OUT.androidRes}/font/${androidFontName(face.file)}${path.extname(face.file).toLowerCase()}`, content: face.data },
    { path: `${OUT.webGenerated}/fonts/${face.web}`, content: face.webData },
  ])
  return [
    { path: `${OUT.iosGenerated}/Tokens.swift`, content: swift(tokens) },
    ...accentColorSet(tokens),
    { path: `${OUT.androidKotlin}/Tokens.kt`, content: kotlin(tokens) },
    { path: `${OUT.androidRes}/values/generated_colors.xml`, content: androidColorResources(tokens, 'light') },
    { path: `${OUT.androidRes}/values-night/generated_colors.xml`, content: androidColorResources(tokens, 'dark') },
    { path: `${OUT.webGenerated}/tokens.css`, content: css(tokens) },
    { path: `${OUT.webGenerated}/tokens.ts`, content: typescriptTokens(tokens) },
    ...fonts,
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
  const font = tokens.font
  const type = Object.entries(tokens.typography)
    .map(([name, t]) =>
      font.family === 'system'
        ? `    static let ${name}: Font = .${t.ios}.weight(.${IOS_WEIGHTS[t.weight]})`
        : `    static let ${name}: Font = .custom(${swiftString(font.faces[t.weight].postScriptName)}, size: ${t.size}, relativeTo: .${t.ios})`,
    )
    .join('\n')
  const typeDoc =
    font.family === 'system'
      ? '/// Text styles. Each maps to a Dynamic Type style, so it follows the user\'s text size setting.'
      : `/// Text styles in ${font.family}, the shared typeface. Each scales with its Dynamic Type style, so it follows the user's text size setting.`
  const files = faceEntries(font).map(([, face]) => `        ${swiftString(face.file)},`)

  return `// ${banner(SOURCE)}
import CoreText
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

/// Icon sizes, in points.
nonisolated enum AppIconSize {
${numbers(tokens.icon)}
}
${Object.keys(tokens.size).length ? `
/// Fixed sizes (touch targets and the like), in points.
nonisolated enum AppSize {
${numbers(tokens.size)}
}
` : ''}
${typeDoc}
nonisolated enum AppTypography {
${type}
}

/// Each text style's size in points at the default text size, for showing or computing with it
/// (the fonts above grow with Dynamic Type; these numbers don't).
nonisolated enum AppTextSize {
${Object.entries(tokens.typography).map(([name, t]) => `    static let ${name}: CGFloat = ${t.size}`).join('\n')}
}

/// The shared typeface's files, bundled from contracts/fonts. AppMain registers them at launch.
nonisolated enum AppFonts {
    static let files: [String] = [${files.length ? `\n${files.join('\n')}\n    ` : ''}]

    static func register() {
        for file in files {
            guard let url = Bundle.main.url(forResource: file, withExtension: nil) else { continue }
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}
${swiftMotion(tokens.motion)}${swiftElevation(tokens.elevation)}
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
  const faces = faceEntries(tokens.font)
  const family = faces.length ? 'fontFamily = AppFontFamily, ' : ''
  const styles = Object.entries(tokens.typography)
    .map(
      ([name, t]) =>
        `    val ${name} = TextStyle(${family}fontWeight = FontWeight.${KOTLIN_WEIGHTS[t.weight]}, fontSize = ${t.size}.sp, lineHeight = ${t.lineHeight}.sp)`,
    )
    .join('\n')
  const fontImports = faces.length ? '\nimport androidx.compose.ui.text.font.Font\nimport androidx.compose.ui.text.font.FontFamily' : ''
  const motionImports = kotlinMotionImports(tokens.motion).map((name) => `import ${name}\n`).join('')
  const dpImport = Object.keys(tokens.elevation).length ? 'import androidx.compose.ui.unit.Dp\n' : ''
  const fontFamily = faces.length
    ? `/** The shared typeface, ${tokens.font.family}, from contracts/fonts. */
val AppFontFamily = FontFamily(
${faces.map(([weight, face]) => `    Font(R.font.${androidFontName(face.file)}, FontWeight.${KOTLIN_WEIGHTS[weight]}),`).join('\n')}
)

`
    : ''
  const slots = Object.entries(tokens.typography)
    .filter(([, t]) => t.android)
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

${motionImports}import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle${fontImports}
import androidx.compose.ui.text.font.FontWeight
${dpImport}import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp${faces.length ? '\nimport app.R' : ''}

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

/** Icon sizes. */
object AppIconSize {
${numbers(tokens.icon)}
}
${Object.keys(tokens.size).length ? `
/** Fixed sizes (touch targets and the like). */
object AppSize {
${numbers(tokens.size)}
}
` : ''}
${fontFamily}/** Text styles, in sp so they follow the user's font size setting. */
object AppTypography {
${styles}
}

/** Each text style's size, the same numbers iOS and the web get (AppTypography.x.fontSize holds it too). */
object AppTextSize {
${Object.entries(tokens.typography).map(([name, t]) => `    val ${name} = ${t.size}.sp`).join('\n')}
}

/** The text styles mapped onto Material 3 type roles, so stock components use them. */
val AppMaterialTypography = Typography().copy(
${slots}
)

/** The radii mapped onto Material 3 shape roles. */
val AppShapes = Shapes(
${shapes}
)
${kotlinMotion(tokens.motion)}${kotlinElevation(tokens.elevation)}`
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

/**
 * The numeric tokens for code that needs the numbers themselves (showing a size, computing a
 * layout), as iOS and Android get them. Styling still uses the Tailwind classes from tokens.css.
 * @param {Tokens} tokens
 */
function typescriptTokens(tokens) {
  const group = (/** @type {string} */ name, /** @type {string} */ doc, /** @type {Record<string, number>} */ values) =>
    `/** ${doc} */\nexport const ${name} = {\n${Object.entries(values).map(([key, value]) => `  ${key}: ${value},`).join('\n')}\n} as const\n`
  const textSizes = Object.fromEntries(Object.entries(tokens.typography).map(([name, t]) => [name, t.size]))
  return [
    `// ${banner(SOURCE)}\n`,
    group('AppSpacing', 'Spacing, in px.', tokens.spacing),
    group('AppRadius', 'Corner radii, in px.', tokens.radius),
    group('AppIconSize', 'Icon sizes, in px.', tokens.icon),
    ...(Object.keys(tokens.size).length ? [group('AppSize', 'Fixed sizes (touch targets and the like), in px.', tokens.size)] : []),
    group('AppTextSize', "Each text style's size in px at the default text size (styles themselves are the text-* classes).", textSizes),
  ].join('\n')
}

/** Tailwind's container size names (--container-*), which width utilities also look up. */
const TAILWIND_CONTAINERS = new Set(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'])

/** @type {Record<string, string>} */
const CSS_FONT_FORMATS = { '.woff2': 'woff2', '.woff': 'woff', '.ttf': 'truetype', '.otf': 'opentype' }

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
  // Tailwind resolves w-*, min-w-* and max-w-* from --width/--min-width/--max-width, then
  // --spacing, then --container. A spacing token named like a container size (sm, md, xl, ...)
  // would turn max-w-md into 12px, so those names point back at the container sizes.
  const widthNames = [...Object.keys(tokens.spacing), ...Object.keys(tokens.size)].map(kebab).filter((name) => TAILWIND_CONTAINERS.has(name))
  const widths = widthNames
    .flatMap((name) => ['width', 'min-width', 'max-width'].map((prefix) => `  --${prefix}-${name}: var(--container-${name});`))
    .join('\n')
  const iconSizes = Object.entries(tokens.icon)
    .map(([name, value]) => `  --spacing-icon-${kebab(name)}: ${value}px;`)
    .join('\n')
  const fixedSizes = Object.entries(tokens.size)
    .map(([name, value]) => `  --spacing-${kebab(name)}: ${value}px;`)
    .join('\n')
  const motion = cssMotion(tokens.motion, tokens.elevation)
  const systemStack = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  const faces = faceEntries(tokens.font)
  const family = tokens.font.family.replace(/'/g, "\\'")
  const fontFaces = faces
    .map(
      ([weight, face]) => `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('./fonts/${face.web}') format('${CSS_FONT_FORMATS[path.extname(face.web).toLowerCase()]}');
}
`,
    )
    .join('\n')

  return `/* ${banner(SOURCE)} */
${fontFaces ? `\n/* The shared typeface, ${tokens.font.family}, from contracts/fonts. */\n${fontFaces}` : ''}
/*
 * Tailwind theme: bg-primary, text-on-surface, p-md, gap-lg, rounded-lg, text-title, size-icon-md, ...
 * Dark values apply when <html> has the "dark" class (see AppearanceEffect).
 */
@theme {
${colorVars('light', '  ')}

  /* shadcn/ui names, mapped onto the tokens above */
${aliases}

${numbers(tokens.spacing, 'spacing')}
${widths ? `\n  /* w-md, max-w-md, ... stay Tailwind's container widths; use w-(--spacing-md) for a spacing-sized width */\n${widths}\n` : ''}
${numbers(tokens.radius, 'radius')}

  /* icon sizes: size-icon-md, w-icon-lg, ... */
${iconSizes}
${fixedSizes ? `\n  /* fixed sizes: size-touch-target, min-h-touch-target, ... */\n${fixedSizes}\n` : ''}
${type}
${motion ? `\n${motion}\n` : ''}
  --font-sans: ${faces.length ? `'${family}', ` : ''}${systemStack};
}

.dark {
  color-scheme: dark;
${colorVars('dark', '  ')}
}
`
}
