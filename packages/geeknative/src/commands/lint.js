// @ts-check
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { capture } from '../lib/exec.js'
import { walk } from '../lib/fsutil.js'
import { color, log } from '../lib/log.js'
import { rel } from '../lib/project.js'
import { PLATFORMS, readFeatures } from '../lib/specs.js'
import { coverage, parityMarkdown, testedCriteria } from './parity.js'

/**
 * Catches what the build can't: rules from AGENTS.md and DESIGN.md that every platform's code
 * must follow, and spec bookkeeping that drifts when nobody runs `make parity`.
 *
 * Code rules (per platform):
 * - text:     user-facing text written in code instead of contracts/strings
 * - test-id:  a test ID in code that no spec lists (and, as a warning, a spec's ID a done platform never uses)
 * - title:    a centered screen title (DESIGN.md: titles are leading-aligned on every platform)
 * - width:    a web screen that caps its width without centering it (DESIGN.md: Screen)
 * Spec rules:
 * - status:   a platform still "planned" although its tests cover the feature's criteria
 * - parity:   spec/parity.md out of date
 * - platforms: uncommitted changes touch some apps but not the others (a warning, as the
 *   Claude Code Stop hook gives, for agents that run without the hooks)
 *
 * A `geeknative-ignore` comment on a line (or the line above) silences that line.
 *
 * @typedef {'ios' | 'android' | 'web'} Platform
 * @typedef {{ rule: string, level: 'error' | 'warn', file: string, line: number, message: string }} Finding
 */

/** App source files per platform: not generated code, tests or test helpers. */
const SOURCES = {
  ios: { dir: 'apps/ios/App', file: /\.swift$/, skip: /\/Generated\// },
  android: { dir: 'apps/android/app/src/main', file: /\.kt$/, skip: /\/generated\// },
  web: { dir: 'apps/web/src', file: /\.tsx?$/, skip: /(\/generated\/|routeTree\.gen\.ts$|\.(test|spec)\.tsx?$|\/testing\/)/ },
}

/**
 * @param {string} root
 * @param {{ platforms?: Platform[], specs?: boolean }} [options] which platforms' code to check, and whether to check the specs
 * @returns {Finding[]}
 */
export function lintFindings(root, { platforms = [...PLATFORMS], specs = true } = {}) {
  const features = readFeatures(root)
  /** @type {Finding[]} */
  const findings = []
  for (const platform of platforms) findings.push(...lintPlatform(root, platform, features))
  if (specs) findings.push(...lintSpecs(root, features), ...lintChanges(root))
  return findings
}

/**
 * Runs the lint and prints its findings. Returns false when there are errors.
 * @param {string} root
 * @param {{ platforms?: Platform[], specs?: boolean }} [options]
 */
export function lint(root, options = {}) {
  const findings = lintFindings(root, options)
  const errors = findings.filter((f) => f.level === 'error')
  const warnings = findings.filter((f) => f.level === 'warn')
  const platforms = options.platforms ?? [...PLATFORMS]
  const specs = options.specs ?? true
  if (!findings.length) {
    if (specs) log.ok('lint', 'no hardcoded text, unknown test IDs, centered titles, uncentered screens or stale specs')
    else log.ok('lint', `no hardcoded text, unknown test IDs, centered titles or uncentered screens in ${platforms.join(', ')} ${color.dim('(specs are checked by make check and make lint)')}`)
    return true
  }
  const summary = [errors.length && `${errors.length} error${errors.length > 1 ? 's' : ''}`, warnings.length && `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`]
    .filter(Boolean)
    .join(', ')
  ;(errors.length ? log.fail : log.warn)('lint', summary)
  for (const f of [...errors, ...warnings]) {
    log.detail(`${f.level === 'error' ? color.red('✖') : color.yellow('!')} ${f.file}${f.line ? `:${f.line}` : ''} ${color.dim(`[${f.rule}]`)} ${f.message}`)
  }
  if (findings.some((f) => SPEC_RULES.has(f.rule))) {
    log.detail(color.dim('status and parity findings are fixed in spec/ by whoever owns the specs (the lead), not in app code: `make check-<platform>` checks only the code.'))
  }
  return errors.length === 0
}

/** Rules about the specs rather than any app's code. */
const SPEC_RULES = new Set(['status', 'parity'])

// ---------- Code ----------

/**
 * @param {string} root
 * @param {Platform} platform
 * @param {import('../lib/specs.js').Feature[]} features
 * @returns {Finding[]}
 */
function lintPlatform(root, platform, features) {
  const source = SOURCES[platform]
  const dir = path.join(root, source.dir)
  if (!existsSync(dir)) return []
  const specIds = features.flatMap((f) => f.testIds.map((t) => ({ ...t, feature: f, pattern: idPattern(t.id) })))
  /** @type {Finding[]} */
  const findings = []
  /** @type {string[]} test IDs this platform uses, with "*" for dynamic parts */
  const used = []
  /** @type {string[]} every string literal in the app, since an ID can reach the modifier through a parameter */
  const strings = []

  for (const file of walk(dir)) {
    const relative = rel(root, file)
    if (!source.file.test(relative) || source.skip.test(relative)) continue
    const text = withoutPreviews(readFileSync(file, 'utf8'), platform)
    for (const m of text.matchAll(/"([\w.$\\(){}-]+)"|'([\w.${}-]+)'|`([\w.${}-]+)`/g)) {
      strings.push((m[1] ?? m[2] ?? m[3]).replace(/\\\((?:[^()]|\([^()]*\))*\)|\$\{[^}]*\}|\$[A-Za-z_]\w*/g, '*'))
    }
    const lines = text.split('\n')
    const ignored = (/** @type {number} */ line) => /geeknative-ignore/.test(lines[line - 1] ?? '') || /geeknative-ignore/.test(lines[line - 2] ?? '')
    /** @param {string} rule @param {'error' | 'warn'} level @param {number} index @param {string} message */
    const report = (rule, level, index, message) => {
      const line = lineAt(text, index)
      if (!ignored(line)) findings.push({ rule, level, file: relative, line, message })
    }

    // The web rules look for JSX, which only .tsx files can hold: in .ts, `<A>, b: B<C>` is a type.
    const literals = platform === 'web' && !relative.endsWith('.tsx') ? [] : TEXT_RULES[platform](text)
    for (const literal of literals) {
      const problem = textProblem(literal.value, platform)
      if (problem) report('text', 'error', literal.index, `${problem}: ${JSON.stringify(literal.value)}. Use a key from contracts/strings.`)
    }
    for (const { id, index } of TEST_IDS[platform](text)) {
      if (ignored(lineAt(text, index))) continue
      used.push(id)
      if (!specIds.some((s) => idMatches(id, s.pattern))) {
        report('test-id', 'error', index, `test ID "${id}" isn't listed in any spec's "Test IDs" section. Add it to the feature's spec, or use a listed ID.`)
      }
    }
    if (platform === 'web' && /Screen\.tsx$/.test(relative)) {
      // Only the element a screen returns: a capped paragraph inside a card is fine.
      for (const match of text.matchAll(/return \(\s*<[A-Za-z][\w.]*[^>]*?className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const classes = match[1] ?? match[2] ?? ''
        if (/(^|\s)max-w-(?!none\b|full\b|screen\b)/.test(classes) && !/(^|\s)mx-auto(\s|$)/.test(classes)) {
          report('width', 'error', match.index ?? 0, "caps the screen's width without centering it, so it hugs the left edge on wide windows. Wrap the screen in <Page> (core/designsystem/Page.tsx), or add mx-auto.")
        }
      }
    }
    for (const match of text.matchAll(CENTERED_TITLE[platform])) {
      report('title', 'error', match.index ?? 0, `${match[0]} centers the screen title; DESIGN.md wants titles leading-aligned on every platform.`)
    }
  }

  for (const spec of specIds) {
    if (spec.feature.status[platform] !== 'done' || spec.notOn.includes(platform)) continue
    if (![...used, ...strings].some((id) => idMatches(id, spec.pattern))) {
      findings.push({
        rule: 'test-id',
        level: 'warn',
        file: `spec/features/${spec.feature.file}`,
        line: spec.line,
        message: `test ID "${spec.id}" isn't used in the ${platform} app, which the spec marks done.`,
      })
    }
  }
  return findings
}

/**
 * Blanks out iOS #Preview blocks and Android @Preview functions, which may show sample text,
 * from the marker to the brace that closes its body. Code before and after is still checked,
 * and line numbers stay the same.
 * @param {string} text
 * @param {Platform} platform
 */
export function withoutPreviews(text, platform) {
  const marker = platform === 'ios' ? /^#Preview\b/gm : platform === 'android' ? /^@Preview\b/gm : null
  if (!marker) return text
  let result = text
  for (const match of text.matchAll(marker)) {
    const start = match.index ?? 0
    const open = text.indexOf('{', start)
    if (open === -1) continue
    let depth = 0
    let end = text.length - 1
    for (let i = open; i < text.length; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}' && --depth === 0) {
        end = i
        break
      }
    }
    result = result.slice(0, start) + result.slice(start, end + 1).replace(/[^\n]/g, ' ') + result.slice(end + 1)
  }
  return result
}

/** @param {string} text @param {number} index */
const lineAt = (text, index) => text.slice(0, index).split('\n').length

/**
 * Why a string literal shown to the user is a problem, or null if it isn't: it contains words,
 * or it composes text around interpolated values (like "\(name) × \(count)").
 * @param {string} value
 * @param {Platform} platform
 */
export function textProblem(value, platform) {
  const interpolation = platform === 'ios' ? /\\\((?:[^()]|\([^()]*\))*\)/g : platform === 'android' ? /\$\{[^}]*\}|\$[A-Za-z_]\w*/g : /\$\{[^}]*\}/g
  const rest = value.replace(interpolation, '')
  if (/\p{L}/u.test(rest)) return 'hardcoded text'
  if (rest !== value && rest.trim()) return 'text composed in code'
  return null
}

const SWIFT_STRING = '"((?:[^"\\\\\\n]|\\\\.)*)"'
const KOTLIN_STRING = '"((?:[^"\\\\\\n$]|\\\\.|\\$\\{[^}]*\\}|\\$\\w*)*)"'

/** @typedef {{ value: string, index: number }} Literal */

/** String literals each platform shows to users. @type {Record<Platform, (text: string) => Literal[]>} */
const TEXT_RULES = {
  ios: (text) =>
    collect(text, [
      new RegExp(`\\b(?:Text|Button|Label|TextField|SecureField|Toggle|Section|Picker|Link|Menu|LabeledContent)\\(\\s*(?:verbatim:\\s*)?${SWIFT_STRING}`, 'g'),
      new RegExp(`\\.(?:navigationTitle|accessibilityLabel|accessibilityHint|accessibilityValue|help|alert|confirmationDialog)\\(\\s*${SWIFT_STRING}`, 'g'),
    ]),
  android: (text) =>
    collect(text, [
      new RegExp(`\\bText\\(\\s*(?:text\\s*=\\s*)?${KOTLIN_STRING}`, 'g'),
      new RegExp(`\\bcontentDescription\\s*=\\s*${KOTLIN_STRING}`, 'g'),
    ]),
  web: (text) =>
    collect(text, [
      // Text between tags on one line: <p>Hello</p>
      /<\/?[A-Za-z][^<>]*>([^<>{}=;()&|`]*\p{L}[^<>{}=;()&|`]*)<\/?[A-Za-z]/gu,
      // A string or template literal as a child: <p>{'Hello'}</p>, <span>{`${a} × ${b}`}</span>
      />\s*\{\s*'([^'\n]*)'\s*\}\s*</g,
      />\s*\{\s*"([^"\n]*)"\s*\}\s*</g,
      />\s*\{\s*`([^`]*)`\s*\}\s*</g,
      // Attributes people read or hear
      /\b(?:aria-label|placeholder|title|alt)=(?:"([^"]*)"|'([^']*)'|\{\s*`([^`]*)`\s*\})/g,
    ]),
}

/** @param {string} text @param {RegExp[]} patterns @returns {Literal[]} */
function collect(text, patterns) {
  return patterns.flatMap((pattern) =>
    [...text.matchAll(pattern)].map((m) => ({ value: m.slice(1).find((g) => g !== undefined) ?? '', index: m.index ?? 0 })),
  )
}

/** Test IDs set in code, with "*" for interpolated parts. @type {Record<Platform, (text: string) => { id: string, index: number }[]>} */
const TEST_IDS = {
  // The modifier itself, or a helper's argument that passes an ID on to it (`testID: "..."`).
  ios: (text) =>
    [...text.matchAll(new RegExp(`(?:\\.accessibilityIdentifier\\(|\\b(?:testID|testId):)\\s*${SWIFT_STRING}`, 'g'))].map((m) => ({
      id: m[1].replace(/\\\((?:[^()]|\([^()]*\))*\)/g, '*'),
      index: m.index ?? 0,
    })),
  android: (text) =>
    [...text.matchAll(new RegExp(`(?:\\btestTag\\(|\\b(?:testTag|testId)\\s*=)\\s*${KOTLIN_STRING}`, 'g'))].map((m) => ({
      id: m[1].replace(/\$\{[^}]*\}|\$[A-Za-z_]\w*/g, '*'),
      index: m.index ?? 0,
    })),
  web: (text) =>
    [...text.matchAll(/\b(?:data-testid|testId|testID)=(?:"([^"]*)"|'([^']*)'|\{\s*`([^`]*)`\s*\}|\{\s*['"]([^'"]*)['"]\s*\})/g)].map((m) => ({
      id: (m.slice(1).find((g) => g !== undefined) ?? '').replace(/\$\{[^}]*\}/g, '*'),
      index: m.index ?? 0,
    })),
}

/** @type {Record<Platform, RegExp>} */
const CENTERED_TITLE = {
  ios: /\.navigationBarTitleDisplayMode\(\s*\.inline\s*\)/g,
  android: /\bCenterAlignedTopAppBar\b/g,
  web: /(?!)/g,
}

/** A spec's test ID as a pattern: `<placeholder>` parts match any value. @param {string} id */
function idPattern(id) {
  const parts = id.split(/<[^>]+>/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`^${parts.join('[^]+?')}$`)
}

/**
 * Whether a code test ID (with "*" for dynamic parts) can be one of a spec's IDs: either the code
 * ID fits the spec pattern, or a concrete spec ID fits the code ID ("$prefix.quantity" can be
 * "product.<productId>.quantity").
 * @param {string} id
 * @param {RegExp} pattern
 */
function idMatches(id, pattern) {
  // A string that is all dynamic ("${total}" → "*") could be anything, so it identifies nothing.
  if (!/[A-Za-z0-9]/.test(id.replace(/\*/g, ''))) return false
  if (pattern.test(id.replace(/\*/g, 'x1'))) return true
  if (!id.includes('*')) return false
  const code = new RegExp(`^${id.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+')}$`)
  return code.test(sampleOf(pattern))
}

/** A concrete ID a spec pattern matches: each placeholder becomes "x1". @param {RegExp} pattern */
const sampleOf = (pattern) => pattern.source.slice(1, -1).replace(/\[\^\]\+\?/g, 'x1').replace(/\\(.)/g, '$1')

// ---------- Specs ----------

/**
 * @param {string} root
 * @param {import('../lib/specs.js').Feature[]} features
 * @returns {Finding[]}
 */
function lintSpecs(root, features) {
  /** @type {Finding[]} */
  const findings = []
  const tested = testedCriteria(root)
  for (const feature of features) {
    for (const platform of PLATFORMS) {
      const status = feature.status[platform]
      if (!feature.criteria.length || status === 'n/a') continue
      const levels = feature.criteria.map((c) => coverage(c, tested[platform]))
      const named = levels.filter((l) => l !== 'none').length
      const covered = levels.filter((l) => l === 'ui' || l === 'unit').length
      const file = `spec/features/${feature.file}`
      if (status === 'planned' && named) {
        findings.push({ rule: 'status', level: 'error', file, line: 0, message: `${platform} is "planned", but its tests name ${named} of ${feature.criteria.length} criteria. Set it to in-progress or done.` })
      } else if (status === 'in-progress' && covered === feature.criteria.length) {
        findings.push({ rule: 'status', level: 'warn', file, line: 0, message: `${platform} is "in-progress", but its tests cover every criterion. Set it to done if it's finished.` })
      }
    }
  }
  const parityFile = path.join(root, 'spec', 'parity.md')
  if (features.length) {
    const current = existsSync(parityFile) ? readFileSync(parityFile, 'utf8') : ''
    if (current !== parityMarkdown(root).markdown) {
      findings.push({ rule: 'parity', level: 'error', file: 'spec/parity.md', line: 0, message: 'out of date with the specs and tests. Run `make parity`.' })
    }
  }
  return findings
}

/**
 * Warns when the uncommitted changes implement something in some apps but not the others:
 * requests apply to all three unless they're platform-specific (AGENTS.md section 1).
 * @param {string} root
 * @returns {Finding[]}
 */
function lintChanges(root) {
  const tracked = capture('git', ['diff', '--name-only', '--relative', 'HEAD', '--', 'apps'], { cwd: root })
  const untracked = capture('git', ['ls-files', '--others', '--exclude-standard', '--', 'apps'], { cwd: root })
  if (tracked === null || untracked === null) return []
  // Generated code, agent docs and tests don't count as implementing a change: improving one
  // app's tests is not a feature the others are missing.
  const ignored = /(\/Generated\/|\/generated\/|\/generated_[^/]*\.xml$|Identity\.xcconfig$|identity\.properties$|AGENTS\.md$|CLAUDE\.md$|^apps\/ios\/[^/]*Tests\/|^apps\/android\/app\/src\/(test|androidTest)\/|^apps\/web\/src\/testing\/|\.(test|spec)\.tsx?$)/
  const changed = `${tracked}\n${untracked}`.split('\n').filter((file) => file.startsWith('apps/') && !ignored.test(file))
  const touched = PLATFORMS.filter((p) => changed.some((file) => file.startsWith(`apps/${p}/`)))
  if (touched.length === 0 || touched.length === PLATFORMS.length) return []
  const missing = PLATFORMS.filter((p) => !touched.includes(p))
  return [
    {
      rule: 'platforms',
      level: 'warn',
      file: 'apps/',
      line: 0,
      message: `uncommitted changes touch ${touched.join(' and ')} but not ${missing.join(' and ')}. Implement it there too, or note why it's platform-specific in the spec's Platform notes.`,
    },
  ]
}
