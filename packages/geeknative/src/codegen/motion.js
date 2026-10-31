// @ts-check
import { CliError } from '../lib/log.js'
import { assertIdentifier, kebab } from './util.js'

const SOURCE = 'contracts/tokens.json'

/**
 * Motion and elevation tokens: optional sections of contracts/tokens.json.
 *
 * - motion.duration: { "fast": 150 } in milliseconds
 * - motion.easing:   { "standard": [0.2, 0, 0, 1] } cubic-bezier control points
 * - motion.spring:   { "snappy": { "duration": 300, "bounce": 0.15 } } SwiftUI's spring model
 * - elevation:       { "low": { "y": 1, "blur": 3, "opacity": 0.12, "color": "primary" } } (color optional, black by default)
 *
 * A spring's duration and bounce map exactly onto Compose's damping ratio (1 - bounce) and
 * stiffness ((2π / duration)², mass 1). On the web it becomes a CSS linear() curve sampled from
 * the same spring, with the time it takes to settle as its duration.
 *
 * @typedef {{ x1: number, y1: number, x2: number, y2: number }} Easing
 * @typedef {{ duration: number, bounce: number }} Spring duration in ms, bounce in [0, 1)
 * @typedef {{ duration: Record<string, number>, easing: Record<string, Easing>, spring: Record<string, Spring> }} Motion
 * @typedef {{ y: number, blur: number, opacity: number, color: string | null }} Shadow
 */

/** @param {any} raw @returns {Motion} */
export function readMotion(raw) {
  /** @type {Motion} */
  const motion = { duration: {}, easing: {}, spring: {} }
  if (raw === undefined) return motion
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new CliError(`${SOURCE} motion must be an object with "duration", "easing" and "spring".`)
  for (const key of Object.keys(raw)) {
    if (!['duration', 'easing', 'spring'].includes(key)) throw new CliError(`${SOURCE} motion.${key} isn't a motion group: use duration, easing or spring.`)
  }
  const seen = new Map()
  /** @param {string} name @param {string} group */
  const claim = (name, group) => {
    assertIdentifier(name, `${SOURCE} motion.${group}`)
    if (seen.has(name)) throw new CliError(`${SOURCE} motion.${group}.${name} has the same name as motion.${seen.get(name)}.${name}: motion names must be unique.`)
    seen.set(name, group)
  }

  for (const [name, value] of Object.entries(raw.duration ?? {})) {
    claim(name, 'duration')
    if (typeof value !== 'number' || !(value > 0)) throw new CliError(`${SOURCE} motion.duration.${name} must be a positive number of milliseconds.`)
    motion.duration[name] = value
  }
  for (const [name, value] of Object.entries(raw.easing ?? {})) {
    claim(name, 'easing')
    const ok = Array.isArray(value) && value.length === 4 && value.every((n) => typeof n === 'number') && value[0] >= 0 && value[0] <= 1 && value[2] >= 0 && value[2] <= 1
    if (!ok) throw new CliError(`${SOURCE} motion.easing.${name} must be four cubic-bezier numbers like [0.2, 0, 0, 1], with x values from 0 to 1.`)
    motion.easing[name] = { x1: value[0], y1: value[1], x2: value[2], y2: value[3] }
  }
  for (const [name, value] of Object.entries(raw.spring ?? {})) {
    claim(name, 'spring')
    const { duration, bounce = 0 } = value ?? {}
    if (typeof duration !== 'number' || !(duration > 0) || typeof bounce !== 'number' || bounce < 0 || bounce >= 1) {
      throw new CliError(`${SOURCE} motion.spring.${name} must be like { "duration": 300, "bounce": 0.15 }: a positive duration in milliseconds and a bounce from 0 up to (not including) 1.`)
    }
    motion.spring[name] = { duration, bounce }
  }
  return motion
}

/** @param {any} raw @param {Set<string>} colors color token names @returns {Record<string, Shadow>} */
export function readElevation(raw, colors) {
  /** @type {Record<string, Shadow>} */
  const elevation = {}
  for (const [name, value] of Object.entries(raw ?? {})) {
    assertIdentifier(name, `${SOURCE} elevation`)
    const where = `${SOURCE} elevation.${name}`
    const { y, blur, opacity, color = null } = value ?? {}
    if (typeof y !== 'number' || typeof blur !== 'number' || blur < 0) throw new CliError(`${where} needs numbers "y" (offset) and "blur" (0 or more).`)
    if (typeof opacity !== 'number' || opacity < 0 || opacity > 1) throw new CliError(`${where} "opacity" must be a number from 0 to 1.`)
    if (color !== null && !colors.has(color)) throw new CliError(`${where} "color" must name a color token, like "primary" (or be left out for black).`)
    elevation[name] = { y, blur, opacity, color }
  }
  return elevation
}

/** The spring's Compose parameters. @param {Spring} spring */
export function springPhysics({ duration, bounce }) {
  const omega = (2 * Math.PI) / (duration / 1000)
  return { dampingRatio: 1 - bounce, stiffness: omega * omega }
}

/**
 * The spring as a CSS linear() easing, from 0 to 1, and how long it takes to settle (ms).
 * @param {Spring} spring
 */
export function springCurve(spring) {
  const omega = (2 * Math.PI) / (spring.duration / 1000)
  const zeta = 1 - spring.bounce
  const damped = omega * Math.sqrt(Math.max(0, 1 - zeta * zeta))
  /** Position at t seconds, starting at 0 and settling at 1. @param {number} t */
  const at = (t) =>
    zeta >= 1
      ? 1 - Math.exp(-omega * t) * (1 + omega * t)
      : 1 - Math.exp(-zeta * omega * t) * (Math.cos(damped * t) + ((zeta * omega) / damped) * Math.sin(damped * t))
  /** An upper bound on the distance from 1 at t. @param {number} t */
  const envelope = (t) =>
    zeta >= 1 ? Math.exp(-omega * t) * (1 + omega * t) : Math.exp(-zeta * omega * t) * Math.sqrt(1 + ((zeta * omega) / damped) ** 2)
  let settle = spring.duration / 1000
  while (envelope(settle) > 0.001) settle += 0.005
  const steps = 40
  const points = Array.from({ length: steps + 1 }, (_, i) => (i === steps ? 1 : Number(at((settle * i) / steps).toFixed(4))))
  return { css: `linear(${points.join(', ')})`, duration: Math.round(settle * 1000) }
}

// ---------- iOS ----------

/** @param {number} n */
const swiftNumber = (n) => String(Number(n.toFixed(4)))

/** @param {Motion} motion */
export function swiftMotion(motion) {
  const durations = Object.entries(motion.duration).map(([name, ms]) => `    /// ${ms} ms\n    static let ${name}: Double = ${swiftNumber(ms / 1000)}`)
  const fallback = defaultDuration(motion)
  const easings = Object.entries(motion.easing).map(
    ([name, e]) =>
      `    /// cubic-bezier(${e.x1}, ${e.y1}, ${e.x2}, ${e.y2})\n    static func ${name}(_ duration: Double${fallback ? ` = ${fallback}` : ''}) -> Animation {\n        .timingCurve(${e.x1}, ${e.y1}, ${e.x2}, ${e.y2}, duration: duration)\n    }`,
  )
  const springs = Object.entries(motion.spring).map(
    ([name, s]) => `    /// A spring: ${s.duration} ms, bounce ${s.bounce}\n    static let ${name}: Animation = .spring(duration: ${swiftNumber(s.duration / 1000)}, bounce: ${s.bounce})`,
  )
  if (!durations.length && !easings.length && !springs.length) return ''
  return `
/// Motion, the same on every platform: durations in seconds, easing curves and springs.
/// Respect Reduce Motion: \`withAnimation(AppMotion.reduced(AppMotion.snappy, reduceMotion))\`, with
/// \`reduceMotion\` from \`@Environment(\\.accessibilityReduceMotion)\`.
nonisolated enum AppMotion {
${[...durations, ...easings, ...springs].join('\n\n')}

    /// \`animation\`, or none when the user has turned on Reduce Motion.
    static func reduced(_ animation: Animation, _ reduceMotion: Bool) -> Animation? {
        reduceMotion ? nil : animation
    }
}
`
}

/** @param {Record<string, Shadow>} elevation */
export function swiftElevation(elevation) {
  const entries = Object.entries(elevation)
  if (!entries.length) return ''
  const shadows = entries
    .map(([name, s]) => `    static let ${name} = AppShadow(color: ${s.color ? `AppColors.${s.color}` : 'Color.black'}.opacity(${s.opacity}), radius: ${swiftNumber(s.blur / 2)}, y: ${s.y})`)
    .join('\n')
  return `
/// A shadow from the elevation tokens. Apply it with \`.shadow(AppElevation.low)\`.
nonisolated struct AppShadow: Sendable {
    let color: Color
    let radius: CGFloat
    let y: CGFloat
}

/// Shadows, for things that float above the content.
nonisolated enum AppElevation {
${shadows}
}

extension View {
    /// Draws one of the elevation tokens' shadows.
    func shadow(_ shadow: AppShadow) -> some View {
        self.shadow(color: shadow.color, radius: shadow.radius, x: 0, y: shadow.y)
    }
}
`
}

// ---------- Android ----------

/** @param {number} n */
const kotlinFloat = (n) => `${Number(n.toFixed(4))}f`

/** @param {Motion} motion */
export function kotlinMotion(motion) {
  const durations = Object.entries(motion.duration).map(([name, ms]) => `    /** ${ms} ms */\n    const val ${name}: Int = ${ms}`)
  const fallback = defaultDuration(motion)
  const easings = Object.entries(motion.easing).map(
    ([name, e]) =>
      `    /** cubic-bezier(${e.x1}, ${e.y1}, ${e.x2}, ${e.y2}) */\n    val ${name}Easing: Easing = CubicBezierEasing(${[e.x1, e.y1, e.x2, e.y2].map(kotlinFloat).join(', ')})\n\n` +
      `    fun <T> ${name}(durationMillis: Int${fallback ? ` = ${fallback}` : ''}): TweenSpec<T> = tween(durationMillis, easing = ${name}Easing)`,
  )
  const springs = Object.entries(motion.spring).map(([name, s]) => {
    const { dampingRatio, stiffness } = springPhysics(s)
    return `    /** A spring: ${s.duration} ms, bounce ${s.bounce} */\n    fun <T> ${name}(): SpringSpec<T> = spring(dampingRatio = ${kotlinFloat(dampingRatio)}, stiffness = ${kotlinFloat(stiffness)})`
  })
  if (!durations.length && !easings.length && !springs.length) return ''
  return `
/**
 * Motion, the same on every platform: durations in milliseconds, easing curves and springs.
 * Compose follows the system's animation scale, so "Remove animations" turns these off.
 */
object AppMotion {
${[...durations, ...easings, ...springs].join('\n\n')}
}
`
}

/** @param {Record<string, Shadow>} elevation */
export function kotlinElevation(elevation) {
  const entries = Object.entries(elevation)
  if (!entries.length) return ''
  const shadows = entries
    .map(([name, s]) => `    val ${name} = AppShadow(elevation = ${Number((s.blur / 2).toFixed(2))}.dp, alpha = ${kotlinFloat(s.opacity)}) { ${s.color ? `it.${s.color}` : 'Color.Black'} }`)
    .join('\n')
  return `
/**
 * A shadow from the elevation tokens: its elevation, and its color picked from the current
 * color tokens. Apply it with \`Modifier.shadow(AppElevation.low, shape)\` (core/designsystem/AppTheme.kt).
 */
@Immutable
data class AppShadow(val elevation: Dp, val alpha: Float, val color: (AppColorTokens) -> Color)

/** Shadows, for things that float above the content. */
object AppElevation {
${shadows}
}
`
}

/** Whether the Kotlin file needs the animation imports. @param {Motion} motion */
export const kotlinMotionImports = (motion) =>
  [
    ...(Object.keys(motion.easing).length ? ['androidx.compose.animation.core.CubicBezierEasing', 'androidx.compose.animation.core.Easing', 'androidx.compose.animation.core.TweenSpec', 'androidx.compose.animation.core.tween'] : []),
    ...(Object.keys(motion.spring).length ? ['androidx.compose.animation.core.SpringSpec', 'androidx.compose.animation.core.spring'] : []),
  ]

// ---------- Web ----------

/** @param {Motion} motion @param {Record<string, Shadow>} elevation */
export function cssMotion(motion, elevation) {
  const lines = [
    ...Object.entries(motion.duration).map(([name, ms]) => `  --transition-duration-${kebab(name)}: ${ms}ms;`),
    ...Object.entries(motion.easing).map(([name, e]) => `  --ease-${kebab(name)}: cubic-bezier(${e.x1}, ${e.y1}, ${e.x2}, ${e.y2});`),
    ...Object.entries(motion.spring).flatMap(([name, s]) => {
      const curve = springCurve(s)
      return [`  --ease-${kebab(name)}: ${curve.css};`, `  --transition-duration-${kebab(name)}: ${curve.duration}ms;`]
    }),
  ]
  const shadows = Object.entries(elevation).map(([name, s]) => {
    const color = s.color ? `color-mix(in srgb, var(--color-${kebab(s.color)}) ${Number((s.opacity * 100).toFixed(2))}%, transparent)` : `rgb(0 0 0 / ${s.opacity})`
    return `  --shadow-${kebab(name)}: 0 ${s.y}px ${s.blur}px ${color};`
  })
  return [
    lines.length ? `  /* motion: duration-fast, ease-standard; a spring is ease-<name> with duration-<name>. Wrap in motion-safe: */\n${lines.join('\n')}` : '',
    shadows.length ? `  /* elevation: shadow-low, ... (adapts to dark mode through the color tokens) */\n${shadows.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** The duration easing functions default to: "normal" if there is one, else the first. @param {Motion} motion */
function defaultDuration(motion) {
  const names = Object.keys(motion.duration)
  return names.includes('normal') ? 'normal' : (names[0] ?? null)
}
