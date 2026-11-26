import { describe, expect, test } from 'vitest'
import { AppIdentity } from '#/generated/app'
import { LocalStorageProfileRepository } from './LocalStorageProfileRepository'
import { defaultProfile, parseProfile } from './parseProfile'
import { versionText } from './useProfileViewModel'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

describe('Profile', () => {
  test('AC-profile-1: name and email are still there after a restart', async () => {
    const storage = memoryStorage()
    await new LocalStorageProfileRepository(storage).set({
      ...defaultProfile(),
      displayName: 'Ada',
      email: 'ada@example.com',
    })
    const stored = await new LocalStorageProfileRepository(storage).get()
    expect(stored.displayName).toBe('Ada')
    expect(stored.email).toBe('ada@example.com')
  })

  test('AC-profile-2: usual travelers, budget and favorite categories persist', async () => {
    const storage = memoryStorage()
    await new LocalStorageProfileRepository(storage).set({
      displayName: '',
      email: '',
      defaultTravelers: 4,
      budgetBand: 'luxury',
      preferredCategories: ['food', 'history'],
    })
    expect(await new LocalStorageProfileRepository(storage).get()).toEqual({
      displayName: '',
      email: '',
      defaultTravelers: 4,
      budgetBand: 'luxury',
      preferredCategories: ['food', 'history'],
    })
  })

  test('AC-profile-4: Profile shows the app version and build number', () => {
    expect(versionText()).toContain(AppIdentity.version)
    expect(versionText()).toContain(String(AppIdentity.build))
  })

  test('missing or invalid profile values fall back to defaults', () => {
    expect(parseProfile(null)).toEqual(defaultProfile())
    expect(parseProfile('nope')).toEqual(defaultProfile())
    expect(parseProfile(JSON.stringify({ defaultTravelers: 99, budgetBand: 'gold' })).defaultTravelers).toBe(8)
    expect(parseProfile(JSON.stringify({ defaultTravelers: 99, budgetBand: 'gold' })).budgetBand).toBe('mid')
  })
})
