import { memoryStorage } from '#/core/KeyValueStorage'
import { preferencesStorageKey, type DiningPreferences } from './DiningPreferences'
import { LocalStoragePreferencesRepository } from './LocalStoragePreferencesRepository'

const MEMBER = 'member'

/** Preferences held in memory for one member, for tests and previews. */
export class InMemoryPreferencesRepository extends LocalStoragePreferencesRepository {
  constructor(initial?: Partial<DiningPreferences>) {
    super(memoryStorage(initial ? { [preferencesStorageKey(MEMBER)]: JSON.stringify(initial) } : {}), () => MEMBER)
  }
}
