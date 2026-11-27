// Claude Code PostToolUse hook (managed by geeknative).
// When a file in contracts/ or assets/ is edited, or the root .env (which feeds the generated
// AppSecrets), regenerate app code right away, so the next build sees the change and mistakes
// are reported immediately.
import { spawnSync } from 'node:child_process'
import path from 'node:path'

let input = ''
for await (const chunk of process.stdin) input += chunk
const file = JSON.parse(input || '{}').tool_input?.file_path
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()

const edited = file ? path.resolve(root, file) : ''
const inContracts = edited.startsWith(path.join(root, 'contracts') + path.sep)
const inAssets = edited.startsWith(path.join(root, 'assets') + path.sep)
const isEnv = edited === path.join(root, '.env')
if (!file || !(inContracts || inAssets || isEnv)) process.exit(0)

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
      additionalContext: `${isEnv ? '.env' : inAssets ? 'Assets' : 'Contracts'} changed, so geeknative regenerated the app code:\n${output}`,
    },
  }),
)
