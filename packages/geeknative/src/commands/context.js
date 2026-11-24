// @ts-check
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { readJson, walk } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { readFeatures } from '../lib/specs.js'

export const PLATFORMS = /** @type {const} */ (['ios', 'android', 'web'])

/** @param {string | undefined} platform @returns {platform is 'ios' | 'android' | 'web'} */
function isPlatform(platform) {
  return platform === 'ios' || platform === 'android' || platform === 'web'
}

/**
 * `notes-list` becomes `NotesList`. Feature folders and types use this form.
 * @param {string} id
 */
export function pascalCase(id) {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * What a targeted check should run for one feature. Missing tests mean compile only.
 * @param {string} root
 * @param {string} id
 * @param {'ios' | 'android' | 'web'} platform
 * @returns {{ kind: 'ios', action: 'test' | 'build', only: string[] } | { kind: 'android', tasks: string[] } | { kind: 'web', vitest: string | null }}
 */
export function featureCheckPlan(root, id, platform) {
  const name = pascalCase(id)
  if (platform === 'ios') {
    const unit = path.join(root, 'apps/ios/AppTests', `${name}Tests.swift`)
    const ui = path.join(root, 'apps/ios/AppUITests', `${name}UITests.swift`)
    /** @type {string[]} */
    const only = []
    if (existsSync(unit)) only.push(`-only-testing:AppTests/${name}Tests`)
    if (existsSync(ui)) only.push(`-only-testing:AppUITests/${name}UITests`)
    return { kind: 'ios', action: only.length ? 'test' : 'build', only }
  }
  if (platform === 'android') {
    const testDir = path.join(root, 'apps/android/app/src/test/kotlin/app/features', id)
    return {
      kind: 'android',
      tasks: existsSync(testDir)
        ? [':app:testDebugUnitTest', '--tests', `app.features.${id}.*`]
        : [':app:compileDebugKotlin'],
    }
  }
  const featureDir = path.join(root, 'apps/web/src/features', id)
  return { kind: 'web', vitest: existsSync(featureDir) ? `src/features/${id}` : null }
}

/**
 * Prints one platform's feature pack. It does not write a file.
 * @param {string} root
 * @param {string | undefined} feature
 * @param {string | undefined} platform
 */
export function context(root, feature, platform) {
  console.log(renderContext(root, feature, platform))
}

/**
 * @param {string} root
 * @param {string | undefined} featureId
 * @param {string | undefined} platformName
 */
export function renderContext(root, featureId, platformName) {
  if (!featureId || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(featureId)) {
    throw new CliError('Usage: geeknative context <feature> --platform <ios|android|web>')
  }
  if (!isPlatform(platformName)) {
    throw new CliError('Usage: geeknative context <feature> --platform <ios|android|web>')
  }
  const platform = platformName
  const feature = readFeatures(root).find((item) => item.id === featureId)
  if (!feature) throw new CliError(`No spec at spec/features/${featureId}.md.`)

  const name = pascalCase(feature.id)
  const folder = featureDirectory(root, platform, feature.id)
  const existing = walk(folder).map((file) => rel(root, file)).sort()
  const sources = platform === 'web' ? existing.filter((file) => !isWebTest(file)) : existing
  const files = sources.length ? sources : conventionalFiles(platform, feature.id, name)
  const reference = referenceDirectory(root, platform, feature.id)

  const specText = readFileSync(path.join(root, 'spec', 'features', feature.file), 'utf8')
  const cited = citedNames(specText)
  const strings = contractKeys(root, 'contracts/strings/en.json', feature.id, cited)
  const icons = contractKeys(root, 'contracts/icons.json', feature.id, cited, { bareId: true })

  const lines = [
    `# ${feature.id} (${platform})`,
    '',
    `Spec: spec/features/${feature.file}`,
    `Acceptance criteria: ${feature.criteria.map((criterion) => criterion.id).join(', ') || 'none'}`,
    '',
    'Read the spec, the reference folder, and the files below. Do not search the repo.',
    '',
    'String keys:',
    ...bullets(strings),
    '',
    'Icon names:',
    ...bullets(icons),
    '',
    'Reference:',
    reference ? rel(root, reference) : `None. Follow apps/${platform}/AGENTS.md.`,
    '',
    'Files:',
    ...bullets(files),
    '',
    'Navigation:',
    ...bullets(navigationFiles(root, platform, feature.id)),
    '',
    'Tests:',
    ...bullets(testPaths(root, platform, feature.id, name, existing)),
    '',
    `Check: geeknative check ${platform} --feature ${feature.id}`,
    `On failure, read .geeknative/logs/${platform}.json only.`,
    '',
    'Do not read:',
    `- apps other than apps/${platform}`,
    `- ${generatedDir(platform)}`,
    '- .geeknative/logs/*.log',
    '',
  ]
  return lines.join('\n')
}

/**
 * @param {string} root
 * @param {'ios' | 'android' | 'web'} platform
 * @param {string} id
 */
function featureDirectory(root, platform, id) {
  const name = pascalCase(id)
  if (platform === 'ios') return path.join(root, 'apps/ios/App/Features', name)
  if (platform === 'android') return path.join(root, 'apps/android/app/src/main/kotlin/app/features', id)
  return path.join(root, 'apps/web/src/features', id)
}

/**
 * Prefer settings, then home, then the first other feature whose folder exists.
 * @param {string} root
 * @param {'ios' | 'android' | 'web'} platform
 * @param {string} id
 */
function referenceDirectory(root, platform, id) {
  const ordered = ['settings', 'home', ...readFeatures(root).map((feature) => feature.id)]
  for (const candidate of [...new Set(ordered)]) {
    if (candidate === id) continue
    const dir = featureDirectory(root, platform, candidate)
    if (existsSync(dir)) return dir
  }
  return null
}

/**
 * @param {'ios' | 'android' | 'web'} platform
 * @param {string} id
 * @param {string} name
 */
function conventionalFiles(platform, id, name) {
  if (platform === 'ios') {
    return ['Screen', 'ViewModel', 'Repository'].map((suffix) => `apps/ios/App/Features/${name}/${name}${suffix}.swift`)
  }
  if (platform === 'android') {
    const dir = `apps/android/app/src/main/kotlin/app/features/${id}`
    return ['Screen', 'ViewModel', 'Repository'].map((suffix) => `${dir}/${name}${suffix}.kt`)
  }
  const dir = `apps/web/src/features/${id}`
  return [`${dir}/${name}Screen.tsx`, `${dir}/use${name}ViewModel.ts`, `${dir}/${name}Repository.ts`]
}

/**
 * @param {string} root
 * @param {'ios' | 'android' | 'web'} platform
 * @param {string} id
 */
function navigationFiles(root, platform, id) {
  if (platform === 'ios') return ['apps/ios/App/Core/Navigation/Route.swift']
  if (platform === 'android') return ['apps/android/app/src/main/kotlin/app/core/navigation/Route.kt']
  const routes = walk(path.join(root, 'apps/web/src/routes'))
    .filter((file) => readFileSync(file, 'utf8').includes(`features/${id}/`))
    .map((file) => rel(root, file))
    .sort()
  return ['apps/web/src/core/navigation/SiteHeader.tsx', ...routes]
}

/**
 * @param {string} root
 * @param {'ios' | 'android' | 'web'} platform
 * @param {string} id
 * @param {string} name
 * @param {string[]} existing files already in the feature folder, relative to the project
 */
function testPaths(root, platform, id, name, existing) {
  if (platform === 'ios') {
    return [`apps/ios/AppTests/${name}Tests.swift`, `apps/ios/AppUITests/${name}UITests.swift`]
  }
  if (platform === 'android') return [`apps/android/app/src/test/kotlin/app/features/${id}/`]
  const tests = existing.filter(isWebTest)
  return tests.length ? tests : [`apps/web/src/features/${id}/*test*`]
}

/** @param {'ios' | 'android' | 'web'} platform */
function generatedDir(platform) {
  if (platform === 'ios') return 'apps/ios/App/Generated'
  if (platform === 'android') return 'apps/android/app/src/main/kotlin/app/generated'
  return 'apps/web/src/generated'
}

/**
 * Keys that belong to this feature: a `feature.` prefix, plus names the spec cites in backticks.
 * Icon catalogs also match a key equal to the feature id (`settings`).
 * @param {string} root
 * @param {string} file
 * @param {string} id
 * @param {Set<string>} cited
 * @param {{ bareId?: boolean }} [options]
 */
function contractKeys(root, file, id, cited, options = {}) {
  const full = path.join(root, file)
  if (!existsSync(full)) return []
  const data = readJson(full, file)
  if (!data || typeof data !== 'object' || Array.isArray(data)) return []
  return Object.keys(data)
    .filter((key) => !key.startsWith('$'))
    .filter((key) => key.startsWith(`${id}.`) || cited.has(key) || (options.bareId && key === id))
    .sort()
}

/** Backtick spans in a spec. @param {string} text */
function citedNames(text) {
  return new Set([...text.matchAll(/`([^`\s]+)`/g)].map((match) => match[1]))
}

/** @param {string} file */
function isWebTest(file) {
  return /\.(test|spec)\.(tsx?|jsx?)$/.test(file)
}

/** @param {string[]} items */
function bullets(items) {
  return items.length ? items.map((item) => `- ${item}`) : ['- none']
}

/** @param {string} root @param {string} file */
function rel(root, file) {
  return path.relative(root, file).split(path.sep).join('/')
}
