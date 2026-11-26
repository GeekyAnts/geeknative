import type { Profile } from '#/features/catalog/types'
import type { ProfileRepository } from './ProfileRepository'
import { parseProfile, PROFILE_STORAGE_KEY } from './parseProfile'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

/** Keeps the traveler profile in localStorage. Without storage (SSR) it returns defaults. */
export class LocalStorageProfileRepository implements ProfileRepository {
  private readonly storage: KeyValueStorage | undefined

  constructor(storage: KeyValueStorage | undefined) {
    this.storage = storage
  }

  async get(): Promise<Profile> {
    return parseProfile(this.storage?.getItem(PROFILE_STORAGE_KEY))
  }

  async set(profile: Profile): Promise<void> {
    this.storage?.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  }
}
