import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { keyToAction, menu, sessionBanner } from '../src/commands/dev.js'
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

/** @param {string} text */
const plain = (text) => text.replace(/\x1b\[[0-9;]*m/g, '')

test('menu names every key and says native reload is a rebuild', () => {
  const text = plain(menu())
  for (const key of ['a', 'i', 'r', 'w', 'c', '?', 'q']) {
    assert.match(text, new RegExp(`^${key === '?' ? '\\?' : key}  `, 'm'))
  }
  assert.match(text, /rebuild and relaunch/)
  assert.match(text, /hot-reloads on its own/)
  assert.match(text, /does not live-reload/)
})

test('sessionBanner shows the wordmark and what is running', () => {
  const down = plain(sessionBanner({ name: 'Notes', url: 'http://localhost:3000', webUp: false, ios: false, android: false }))
  assert.match(down, /______/)
  assert.match(down, /^Notes$/m)
  assert.match(down, /^web {7}exited$/m)
  assert.match(down, /^ios {7}not launched$/m)
  assert.match(down, /^android {3}not launched$/m)
  assert.doesNotMatch(down, /localhost/)

  const up = plain(
    sessionBanner({
      name: 'Notes',
      url: 'http://localhost:3000',
      environment: 'staging',
      webUp: true,
      ios: true,
      android: true,
    }),
  )
  assert.match(up, /^Notes {2}staging$/m)
  assert.match(up, /^web {7}http:\/\/localhost:3000$/m)
  assert.match(up, /^ios {7}launched$/m)
  assert.match(up, /^android {3}launched$/m)
})

test('framework.mk exposes run-all', () => {
  const makefile = readFileSync(path.join(TEMPLATE, '.geeknative', 'framework.mk'), 'utf8')
  assert.match(makefile, /^\.PHONY:.*\brun-all\b/m)
  assert.match(makefile, /^run-all: ## Start web and drive iOS\/Android from one terminal\n\t@\$\(ENV_PREFIX\)\$\(GEEKNATIVE\) run all$/m)
})
