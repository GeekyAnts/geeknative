#!/usr/bin/env node
import { main } from '../src/cli.js'
import { CliError, color } from '../src/lib/log.js'

main(process.argv.slice(2)).catch((error) => {
  if (error instanceof CliError || error?.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
    console.error(`${color.red('✖')} ${error.message}`)
  } else {
    console.error(error)
  }
  process.exitCode = 1
})
