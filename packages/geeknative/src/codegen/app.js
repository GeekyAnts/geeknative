// @ts-check
import path from 'node:path'
import { readJson } from '../lib/fsutil.js'
import { CliError } from '../lib/log.js'
import { banner, kotlinString, OUT, swiftString } from './util.js'

/**
 * @typedef {{ name: string, id: string, version: string, build: number, defaultLocale: string }} AppIdentity
 * @typedef {{ path: string, content: string | Buffer }} Output
 */

/** @param {string} root @returns {AppIdentity} */
export function readApp(root) {
  const app = readJson(path.join(root, 'contracts', 'app.json'), 'contracts/app.json')
  const where = 'contracts/app.json'
  if (typeof app.name !== 'string' || !app.name.trim() || /[\n$]|\/\//.test(app.name)) {
    throw new CliError(`${where} "name" must be a non-empty display name without "$", "//" or line breaks.`)
  }
  if (typeof app.id !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(app.id)) {
    throw new CliError(`${where} "id" must be a reverse-DNS identifier like "com.acme.notes" (used as the iOS bundle ID and Android application ID).`)
  }
  if (typeof app.version !== 'string' || !/^\d+(\.\d+){0,2}$/.test(app.version)) {
    throw new CliError(`${where} "version" must look like "1.0.0".`)
  }
  if (!Number.isInteger(app.build) || app.build < 1) {
    throw new CliError(`${where} "build" must be a whole number of 1 or more.`)
  }
  const defaultLocale = app.defaultLocale ?? 'en'
  if (typeof defaultLocale !== 'string' || !/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(defaultLocale)) {
    throw new CliError(`${where} "defaultLocale" must be a language code like "en" or "pt-BR".`)
  }
  return { name: app.name.trim(), id: app.id, version: app.version, build: app.build, defaultLocale }
}

/** @param {AppIdentity} app @returns {Output[]} */
export function appOutputs(app) {
  const source = 'contracts/app.json'
  return [
    {
      path: OUT.iosIdentity,
      content: `// ${banner(source)}
APP_DISPLAY_NAME = ${app.name}
APP_BUNDLE_ID = ${app.id}
APP_VERSION = ${app.version}
APP_BUILD = ${app.build}
`,
    },
    {
      path: `${OUT.iosGenerated}/AppIdentity.swift`,
      content: `// ${banner(source)}

/// The app's name, identifier and version, shared with the Android and web apps.
nonisolated enum AppIdentity {
    static let name = ${swiftString(app.name)}
    static let id = ${swiftString(app.id)}
    static let version = ${swiftString(app.version)}
    static let build = ${app.build}
}
`,
    },
    {
      path: OUT.androidIdentity,
      content: `# ${banner(source)}
applicationId=${app.id}
versionName=${app.version}
versionCode=${app.build}
`,
    },
    {
      path: `${OUT.androidKotlin}/AppIdentity.kt`,
      content: `// ${banner(source)}
package app.generated

/** The app's name, identifier and version, shared with the iOS and web apps. */
object AppIdentity {
    const val NAME = ${kotlinString(app.name)}
    const val ID = ${kotlinString(app.id)}
    const val VERSION = ${kotlinString(app.version)}
    const val BUILD = ${app.build}
}
`,
    },
    {
      path: `${OUT.webGenerated}/app.ts`,
      content: `// ${banner(source)}

/** The app's name, identifier and version, shared with the iOS and Android apps. */
export const AppIdentity = {
  name: ${JSON.stringify(app.name)},
  id: ${JSON.stringify(app.id)},
  version: ${JSON.stringify(app.version)},
  build: ${app.build},
} as const
`,
    },
  ]
}
