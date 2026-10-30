// @ts-check
import path from 'node:path'
import { readdirSync, existsSync } from 'node:fs'
import { walk } from '../lib/fsutil.js'
import { rel } from '../lib/project.js'
import { appOutputs, readApp } from './app.js'
import { configOutputs, readConfig } from './config.js'
import { iconOutputs, readIcons } from './icons.js'
import { readStrings, stringOutputs } from './strings.js'
import { readTokens, tokenOutputs } from './tokens.js'
import { OUT } from './util.js'

/**
 * Reads and validates every contract, and returns the files they generate in each app.
 * @param {string} root
 * @returns {{ path: string, content: string | Buffer }[]}
 */
export function generate(root) {
  const app = readApp(root)
  return [
    ...appOutputs(app),
    ...tokenOutputs(readTokens(root)),
    ...stringOutputs(readStrings(root, app.defaultLocale), app.name),
    ...iconOutputs(readIcons(root)),
    ...configOutputs(readConfig(root)),
  ]
}

/**
 * Generated files that exist on disk but are no longer produced (e.g. a removed locale).
 * @param {string} root
 * @param {Set<string>} produced relative paths
 */
export function staleFiles(root, produced) {
  const owned = [OUT.iosGenerated, OUT.androidKotlin, OUT.webGenerated].flatMap((dir) => walk(path.join(root, dir)))
  const res = path.join(root, OUT.androidRes)
  if (existsSync(res)) {
    for (const dir of readdirSync(res)) {
      if (!dir.startsWith('values')) continue
      for (const file of readdirSync(path.join(res, dir))) {
        if (file.startsWith('generated_')) owned.push(path.join(res, dir, file))
      }
    }
  }
  return owned.map((file) => rel(root, file)).filter((file) => !produced.has(file))
}
