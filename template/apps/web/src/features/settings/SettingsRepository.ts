import type { Appearance } from './Appearance'

/** Stores the user's preferences. Screens use whichever implementation AppContainer provides. */
export interface SettingsRepository {
  getAppearance(): Promise<Appearance>
  setAppearance(appearance: Appearance): Promise<void>
}
