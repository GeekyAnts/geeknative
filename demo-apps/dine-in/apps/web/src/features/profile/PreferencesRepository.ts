import type { DiningPreferences } from './DiningPreferences'

/** The signed-in member's dining preferences. */
export interface PreferencesRepository {
  load(): Promise<DiningPreferences>
  save(preferences: DiningPreferences): Promise<void>
}
