// @ts-check
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/** Relative path written into the project for agent-assisted work. */
export const PENDING_MIGRATION_DOC = '.geeknative/migrations/pending/MIGRATION.md'

/**
 * Builds the markdown an agent (or human) should read. GeekNative never invokes an agent.
 * @param {import('./registry.js').Migration[]} migrations
 */
export function formatPendingMigrationDoc(migrations) {
  const sections = migrations.map((migration) => formatOne(migration)).join('\n\n')
  return `# Pending agent-assisted migrations

GeekNative does **not** invoke Cursor, Claude, Gemini, or any other agent.
Ask your coding agent to read this file and apply each migration on **iOS, Android, and web**.

When a migration is done in the project, mark it complete yourself:

\`\`\`sh
npx geeknative migrate --complete <id>
\`\`\`

Do not treat this file as proof of completion. Generating or updating it only marks migrations as **prepared**.

${sections}
`
}

/**
 * Writes or removes `.geeknative/migrations/pending/MIGRATION.md`.
 * @param {string} root
 * @param {import('./registry.js').Migration[]} migrations agent-assisted and not yet completed
 * @param {{ dryRun?: boolean }} [options]
 * @returns {string | null} relative path written, or null when removed / nothing to write
 */
export function syncPendingMigrationDoc(root, migrations, { dryRun = false } = {}) {
  const relative = PENDING_MIGRATION_DOC
  const full = path.join(root, relative)
  const dir = path.dirname(full)

  if (!migrations.length) {
    if (!dryRun && existsSync(full)) {
      rmSync(full, { force: true })
      const pendingDir = path.join(root, '.geeknative', 'migrations', 'pending')
      if (existsSync(pendingDir)) rmSync(pendingDir, { recursive: true, force: true })
    }
    return null
  }

  const body = formatPendingMigrationDoc(migrations)
  if (!dryRun) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(full, body)
  }
  return relative
}

/** @param {import('./registry.js').Migration} migration */
function formatOne(migration) {
  const platforms = (migration.platforms?.length ? migration.platforms : ['ios', 'android', 'web']).join(', ')
  const objective = migration.objective?.trim() || migration.title
  const changes = listBlock('Required changes', migration.changes)
  const validation = listBlock('Validation', migration.validation)
  const guide = migration.guide?.trim()
    ? `### Additional notes\n\n${migration.guide.trim()}`
    : ''

  return `## \`${migration.id}\`: ${migration.title}

**Objective:** ${objective}

**Platforms:** ${platforms}

${changes}

${validation}

${guide}`.trim()
}

/** @param {string} heading @param {string[] | undefined} items */
function listBlock(heading, items) {
  const lines = items?.length ? items.map((item) => `- ${item}`) : ['- (none listed)']
  return `### ${heading}\n\n${lines.join('\n')}`
}
