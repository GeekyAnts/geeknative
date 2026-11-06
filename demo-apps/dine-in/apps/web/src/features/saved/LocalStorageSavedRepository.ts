import { readJson, type KeyValueStorage } from '#/core/KeyValueStorage'
import { savedStorageKey, type SavedRepository } from './SavedRepository'

/** Saved restaurant IDs as a JSON array under `saved.<email>`, most recently saved first. */
export class LocalStorageSavedRepository implements SavedRepository {
  private readonly storage: KeyValueStorage | undefined
  private readonly member: () => string | null

  constructor(storage: KeyValueStorage | undefined, member: () => string | null) {
    this.storage = storage
    this.member = member
  }

  private read(): string[] {
    const email = this.member()
    const value = email ? readJson(this.storage, savedStorageKey(email)) : undefined
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  }

  async ids(): Promise<string[]> {
    return this.read()
  }

  async isSaved(restaurantId: string): Promise<boolean> {
    return this.read().includes(restaurantId)
  }

  async toggle(restaurantId: string): Promise<boolean> {
    const email = this.member()
    if (!email) return false
    const ids = this.read()
    const saved = !ids.includes(restaurantId)
    const next = saved ? [restaurantId, ...ids] : ids.filter((id) => id !== restaurantId)
    this.storage?.setItem(savedStorageKey(email), JSON.stringify(next))
    return saved
  }
}
