import assert from 'node:assert/strict'
import path from 'node:path'
import { test } from 'node:test'
import { generate } from '../src/codegen/index.js'
import { springCurve, springPhysics } from '../src/codegen/motion.js'
import { editJson, outputOf, TEMPLATE, tempProject } from './helpers.js'

test('motion: durations, easings and springs reach every platform', () => {
  const outputs = generate(TEMPLATE)

  const swift = outputOf(outputs, 'Tokens.swift')
  assert.match(swift, /enum AppMotion \{[\s\S]*static let fast: Double = 0\.15/)
  assert.match(swift, /static func standard\(_ duration: Double = normal\) -> Animation \{\n\s+\.timingCurve\(0\.2, 0, 0, 1, duration: duration\)/)
  assert.match(swift, /static let snappy: Animation = \.spring\(duration: 0\.3, bounce: 0\.15\)/)
  assert.match(swift, /static func reduced\(_ animation: Animation, _ reduceMotion: Bool\) -> Animation\?/)

  const kotlin = outputOf(outputs, 'Tokens.kt')
  assert.match(kotlin, /object AppMotion \{[\s\S]*const val fast: Int = 150/)
  assert.match(kotlin, /val standardEasing: Easing = CubicBezierEasing\(0\.2f, 0f, 0f, 1f\)/)
  assert.match(kotlin, /fun <T> standard\(durationMillis: Int = normal\): TweenSpec<T> = tween\(durationMillis, easing = standardEasing\)/)
  assert.match(kotlin, /fun <T> snappy\(\): SpringSpec<T> = spring\(dampingRatio = 0\.85f, stiffness = 438\.6491f\)/)
  assert.match(kotlin, /^import androidx\.compose\.animation\.core\.spring$/m)

  const css = outputOf(outputs, 'tokens.css')
  assert.match(css, /--transition-duration-fast: 150ms;/, 'duration-fast in Tailwind')
  assert.match(css, /--ease-standard: cubic-bezier\(0\.2, 0, 0, 1\);/, 'ease-standard in Tailwind')
  assert.match(css, /--ease-snappy: linear\(0, [\d., ]+, 1\);/)
  assert.match(css, /--transition-duration-snappy: \d+ms;/)
})

test('elevation: shadows reach every platform, in a color token when one is named', () => {
  const root = tempProject()
  editJson(path.join(root, 'contracts', 'tokens.json'), (tokens) => {
    tokens.elevation = { low: { y: 1, blur: 3, opacity: 0.12 }, brand: { y: 8, blur: 24, opacity: 0.3, color: 'primary' } }
  })
  const outputs = generate(root)

  const swift = outputOf(outputs, 'Tokens.swift')
  assert.match(swift, /static let low = AppShadow\(color: Color\.black\.opacity\(0\.12\), radius: 1\.5, y: 1\)/)
  assert.match(swift, /static let brand = AppShadow\(color: AppColors\.primary\.opacity\(0\.3\), radius: 12, y: 8\)/)
  assert.match(swift, /func shadow\(_ shadow: AppShadow\) -> some View/)

  const kotlin = outputOf(outputs, 'Tokens.kt')
  assert.match(kotlin, /val low = AppShadow\(elevation = 1\.5\.dp, alpha = 0\.12f\) \{ Color\.Black \}/)
  assert.match(kotlin, /val brand = AppShadow\(elevation = 12\.dp, alpha = 0\.3f\) \{ it\.primary \}/)

  const css = outputOf(outputs, 'tokens.css')
  assert.match(css, /--shadow-low: 0 1px 3px rgb\(0 0 0 \/ 0\.12\);/)
  assert.match(css, /--shadow-brand: 0 8px 24px color-mix\(in srgb, var\(--color-primary\) 30%, transparent\);/)
})

test('motion: a contract without motion or elevation generates neither', () => {
  const root = tempProject()
  editJson(path.join(root, 'contracts', 'tokens.json'), (tokens) => {
    delete tokens.motion
    delete tokens.elevation
  })
  const outputs = generate(root)
  assert.doesNotMatch(outputOf(outputs, 'Tokens.swift'), /AppMotion|AppShadow/)
  assert.doesNotMatch(outputOf(outputs, 'Tokens.kt'), /AppMotion|AppShadow|animation\.core/)
  assert.doesNotMatch(outputOf(outputs, 'tokens.css'), /--ease-|--shadow-/)
})

test('springs: duration and bounce map onto Compose physics, and settle on the web', () => {
  const { dampingRatio, stiffness } = springPhysics({ duration: 500, bounce: 0.2 })
  assert.equal(dampingRatio, 0.8)
  assert.ok(Math.abs(stiffness - (2 * Math.PI * 2) ** 2) < 1e-9)

  const bouncy = springCurve({ duration: 400, bounce: 0.3 })
  const points = bouncy.css.slice('linear('.length, -1).split(', ').map(Number)
  assert.equal(points[0], 0)
  assert.equal(points.at(-1), 1)
  assert.ok(Math.max(...points) > 1, 'a bouncy spring overshoots')
  assert.ok(bouncy.duration > 400, 'it settles after its perceptual duration')

  const critical = springCurve({ duration: 300, bounce: 0 })
  const smooth = critical.css.slice('linear('.length, -1).split(', ').map(Number)
  assert.ok(smooth.every((value, i) => i === 0 || value >= smooth[i - 1]), 'no bounce means no overshoot')
})

test('motion and elevation: invalid values are rejected with the field named', () => {
  const cases = [
    [(t) => (t.motion.duration.fast = -1), /motion\.duration\.fast must be a positive number of milliseconds/],
    [(t) => (t.motion.easing.standard = [2, 0, 0, 1]), /motion\.easing\.standard must be four cubic-bezier numbers/],
    [(t) => (t.motion.spring.snappy = { duration: 300, bounce: 1 }), /motion\.spring\.snappy must be like/],
    [(t) => (t.motion.spring.fast = { duration: 300 }), /motion\.spring\.fast has the same name as motion\.duration\.fast/],
    [(t) => (t.motion.curve = {}), /motion\.curve isn't a motion group/],
    [(t) => (t.elevation.low.color = 'brand'), /elevation\.low "color" must name a color token/],
    [(t) => (t.elevation.low.opacity = 2), /elevation\.low "opacity" must be a number from 0 to 1/],
  ]
  for (const [edit, message] of cases) {
    const root = tempProject()
    editJson(path.join(root, 'contracts', 'tokens.json'), edit)
    assert.throws(() => generate(root), message)
  }
})
