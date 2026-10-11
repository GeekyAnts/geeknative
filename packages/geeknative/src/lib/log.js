// @ts-check

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR

/** @param {number} code */
const paint = (code) => /** @param {unknown} text */ (text) =>
  useColor ? `\x1b[${code}m${text}\x1b[0m` : String(text)

export const color = {
  bold: paint(1),
  dim: paint(2),
  red: paint(31),
  green: paint(32),
  yellow: paint(33),
  cyan: paint(36),
}

/** @param {string} mark @param {string} label @param {string} message */
const line = (mark, label, message) => console.log(`${mark} ${label.padEnd(10)} ${message}`)

export const log = {
  /** @param {string} message */
  info: (message) => console.log(message),
  /** @param {string} label @param {string} message */
  step: (label, message) => line(color.cyan('▸'), label, message),
  /** @param {string} label @param {string} message */
  ok: (label, message) => line(color.green('✔'), label, message),
  /** @param {string} label @param {string} message */
  warn: (label, message) => line(color.yellow('!'), label, message),
  /** @param {string} label @param {string} message */
  fail: (label, message) => line(color.red('✖'), label, message),
  /** @param {string} message */
  detail: (message) => console.log(`             ${message}`),
}

/** An expected failure: printed without a stack trace. */
export class CliError extends Error {}
