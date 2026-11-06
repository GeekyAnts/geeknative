import { QueryClient } from '@tanstack/react-query'
import { describe, expect, test } from 'vitest'
import { AppIdentity } from '#/generated/app'
import { isDark, parseAppearance } from './Appearance'
import { LocalStorageSettingsRepository } from './LocalStorageSettingsRepository'
import { appearanceQuery, selectAppearance, versionText } from './useSettingsViewModel'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

describe('Settings', () => {
  test('AC-settings-1: appearance defaults to System', async () => {
    const repository = new LocalStorageSettingsRepository(memoryStorage())
    expect(await repository.getAppearance()).toBe('system')
    expect(parseAppearance('sepia')).toBe('system')
  })

  test('AC-settings-2: choosing an appearance applies it to the whole app immediately', async () => {
    const queryClient = new QueryClient()
    const repository = new LocalStorageSettingsRepository(memoryStorage())
    const saving = selectAppearance(queryClient, repository, 'dark')
    // The shared query changes before saving finishes, so every screen updates at once.
    expect(queryClient.getQueryData(appearanceQuery(repository).queryKey)).toBe('dark')
    await saving
    expect(isDark('dark', false)).toBe(true)
    expect(isDark('system', true)).toBe(true)
    expect(isDark('light', true)).toBe(false)
  })

  test('AC-settings-3: the chosen appearance survives a restart', async () => {
    const storage = memoryStorage()
    await new LocalStorageSettingsRepository(storage).setAppearance('light')
    expect(await new LocalStorageSettingsRepository(storage).getAppearance()).toBe('light')
  })

  test('AC-settings-4: shows the app version and build number', () => {
    expect(versionText()).toContain(AppIdentity.version)
    expect(versionText()).toContain(String(AppIdentity.build))
  })
})
