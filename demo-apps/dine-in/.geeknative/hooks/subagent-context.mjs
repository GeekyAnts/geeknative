// Claude Code SubagentStart hook (managed by geeknative).
// Gives a platform subagent its platform's AGENTS.md as soon as it starts.
// Usage: node subagent-context.mjs <ios|android|web>
import { readFileSync } from 'node:fs'
import path from 'node:path'

const platform = process.argv[2]
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()

let guide
try {
  guide = readFileSync(path.join(root, 'apps', platform, 'AGENTS.md'), 'utf8')
} catch {
  process.exit(0)
}

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SubagentStart',
      additionalContext: `Conventions for this app, from apps/${platform}/AGENTS.md:\n\n${guide}`,
    },
  }),
)
