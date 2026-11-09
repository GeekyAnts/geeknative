import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { launchExtrasFor, screensFromNavigation, storageForScreen } from './publish-demo-app.mjs'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function nav(slug) {
  return readFileSync(path.join(repo, 'demo-apps', slug, 'spec', 'navigation.md'), 'utf8')
}

test('reads Dine-In signed-out, tab, and pushed tables', () => {
  const screens = screensFromNavigation(nav('dine-in'))
  assert.equal(screens.find((screen) => screen.id === 'welcome')?.signedIn, false)
  assert.equal(screens.find((screen) => screen.id === 'discover')?.webPath, '/')
  assert.equal(screens.find((screen) => screen.id === 'restaurant')?.webPath, '/restaurants/$restaurantId')
  assert.ok(screens.some((screen) => screen.id === 'settings' && screen.signedIn))
})

test('reads ORLÈVE’s single navigation table without Dine-In headings', () => {
  const screens = screensFromNavigation(nav('destination-wedding-planner'))
  const ids = screens.map((screen) => screen.id)
  assert.deepEqual(ids, [
    'home',
    'destinations',
    'destination-detail',
    'venues',
    'venue-detail',
    'experiences',
    'packages',
    'wedding',
    'settings',
  ])
  assert.equal(screens.find((screen) => screen.id === 'destination-detail')?.webPath, '/destinations/$id')
})

test('reads the starter navigation table', () => {
  const markdown = readFileSync(path.join(repo, 'template', 'spec', 'navigation.md'), 'utf8')
  const screens = screensFromNavigation(markdown)
  assert.deepEqual(
    screens.map((screen) => screen.id),
    ['home', 'settings'],
  )
})

test('webStorage signedIn map seeds session keys; signed-out screens skip them', () => {
  const shots = {
    webStorage: {
      signedOut: { 'onboarding.completed': 'true' },
      signedIn: {
        'onboarding.completed': 'true',
        'auth.session': 'aarav@example.com',
        'saved.aarav@example.com': ['koyo'],
      },
    },
  }
  const signedOut = storageForScreen(shots, { signedIn: false }, 'dark')
  assert.equal(signedOut['settings.appearance'], 'dark')
  assert.equal(signedOut['onboarding.completed'], 'true')
  assert.equal(signedOut['auth.session'], undefined)

  const signedIn = storageForScreen(shots, { signedIn: true }, 'light')
  assert.equal(signedIn['auth.session'], 'aarav@example.com')
  assert.equal(signedIn['saved.aarav@example.com'], '["koyo"]')
})

test('a flat webStorage map is applied on every screen (ORLÈVE)', () => {
  const shots = { webStorage: { 'wedding.plan': { destinationId: 'udaipur', venueId: 'udaipur-taj-lake' } } }
  const storage = storageForScreen(shots, { signedIn: false }, 'light')
  assert.equal(storage['wedding.plan'], '{"destinationId":"udaipur","venueId":"udaipur-taj-lake"}')
})

test('screen webStorage: false is appearance only', () => {
  const shots = { webStorage: { signedOut: { 'onboarding.completed': 'true' } } }
  const storage = storageForScreen(shots, { signedIn: false, webStorage: false }, 'light')
  assert.deepEqual(storage, { 'settings.appearance': 'light' })
})

test('launchExtras come from shots.json, not hardcoded restaurant ids', () => {
  const extras = launchExtrasFor(
    { launchExtras: { screenshotDestinationId: 'udaipur', screenshotVenueId: 'udaipur-taj-lake' } },
    { id: 'venue', launchExtras: { screenshotVenueId: 'santorini-canaves' } },
    'dark',
  )
  assert.deepEqual(extras, {
    screenshotScreen: 'venue',
    screenshotAppearance: 'dark',
    screenshotDestinationId: 'udaipur',
    screenshotVenueId: 'santorini-canaves',
  })
})
