import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { keyToAction, menu } from '../src/commands/dev.js'
import { TEMPLATE } from './helpers.js'

test('keyToAction maps the session keys and ignores the rest', () => {
  assert.equal(keyToAction('a'), 'android')
  assert.equal(keyToAction('i'), 'ios')
  assert.equal(keyToAction('r'), 'reload')
  assert.equal(keyToAction('c'), 'clear')
  assert.equal(keyToAction('?'), 'help')
  assert.equal(keyToAction('w'), 'restart-web')
  assert.equal(keyToAction('q'), 'quit')
  assert.equal(keyToAction('\u0003'), 'quit')
  assert.equal(keyToAction('x'), null)
  assert.equal(keyToAction('A'), null)
})

test('menu names every key and says native reload is a rebuild', () => {
  const text = menu()
  for (const key of ['a', 'i', 'r', 'w', 'c', '?', 'q']) {
    assert.match(text, new RegExp(`^${key === '?' ? '\\?' : key}  `, 'm'))
  }
  assert.match(text, /rebuilt and relaunched/)
  assert.match(text, /hot-reloads/)
})

test('framework.mk exposes run-all', () => {
  const makefile = readFileSync(path.join(TEMPLATE, '.geeknative', 'framework.mk'), 'utf8')
  assert.match(makefile, /^\.PHONY:.*\brun-all\b/m)
  assert.match(makefile, /^run-all: ## Start web and drive iOS\/Android from one terminal\n\t@\$\(ENV_PREFIX\)\$\(GEEKNATIVE\) run all$/m)
})
