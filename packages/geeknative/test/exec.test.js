import assert from 'node:assert/strict'
import { test } from 'node:test'
import { captureAsync } from '../src/lib/exec.js'

test('captureAsync returns trimmed stdout and null on failure', async () => {
  assert.equal(await captureAsync(process.execPath, ['-e', 'process.stdout.write("  hi  ")']), 'hi')
  assert.equal(await captureAsync(process.execPath, ['-e', 'process.exit(1)']), null)
  assert.equal(await captureAsync('definitely-not-a-command-geeknative', []), null)
})

test('captureAsync passes stdin through', async () => {
  const result = await captureAsync(process.execPath, ['-e', 'process.stdout.write(require("fs").readFileSync(0, "utf8"))'], {
    input: '  from-stdin  ',
  })
  assert.equal(result, 'from-stdin')
})

test('captureAsync does not block the event loop', async () => {
  let ticked = false
  const timer = setTimeout(() => {
    ticked = true
  }, 50)
  const result = await captureAsync('sleep', ['0.3'])
  clearTimeout(timer)
  assert.equal(result, '')
  assert.equal(ticked, true)
})

test('captureAsync timeout kills the command and resolves null', async () => {
  const started = Date.now()
  const result = await captureAsync('sleep', ['30'], { timeout: 200 })
  assert.equal(result, null)
  assert.ok(Date.now() - started < 5000)
})
