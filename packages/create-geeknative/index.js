#!/usr/bin/env node
// `npm create geeknative my-app -- --name "My App"` runs this, which forwards to `geeknative create`.
import { main } from 'geeknative/src/cli.js'

main(['create', ...process.argv.slice(2)]).catch((error) => {
  console.error(error?.message ?? error)
  process.exitCode = 1
})
