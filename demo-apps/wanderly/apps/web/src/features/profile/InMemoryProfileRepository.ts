import type { Profile } from '#/features/catalog/types'
import type { ProfileRepository } from './ProfileRepository'
import { defaultProfile } from './parseProfile'

/** In-memory profile for tests. */
export class InMemoryProfileRepository implements ProfileRepository {
  private profile: Profile

  constructor(profile: Profile = defaultProfile()) {
    this.profile = profile
  }

  async get(): Promise<Profile> {
    return this.profile
  }

  async set(profile: Profile): Promise<void> {
    this.profile = profile
  }
}
