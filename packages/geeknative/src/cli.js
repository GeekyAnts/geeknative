// @ts-check
import { parseArgs } from 'node:util'
import { check } from './commands/check.js'
import { create } from './commands/create.js'
import { doctor } from './commands/doctor.js'
import { font } from './commands/font.js'
import { gen } from './commands/gen.js'
import { parity } from './commands/parity.js'
import { run } from './commands/run.js'
import { CliError, color } from './lib/log.js'
import { findProjectRoot, packageVersion } from './lib/project.js'

const HELP = `${color.bold('geeknative')}: one prompt, three native apps (SwiftUI, Jetpack Compose, TanStack Start)

Usage: geeknative <command>

  create <folder>      Create a project. Options: --name "My App" --id com.acme.myapp --no-install --no-git
                       (from a geeknative checkout, --link follows the checkout instead of pinning a snapshot)
  gen                  Regenerate platform code from contracts/
  font <family>        Switch the shared typeface: a Google Fonts family ("Open Sans") or system
  check [targets]      Verify contracts, then build and test. Targets: all (default), contracts, ios, android, web
  doctor [--fix]       Check Xcode, the Android SDK and Node; --fix installs what it can
  parity               Update spec/parity.md from feature specs and tests
  run <platform>       Build and launch: ios (simulator), android (emulator or device), web (dev server)
  version              Print the version
`

/** @param {string[]} argv */
export async function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      name: { type: 'string' },
      id: { type: 'string' },
      'no-install': { type: 'boolean' },
      'no-git': { type: 'boolean' },
      link: { type: 'boolean' },
      fix: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  })
  const [command, ...rest] = positionals

  if (values.version || command === 'version') return console.log(packageVersion())
  if (values.help || !command || command === 'help') return console.log(HELP)

  switch (command) {
    case 'create':
      return create(rest[0], { name: values.name, id: values.id, install: !values['no-install'], git: !values['no-git'], link: values.link })
    case 'gen':
      return void gen(findProjectRoot())
    case 'font':
      return font(findProjectRoot(), rest.join(' '))
    case 'check':
      return check(findProjectRoot(), rest)
    case 'doctor':
      return doctor(findProjectRoot(), { fix: values.fix })
    case 'parity':
      return parity(findProjectRoot())
    case 'run':
      return run(findProjectRoot(), rest[0])
    default:
      throw new CliError(`Unknown command "${command}".\n\n${HELP}`)
  }
}
