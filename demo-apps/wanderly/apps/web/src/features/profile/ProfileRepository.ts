import type { Profile } from '#/features/catalog/types'

/** Traveler name, email and default trip preferences. */
export interface ProfileRepository {
  get(): Promise<Profile>
  set(profile: Profile): Promise<void>
}
