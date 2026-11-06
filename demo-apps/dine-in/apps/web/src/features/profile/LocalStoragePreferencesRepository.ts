import { readJson, type KeyValueStorage } from '#/core/KeyValueStorage'
import { defaultPreferences, parsePreferences, preferencesStorageKey, type DiningPreferences } from './DiningPreferences'
import type { PreferencesRepository } from './PreferencesRepository'

/** Preferences as JSON under `preferences.<email>`. */
export class LocalStoragePreferencesRepository implements PreferencesRepository {
  private readonly storage: KeyValueStorage | undefined
  private readonly member: () => string | null

  constructor(storage: KeyValueStorage | undefined, member: () => string | null) {
    this.storage = storage
    this.member = member
  }

  async load(): Promise<DiningPreferences> {
    const email = this.member()
    return email ? parsePreferences(readJson(this.storage, preferencesStorageKey(email))) : defaultPreferences()
  }

  async save(preferences: DiningPreferences): Promise<void> {
    const email = this.member()
    if (!email) return
    this.storage?.setItem(preferencesStorageKey(email), JSON.stringify(parsePreferences(preferences)))
  }
}
