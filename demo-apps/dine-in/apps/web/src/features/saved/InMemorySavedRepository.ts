import { memoryStorage } from '#/core/KeyValueStorage'
import { LocalStorageSavedRepository } from './LocalStorageSavedRepository'
import { savedStorageKey } from './SavedRepository'

const MEMBER = 'member'

/** Saved restaurants held in memory for one member, for tests and previews. */
export class InMemorySavedRepository extends LocalStorageSavedRepository {
  constructor(initial: string[] = []) {
    super(memoryStorage({ [savedStorageKey(MEMBER)]: JSON.stringify(initial) }), () => MEMBER)
  }
}
