import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chooseSimulator } from '../src/lib/toolchains.js'

const list = {
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-26-5': [
      { udid: 'old-booted', name: 'iPhone 17 Pro', state: 'Booted', isAvailable: true },
    ],
    'com.apple.CoreSimulator.SimRuntime.iOS-27-0': [
      { udid: 'new-1', name: 'iPhone 18 Pro', state: 'Shutdown', isAvailable: true },
      { udid: 'new-2', name: 'iPhone 18', state: 'Shutdown', isAvailable: true },
      { udid: 'ipad', name: 'iPad Pro', state: 'Booted', isAvailable: true },
    ],
    'com.apple.CoreSimulator.SimRuntime.watchOS-12-0': [{ udid: 'watch', name: 'Apple Watch', state: 'Booted' }],
  },
}

test('simulator: always the newest iOS runtime, even when an older iPhone is booted', () => {
  assert.equal(chooseSimulator(list)?.udid, 'new-1')
})

test('simulator: a booted iPhone on the newest runtime wins the tie', () => {
  const booted = structuredClone(list)
  booted.devices['com.apple.CoreSimulator.SimRuntime.iOS-27-0'][1].state = 'Booted'
  assert.equal(chooseSimulator(booted)?.udid, 'new-2')
})

test('simulator: GEEKNATIVE_IOS_SIMULATOR picks by name or UDID', () => {
  assert.equal(chooseSimulator(list, 'iPhone 17 Pro')?.udid, 'old-booted')
  assert.equal(chooseSimulator(list, 'new-2')?.name, 'iPhone 18')
  assert.equal(chooseSimulator(list, 'Missing Phone'), null)
})

test('simulator: none without an iPhone', () => {
  assert.equal(chooseSimulator({ devices: {} }), null)
})
