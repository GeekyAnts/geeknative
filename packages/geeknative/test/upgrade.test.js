import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { planDependency, upgrade } from '../src/commands/upgrade.js'
import { hashContent, readLock, writeLockFrom } from '../src/lib/managed.js'
import { PACKAGE_DIR } from '../src/lib/project.js'
import { tempDir, writeJson } from './helpers.js'

const framework = '.geeknative/framework.mk'
const playbook = '.geeknative/playbooks/feature.md'

/** @param {string} body @param {string} [rules] */
function agents(body, rules = '- mine') {
  return `<!-- geeknative:begin (managed) -->\n${body}<!-- geeknative:end -->\n\n## Project rules\n\n${rules}\n`
}

/** A project, the template it was installed from, and the template to upgrade to. */
function setup() {
  const root = tempDir()
  const base = path.join(root, 'base')
  const next = path.join(root, 'next')
  const project = path.join(root, 'project')
  const files = {
    [framework]: 'alpha\nkeep\nmiddle\nbeta\nkeep\ngamma\n',
    [playbook]: 'playbook\n',
    'AGENTS.md': agents('alpha\nbeta\n'),
    'PRODUCT.md': 'template product\n',
  }
  for (const dir of [base, next, project]) {
    for (const [rel, content] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
      writeFileSync(path.join(dir, rel), content)
    }
  }
  writeFileSync(path.join(project, 'PRODUCT.md'), 'mine\n')
  writeLockFrom(project, '0.1.0', base)
  return { base, next, project }
}

/**
 * @param {ReturnType<typeof setup>} ctx
 * @param {Parameters<typeof upgrade>[1]} [options]
 */
function run(ctx, options = {}) {
  return upgrade(ctx.project, {
    baseDir: ctx.base,
    nextDir: ctx.next,
    version: '0.2.0',
    gen: false,
    updateDependency: false,
    install: false,
    ...options,
  })
}

test('an untouched framework file is replaced and project files stay', async () => {
  const ctx = setup()
  writeFileSync(path.join(ctx.next, framework), 'shipped\n')

  const result = await run(ctx)

  assert.equal(result.ok, true)
  assert.equal(readFileSync(path.join(ctx.project, framework), 'utf8'), 'shipped\n')
  assert.equal(readFileSync(path.join(ctx.project, 'PRODUCT.md'), 'utf8'), 'mine\n')
  const lock = readLock(ctx.project)
  assert.equal(lock.geeknative, '0.2.0')
  assert.equal(lock.files[framework], hashContent('shipped\n'))
})

test('a replaced block keeps the project rules under it', async () => {
  const ctx = setup()
  writeFileSync(path.join(ctx.next, 'AGENTS.md'), agents('shipped rules\n'))
  writeFileSync(path.join(ctx.project, 'AGENTS.md'), agents('alpha\nbeta\n', '- mine\n- playful'))

  await run(ctx)

  const text = readFileSync(path.join(ctx.project, 'AGENTS.md'), 'utf8')
  assert.match(text, /shipped rules/)
  assert.match(text, /- playful/)
  assert.doesNotMatch(text, /^alpha$/m)
})

test('an edited framework file merges when the edits do not overlap', async () => {
  const ctx = setup()
  writeFileSync(path.join(ctx.project, framework), 'alpha\nkeep\nmiddle\nbeta-local\nkeep\ngamma\n')
  writeFileSync(path.join(ctx.next, framework), 'alpha\nkeep\nmiddle\nbeta\nkeep\ngamma-next\n')

  const result = await run(ctx)

  assert.equal(result.ok, true)
  assert.equal(readFileSync(path.join(ctx.project, framework), 'utf8'), 'alpha\nkeep\nmiddle\nbeta-local\nkeep\ngamma-next\n')
  // The lock records the template, so the local edit still differs from it.
  assert.equal(readLock(ctx.project).files[framework], hashContent('alpha\nkeep\nmiddle\nbeta\nkeep\ngamma-next\n'))
})

test('an overlapping edit is left in place and reported', async () => {
  const ctx = setup()
  writeFileSync(path.join(ctx.project, framework), 'alpha\nkeep\nmiddle\nbeta-local\nkeep\ngamma\n')
  writeFileSync(path.join(ctx.next, framework), 'alpha\nkeep\nmiddle\nbeta-next\nkeep\ngamma\n')

  const result = await run(ctx)

  assert.equal(result.ok, false)
  assert.equal(readFileSync(path.join(ctx.project, framework), 'utf8'), 'alpha\nkeep\nmiddle\nbeta-local\nkeep\ngamma\n')
  assert.equal(readLock(ctx.project).geeknative, '0.1.0')
  const conflict = readFileSync(path.join(ctx.project, '.geeknative', 'upgrade', framework), 'utf8')
  assert.match(conflict, /<<<<<<< yours/)
  assert.match(conflict, /beta-local/)
  assert.match(conflict, /beta-next/)
})

test('a new framework file is added and an unmodified one this version drops is removed', async () => {
  const ctx = setup()
  const added = '.geeknative/playbooks/extra.md'
  mkdirSync(path.dirname(path.join(ctx.next, added)), { recursive: true })
  writeFileSync(path.join(ctx.next, added), 'extra\n')
  rmSync(path.join(ctx.next, playbook))

  const result = await run(ctx)

  assert.equal(result.ok, true)
  assert.equal(readFileSync(path.join(ctx.project, added), 'utf8'), 'extra\n')
  assert.equal(existsSync(path.join(ctx.project, playbook)), false)
})

test('an edited file this version drops is kept', async () => {
  const ctx = setup()
  writeFileSync(path.join(ctx.project, playbook), 'local playbook\n')
  rmSync(path.join(ctx.next, playbook))

  const result = await run(ctx)

  assert.equal(result.ok, true)
  assert.equal(readFileSync(path.join(ctx.project, playbook), 'utf8'), 'local playbook\n')
})

test('a file you deleted is not recreated', async () => {
  const ctx = setup()
  rmSync(path.join(ctx.project, framework))
  writeFileSync(path.join(ctx.next, framework), 'shipped\n')

  const result = await run(ctx)

  assert.equal(result.ok, true)
  assert.equal(existsSync(path.join(ctx.project, framework)), false)
})

test('dry run changes nothing', async () => {
  const ctx = setup()
  writeFileSync(path.join(ctx.next, framework), 'shipped\n')

  const result = await run(ctx, { dryRun: true })

  assert.equal(result.ok, true)
  assert.equal(readFileSync(path.join(ctx.project, framework), 'utf8'), 'alpha\nkeep\nmiddle\nbeta\nkeep\ngamma\n')
  assert.equal(readLock(ctx.project).geeknative, '0.1.0')
})

test('an edited file is not overwritten when the installed template is gone', async () => {
  const ctx = setup()
  writeFileSync(path.join(ctx.project, framework), 'alpha\nkeep\nmiddle\nbeta-local\nkeep\ngamma\n')
  writeFileSync(path.join(ctx.next, framework), 'shipped\n')

  const result = await run(ctx, { baseDir: null })

  assert.equal(result.ok, false)
  assert.equal(readFileSync(path.join(ctx.project, framework), 'utf8'), 'alpha\nkeep\nmiddle\nbeta-local\nkeep\ngamma\n')
  assert.equal(readFileSync(path.join(ctx.project, '.geeknative', 'upgrade', framework), 'utf8'), 'shipped\n')
  assert.equal(readLock(ctx.project).geeknative, '0.1.0')
})

test('upgrade refuses a project with no lockfile', async () => {
  await assert.rejects(upgrade(tempDir(), { gen: false, updateDependency: false }), /no \.geeknative\/lock\.json/)
})

test('a project already on this version is left as it is', async () => {
  const ctx = setup()
  const result = await run(ctx, { version: '0.1.0' })
  assert.equal(result.ok, true)
  assert.equal(readFileSync(path.join(ctx.project, framework), 'utf8'), 'alpha\nkeep\nmiddle\nbeta\nkeep\ngamma\n')
  assert.equal(readLock(ctx.project).geeknative, '0.1.0')
})

test('planDependency keeps a pin on the checkout unless --npm is passed', () => {
  assert.equal(planDependency('registry', { fromCheckout: false, version: '0.2.0' }).spec, '^0.2.0')
  assert.equal(planDependency('snapshot', { fromCheckout: false, version: '0.2.0' }).action, 'refuse')
  assert.equal(planDependency('snapshot', { fromCheckout: false, version: '0.2.0', forceNpm: true }).spec, '^0.2.0')
  assert.equal(planDependency('linked', { fromCheckout: true, version: '0.2.0' }).action, 'link')
  assert.equal(planDependency('snapshot', { fromCheckout: true, version: '0.2.0' }).action, 'snapshot')
  assert.equal(planDependency('registry', { fromCheckout: true, version: '0.2.0' }).action, 'snapshot')
})

test('a registry project is pointed at the version that ran upgrade', async () => {
  const ctx = setup()
  writeJson(path.join(ctx.project, 'package.json'), { name: 'app', devDependencies: { geeknative: '^0.1.0' } })

  const result = await run(ctx, { updateDependency: true, fromCheckout: false, version: '0.2.0' })

  assert.equal(result.ok, true)
  assert.equal(readJson(path.join(ctx.project, 'package.json')).devDependencies.geeknative, '^0.2.0')
})

test('a registry upgrade will not replace a snapshot pin unless --npm is set', async () => {
  const ctx = setup()
  const tarball = path.join(ctx.project, '.geeknative', 'geeknative-0.1.0-aaaaaaa.tgz')
  writeFileSync(tarball, 'old')
  writeJson(path.join(ctx.project, 'package.json'), {
    name: 'app',
    devDependencies: { geeknative: 'file:.geeknative/geeknative-0.1.0-aaaaaaa.tgz' },
  })
  writeFileSync(path.join(ctx.next, framework), 'shipped\n')

  await assert.rejects(run(ctx, { updateDependency: true, fromCheckout: false }), /--npm/)
  assert.equal(readFileSync(path.join(ctx.project, framework), 'utf8'), 'alpha\nkeep\nmiddle\nbeta\nkeep\ngamma\n')

  const result = await run(ctx, { updateDependency: true, fromCheckout: false, npm: true })
  assert.equal(result.ok, true)
  assert.equal(readJson(path.join(ctx.project, 'package.json')).devDependencies.geeknative, '^0.2.0')
  assert.equal(existsSync(tarball), false)
  assert.equal(readFileSync(path.join(ctx.project, framework), 'utf8'), 'shipped\n')
})

test('a linked checkout stays linked', async () => {
  const ctx = setup()
  writeJson(path.join(ctx.project, 'package.json'), { name: 'app', devDependencies: { geeknative: `file:${PACKAGE_DIR}` } })

  const result = await run(ctx, { updateDependency: true, fromCheckout: true })

  assert.equal(result.ok, true)
  assert.equal(readJson(path.join(ctx.project, 'package.json')).devDependencies.geeknative, `file:${PACKAGE_DIR}`)
  assert.deepEqual(
    readdirSync(path.join(ctx.project, '.geeknative')).filter((name) => name.endsWith('.tgz')),
    [],
  )
})

test('a checkout upgrade refreshes the snapshot pin', async () => {
  const ctx = setup()
  cpSync(path.join(ctx.base, '.geeknative'), path.join(ctx.project, '.geeknative'), { recursive: true })
  const old = path.join(ctx.project, '.geeknative', 'geeknative-0.1.0-0000000.tgz')
  writeFileSync(old, 'old')
  writeJson(path.join(ctx.project, 'package.json'), {
    name: 'app',
    devDependencies: { geeknative: 'file:.geeknative/geeknative-0.1.0-0000000.tgz' },
  })
  writeLockFrom(ctx.project, '0.1.0', ctx.base)

  const result = await run(ctx, { updateDependency: true, fromCheckout: true })

  assert.equal(result.ok, true)
  const spec = readJson(path.join(ctx.project, 'package.json')).devDependencies.geeknative
  assert.match(spec, /^file:\.geeknative\/geeknative-[\d.]+-[0-9a-f]+(-dirty)?\.tgz$/)
  assert.equal(existsSync(old), false)
  assert.equal(existsSync(path.join(ctx.project, spec.replace('file:', ''))), true)
})

/** @param {string} file */
function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}
