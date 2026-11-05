import type { Appearance } from './Appearance'
import type { SettingsRepository } from './SettingsRepository'

/** Keeps settings in memory only. For tests and previews: nothing survives a restart. */
export class InMemorySettingsRepository implements SettingsRepository {
  private appearance: Appearance

  constructor(appearance: Appearance = 'system') {
    this.appearance = appearance
  }

  async getAppearance(): Promise<Appearance> {
    return this.appearance
  }

  async setAppearance(appearance: Appearance): Promise<void> {
    this.appearance = appearance
  }
}
