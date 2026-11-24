// @ts-check
import path from 'node:path'

/**
 * @typedef {{ file: string, line: number, message: string }} Diagnostic
 */

/**
 * Pulls file, line and message out of compiler and test output.
 * Paths are relative to the project when they point inside it.
 * @param {string[]} lines
 * @param {string} root
 * @param {string} cwd directory the command ran in
 * @returns {Diagnostic[]}
 */
export function parseDiagnostics(lines, root, cwd) {
  /** @type {Diagnostic[]} */
  const errors = []
  /** @type {Set<string>} */
  const seen = new Set()
  /** @type {{ file: string, line: number, hint: string } | null} */
  let pendingFail = null

  /** @param {string} file @param {number} line @param {string} message */
  const push = (file, line, message) => {
    const text = message.trim()
    if (!text) return
    const rel = relativize(file, root, cwd)
    const key = `${rel}:${line}:${text}`
    if (seen.has(key)) return
    seen.add(key)
    errors.push({ file: rel, line, message: text })
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const xcode = line.match(/^(.+\.swift):(\d+)(?::\d+)?: error: (.+)$/)
    if (xcode) {
      push(xcode[1], Number(xcode[2]), xcode[3])
      pendingFail = null
      continue
    }

    const swiftTest = line.match(/recorded an issue at (.+\.swift):(\d+)(?::\d+)?: (.+)$/)
    if (swiftTest) {
      push(swiftTest[1], Number(swiftTest[2]), swiftTest[3])
      pendingFail = null
      continue
    }

    const kotlinParen = line.match(/^e:\s+(.+\.kts?):\s*\((\d+),\s*\d+\):\s*(.+)$/)
    if (kotlinParen) {
      push(kotlinParen[1], Number(kotlinParen[2]), kotlinParen[3])
      pendingFail = null
      continue
    }

    const kotlin = line.match(/^e:\s+(.+\.kts?):(\d+):\d+:?\s+(.+)$/)
    if (kotlin) {
      push(kotlin[1], Number(kotlin[2]), kotlin[3])
      pendingFail = null
      continue
    }

    const ts = line.match(/^(.+\.(?:tsx?|jsx?|mts|cts))\((\d+),\d+\): error TS\d+: (.+)$/)
    if (ts) {
      push(ts[1], Number(ts[2]), ts[3])
      pendingFail = null
      continue
    }

    const tsPretty = line.match(/^(.+\.(?:tsx?|jsx?)):(\d+):\d+ - error TS\d+: (.+)$/)
    if (tsPretty) {
      push(tsPretty[1], Number(tsPretty[2]), tsPretty[3])
      pendingFail = null
      continue
    }

    const fail = line.match(/^FAIL\s+(\S+\.(?:tsx?|jsx?|mts|cts))/)
    if (fail) {
      const hint = line.slice(line.indexOf(fail[1]) + fail[1].length).replace(/^[>\s]+/, '').trim()
      pendingFail = { file: fail[1], line: 0, hint }
      continue
    }

    if (pendingFail) {
      const stack = line.match(/\(([^()\s]+\.(?:tsx?|jsx?)):(\d+):\d+\)/)
      if (stack && stack[1].endsWith(path.basename(pendingFail.file))) pendingFail.line = Number(stack[2])
      if (/^(?:AssertionError|Error|TypeError)\b/.test(line) || /^expected\b/i.test(line)) {
        push(pendingFail.file, pendingFail.line, line)
        pendingFail = null
      }
    }
  }

  if (pendingFail) push(pendingFail.file, pendingFail.line, pendingFail.hint || 'test failed')
  return errors
}

/**
 * @param {string} file
 * @param {string} root
 * @param {string} cwd
 */
function relativize(file, root, cwd) {
  let cleaned = file.trim().replace(/\\/g, '/')
  if (cleaned.startsWith('file://')) cleaned = decodeURIComponent(cleaned.slice('file://'.length))
  const absolute = path.isAbsolute(cleaned) ? cleaned : path.resolve(cwd, cleaned)
  const relative = path.relative(root, absolute)
  if (relative.startsWith('..') || path.isAbsolute(relative)) return cleaned.replace(/^\//, '')
  return relative.split(path.sep).join('/')
}
