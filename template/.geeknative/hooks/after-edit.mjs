// Claude Code PostToolUse hook (managed by geeknative).
// When a file in contracts/ (or the root .env, which feeds the generated AppSecrets) is edited,
// regenerate app code right away, so the next build sees the change and mistakes in the
// contract are reported immediately.
import { spawnSync } from 'node:child_process'
import path from 'node:path'

let input = ''
for await (const chunk of process.stdin) input += chunk
const file = JSON.parse(input || '{}').tool_input?.file_path
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()

const edited = file ? path.resolve(root, file) : ''
if (!file || !(edited.startsWith(path.join(root, 'contracts') + path.sep) || edited === path.join(root, '.env'))) process.exit(0)

const result = spawnSync(path.join(root, 'node_modules', '.bin', 'geeknative'), ['gen'], { cwd: root, encoding: 'utf8' })
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()

if (result.error || result.status !== 0) {
  console.error(`\`make gen\` failed after editing ${path.relative(root, file)}. Fix the problem:\n${output || result.error}`)
  process.exit(2)
}
console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `${path.basename(file) === '.env' ? '.env' : 'Contracts'} changed, so geeknative regenerated the app code:\n${output}`,
    },
  }),
)
