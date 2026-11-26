import { describe, expect, test } from 'vitest'
import { LocalStorageSavedRepository } from './LocalStorageSavedRepository'
import { parseSaved, toggleSaved } from './parseSaved'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

describe('Saved', () => {
  test('AC-saved-5: saved items are still listed after an app restart', async () => {
    const storage = memoryStorage()
    await new LocalStorageSavedRepository(storage).toggle({ id: 'bali', kind: 'destination' })
    expect(await new LocalStorageSavedRepository(storage).list()).toEqual([{ id: 'bali', kind: 'destination' }])
  })

  test('missing or invalid values are an empty list and duplicates collapse', () => {
    expect(parseSaved(null)).toEqual([])
    expect(parseSaved('not-json')).toEqual([])
    expect(
      parseSaved(JSON.stringify([
        { id: 'bali', kind: 'destination' },
        { id: 'bali', kind: 'destination' },
      ])),
    ).toEqual([{ id: 'bali', kind: 'destination' }])
    expect(toggleSaved([{ id: 'bali', kind: 'destination' }], { id: 'bali', kind: 'destination' })).toEqual([])
  })
})
